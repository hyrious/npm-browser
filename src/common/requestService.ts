import { Dict } from './base';
import { IRequestOptions } from './ipc';
import { createServiceIdentifier, IService } from './service';

export const IRequestService = createServiceIdentifier<IRequestService>('IRequestService');

export interface IRequestService extends IService {
  request<T>(options: IRequestOptions): Promise<T>;
}

export class RequestService implements IRequestService {
  declare readonly _serviceBrand: undefined;

  async request<T>({ url, method, body, headers }: IRequestOptions): Promise<T> {
    const response = await fetch(url, { method, headers: Dict.coalesce(headers), body });
    if (!response.ok) {
      throw new Error((await response.text()) || response.statusText);
    }
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('octet-stream')) {
      return await response.bytes() as unknown as T;
    } else {
      return await response.json();
    }
  }
}
