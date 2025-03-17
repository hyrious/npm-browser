export type { Data } from 'pako';

export type Dict<T> = { [key: string]: T };

export namespace Dict {
  export function coalesce<T>(dict: Dict<T | undefined> | undefined): Dict<T> | undefined {
    if (!dict) { return undefined; }
    const result: Dict<T> = Object.create(null);
    for (const key in dict) {
      if (dict[key] !== undefined) {
        result[key] = dict[key]!;
      }
    }
    return result;
  }
}

export type Writable<T> = { -readonly [K in keyof T]: T[K] };

export function not(b: boolean): true | undefined {
  return b ? undefined : true;
}

export function singleton<T extends Function>(this: unknown, fn: T): T {
  const this_ = this;
  let didRun = false;
  let result: unknown;

  return function () {
    if (didRun) { return result; }

    didRun = true;
    result = fn.apply(this_, arguments);
    return result;
  } as unknown as T;
}

export function isIterable<T = any>(a: any): a is Iterable<T> {
  return a && typeof a === 'object' && typeof a[Symbol.iterator] === 'function';
}

export interface IDisposable {
  dispose(): void;
}

export const disposableNone: IDisposable = Object.freeze({ dispose() { } });

export function toDisposable(dispose: () => void): IDisposable {
  return { dispose: singleton(dispose) };
}

export function isDisposable(obj: any): obj is IDisposable {
  return obj && typeof obj === 'object' && typeof obj.dispose === 'function';
}

export function dispose<T extends IDisposable>(disposable: T): T;
export function dispose<T extends IDisposable>(disposable: T | undefined): T | undefined;
export function dispose<T extends IDisposable, A extends Iterable<T> = Iterable<T>>(disposables: A): A;
export function dispose<T extends IDisposable>(disposables: Array<T>): Array<T>;
export function dispose<T extends IDisposable>(disposables: ReadonlyArray<T>): ReadonlyArray<T>;
export function dispose<T extends IDisposable>(a: T | Iterable<T> | undefined): any {
  if (isIterable(a)) {
    const errors: any[] = [];

    for (const d of a) {
      if (d) {
        try {
          d.dispose();
        } catch (e) {
          errors.push(e);
        }
      }
    }

    if (errors.length === 1) {
      throw errors[0];
    } else if (errors.length > 1) {
      throw new AggregateError(errors, 'Multiple errors occurred during disposing');
    }

    return Array.isArray(a) ? [] : a;
  } else if (a) {
    a.dispose();
    return a;
  }
}

export abstract class Disposable implements IDisposable {
  private readonly _toDispose = new Set<IDisposable>();
  private _disposed = false;

  protected _register<T extends IDisposable>(disposable: T): T {
    if (this._disposed) {
      disposable.dispose();
    } else {
      this._toDispose.add(disposable);
    }
    return disposable;
  }

  dispose(): void {
    if (this._disposed) { return; }
    this._disposed = true;
    try {
      dispose(this._toDispose);
    } finally {
      this._toDispose.clear();
    }
  }
}

export interface Event<T> {
  (listener: (e: T) => unknown): IDisposable;
}

export const eventNone: Event<any> = () => disposableNone;

type ListenerOrListeners<T> = Set<(data: T) => void> | [(data: T) => void] | undefined;

export interface EmitterOptions {
  readonly onWillAddFirstListener?: Function;
  readonly onDidRemoveLastListener?: Function;
}

export class Emitter<T> implements IDisposable {
  private _disposed?: true;
  private _event?: Event<T>;
  private _listeners?: ListenerOrListeners<T>;

  constructor(private readonly _options?: EmitterOptions) { }

  dispose(): void {
    if (this._disposed) { return; }
    this._disposed = true;
    this._listeners = undefined;
  }

  get event(): Event<T> {
    this._event ??= (callback: (e: T) => unknown): IDisposable => {
      if (this._disposed) { return disposableNone; }

      if (!this._listeners) {
        this._options?.onWillAddFirstListener?.(this);
        this._listeners = [callback];
      } else if (Array.isArray(this._listeners)) {
        this._listeners.push(callback);
        this._listeners = new Set(this._listeners);
      } else {
        this._listeners.add(callback);
      }

      return toDisposable(() => this.off(callback));
    };
    return this._event;
  }

  off(listener: (data: T) => unknown): void {
    if (this._listeners) {
      if (Array.isArray(this._listeners)) {
        if (this._listeners.includes(listener)) {
          this._listeners = undefined;
          this._options?.onDidRemoveLastListener?.(this);
        }
      } else {
        this._listeners.delete(listener);
        if (this._listeners.size === 0) {
          this._listeners = undefined;
          this._options?.onDidRemoveLastListener?.(this);
        }
      }
    }
  }

  fire(data: T): void {
    if (!this._listeners) { return; }
    for (const callback of this._listeners) {
      try { callback(data); }
      catch (e) { console.error(e); }
    }
  }
}

interface DOMEventEmitter {
  addEventListener(event: string, listener: Function): void;
  removeEventListener(event: string, listener: Function): void;
}

namespace Event {
  export function fromDOMEvent<T>(source: DOMEventEmitter, event: string, transform: (...args: any[]) => T = x => x): Event<T> {
    const fn = (...args: any[]) => emitter.fire(transform(...args));
    const emitter = new Emitter<T>({
      onWillAddFirstListener: () => source.addEventListener(event, fn),
      onDidRemoveLastListener: () => source.removeEventListener(event, fn),
    });
    return emitter.event;
  }
}

export class AbortError extends Error {
  constructor(message = 'The operation was aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

export function isAbortError(error: unknown): boolean {
  return !!error && error['name'] === 'AbortError';
}

export interface CancelablePromise<T> extends Promise<T> {
  cancel(): void;
}

export function createCancelablePromise<T>(callback: (signal: AbortSignal) => Promise<T>): CancelablePromise<T> {
  const abortController = new AbortController();
  const task = callback(abortController.signal);
  const promise = new Promise<T>((resolve, reject) => {
    const onAbort = Event.fromDOMEvent<void>(abortController.signal, 'abort');
    const subscription = onAbort(() => {
      subscription.dispose();
      reject(new AbortError('Promise was cancelled'));
    });
    Promise.resolve(task).then(value => {
      subscription.dispose();
      if (!abortController.signal.aborted) {
        resolve(value);
      } else if (isDisposable(value)) {
        value.dispose();
      }
    }, err => {
      subscription.dispose();
      reject(err);
    });
  });

  return Object.assign(promise, { cancel: () => abortController.abort() });
}
