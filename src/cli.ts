import * as fs from 'node:fs';
import http from 'node:http';
import sade from 'sade';
import sirv from 'sirv';
import FindMyWay from 'find-my-way';
import { name, version, description } from '../package.json';
import { endpoint, parse, stringify } from './common/ipc';
import { Event } from './common/base';
import { createServer } from './node/ipc';
import { textStream } from './node/base';

sade(name, true)
  .version(version)
  .describe(description)
  .option('-p, --port', 'Port to listen on', 3000)
  .example('./repo')
  .example('vite esbuild')
  .action(({ port = 3000, _: args }: { port: number; _: string[] }) => {
    const packages: string[] = [];
    let workspace = process.cwd();
    for (const arg of args) {
      if (fs.existsSync(arg) && fs.statSync(arg).isDirectory()) {
        workspace = arg;
      } else if (arg && /^[@\w]/.test(arg)) {
        packages.push(arg);
      } else {
        console.warn(`Skipping invalid argument: ${arg}`);
      }
    }
    startServer({ port, workspace, packages });
  })
  .parse(process.argv);

interface IServerOptions {
  readonly port: number;
  readonly workspace: string;
  readonly packages: string[];
}

function startServer(options: IServerOptions) {
  const router = FindMyWay();
  const rpc = createServer();

  router.get(`${endpoint}/:event`, async (req, res, params) => {
    const event = params.event!;
    if (typeof rpc[event] === 'function') {
      try {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        const disposable = (rpc[event] as Event<any>)((data) => {
          res.write(`data: ${stringify(data)}\n\n`);
        });
        req.on('close', () => disposable.dispose());
      } catch (err) {
        res.statusCode = 500;
        res.end(`ServerError: ${err}`);
      }
    } else {
      res.statusCode = 404;
      res.end(`Event not found: ${event}`);
    }
  });

  router.post(`${endpoint}/:command`, async (req, res, params) => {
    const command = params.command!;
    if (typeof rpc[command] === 'function') {
      try {
        const arg = parse(await textStream(req));
        const result = await rpc[command](arg);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(stringify(result));
      } catch (err) {
        res.statusCode = 500;
        res.end(`ServerError: ${err}`);
      }
    } else {
      res.statusCode = 404;
      res.end(`Command not found: ${command}`);
    }
  });

  const server = http.createServer(sirv(import.meta.dirname, {
    etag: true,
    setHeaders: res => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Range');
    },
    onNoMatch: router.lookup.bind(router),
  }));

  server.listen(options.port, () => {
    console.log(`serving http://localhost:${options.port}`);
  });
}
