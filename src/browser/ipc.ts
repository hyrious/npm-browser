import { Emitter } from '../common/base';
import { enableServer, endpoint, IServer, isEventName, parse, stringify } from '../common/ipc';

export function createRPC(): IServer {
  return new Proxy({}, {
    get(target, prop: string): any {
      if (isEventName(prop)) {
        let source: EventSource | undefined;
        const emitter = new Emitter<any>({
          onWillAddFirstListener: () => {
            source = new EventSource(`${endpoint}/${prop}`);
            source.onmessage = e => emitter.fire(parse(e.data));
          },
          onDidRemoveLastListener: () => {
            source?.close();
            source = undefined;
          },
        });
        return emitter.event;
      } else {
        return async (arg: any) => {
          const response = await fetch(`${endpoint}/${prop}`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'accept': 'application/json',
            },
            body: stringify(arg),
          });
          const text = await response.text();
          if (response.ok) {
            return parse(text);
          } else {
            throw new Error(`Error ${response.status}: ${text}`);
          }
        };
      }
    },
  }) as IServer;
}

export const $server = enableServer ? createRPC() : undefined;
