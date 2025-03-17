import { Dict } from './base';

export interface IRequestOptions {
  url: string;
  method?: string;
  headers?: Dict<string | undefined>;
  body?: string;
}

export interface IServer {
  request<T>(options: IRequestOptions): Promise<T>;
}

export const endpoint = '/__npm-browser';

declare global {
  interface ImportMetaEnv {
    readonly NPM: boolean;
  }
}

export const enableServer = import.meta.env.NPM && !import.meta.env.SSR;

export function isEventName(name: string): boolean {
  return name.startsWith('on') && name[2] === name[2].toLowerCase();
}

export { parse, stringify } from 'structured-clone-es';
