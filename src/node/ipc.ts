import { IRequestOptions, IServer } from '../common/ipc';
import { RequestService } from '../common/requestService';

export function createServer(): IServer {
  const requestService = new RequestService();

  return {
    request<T>(options: IRequestOptions): Promise<T> {
      return requestService.request<T>(options);
    },
  };
}
