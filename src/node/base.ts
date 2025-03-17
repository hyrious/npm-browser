import { IncomingMessage } from 'http';

export function textStream(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', chunk => { chunks.push(chunk); });
    request.on('end', () => { resolve(Buffer.concat(chunks).toString('utf8')); });
    request.on('error', reject);
  });
}
