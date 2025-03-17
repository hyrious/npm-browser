export interface IService {
  // This field does not actually exist.
  readonly _serviceBrand: undefined;
}

export interface IServiceIdentifier<T> {
  // This field does not actually exist.
  readonly type: T;
}

export function createServiceIdentifier<T>(id: string): IServiceIdentifier<T> {
  return id as unknown as IServiceIdentifier<T>;
}

export interface IServiceCollection extends IService {
  get<T extends IService>(id: IServiceIdentifier<T>): T;
  set<T extends IService>(id: IServiceIdentifier<T>, instance: T): void;
  register<T extends IService>(id: IServiceIdentifier<T>, constructor: new () => T): void;
}

export const IServiceCollection = createServiceIdentifier<IServiceCollection>('IServiceCollection');

class ServiceCollection implements IServiceCollection {
  declare readonly _serviceBrand: undefined;
  private readonly _serviceConstructors: Map<IServiceIdentifier<any>, new () => IService> = new Map();
  private readonly _services: Map<IServiceIdentifier<any>, IService> = new Map();
  private readonly _resolving: Set<IServiceIdentifier<any>> = new Set();

  constructor() {
    this.set(IServiceCollection, this);
  }

  get<T extends IService>(id: IServiceIdentifier<T>): T {
    if (this._resolving.has(id)) {
      throw new Error(`Circular dependency detected: ${this._resolving}`);
    }
    this._resolving.add(id);
    let service = this._services.get(id);
    if (!service) {
      const ServiceImpl = this._serviceConstructors.get(id);
      if (!ServiceImpl) {
        throw new Error(`Service not found: ${id}`);
      }
      service = new ServiceImpl();
      this._services.set(id, service);
    }
    this._resolving.delete(id);
    return service as T;
  }

  set<T extends IService>(id: IServiceIdentifier<T>, instance: T): void {
    if (this._serviceConstructors.has(id)) {
      throw new Error(`Service already registered: ${id}`);
    }
    this._services.set(id, instance);
  }

  register<T extends IService>(id: IServiceIdentifier<T>, constructor: new () => T): void {
    if (this._serviceConstructors.has(id)) {
      throw new Error(`Service already registered: ${id}`);
    }
    this._serviceConstructors.set(id, constructor);
  }
}

export const $services: IServiceCollection = new ServiceCollection();
