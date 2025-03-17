import { IRequestService, RequestService } from './common/requestService';
import { $services } from './common/service';
import { $server } from './browser/ipc';

if ($server) {
  $services.set(IRequestService, $server as IRequestService);
} else {
  $services.register(IRequestService, RequestService);
}
