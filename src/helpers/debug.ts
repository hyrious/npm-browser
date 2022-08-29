declare global {
  var DEBUG: boolean;
}

window.DEBUG = import.meta.env.DEV;

/**
 * ```js
 * window.DEBUG = 1
 * debug = createDebug('foo')
 * debug('hello')
 * ```
 */
export function createDebug(namespace: string) {
  return (...args: any[]) => DEBUG && console.log(`[${namespace}]`, ...args);
}
