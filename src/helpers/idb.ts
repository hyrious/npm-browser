import * as idb from "idb-keyval";

const NPM_PACKAGES = idb.createStore("npm", "packages");

export function get(name: string, version: string) {
  return idb.get<Uint8Array<ArrayBuffer>>(`${name}@${version}`, NPM_PACKAGES);
}

export function set(name: string, version: string, tgz: Uint8Array) {
  return idb.set(`${name}@${version}`, tgz, NPM_PACKAGES);
}

export function cached() {
  return idb.keys(NPM_PACKAGES);
}

export function remove(key: string) {
  return idb.del(key, NPM_PACKAGES);
}

export function removeAll() {
  return idb.clear(NPM_PACKAGES);
}

// for debugging
Object.assign(window, {
  cached,
  idb: { cached, get, set, NPM_PACKAGES },
});
