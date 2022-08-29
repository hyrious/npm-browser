import filenamify from "filenamify";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { Agent, get } from "https";
import createHttpsProxyAgent from "https-proxy-agent";
import { join } from "path";

function makeCacheDir(namespace: string) {
  const dir = join("node_modules", ".cache", namespace);
  mkdirSync(dir, { recursive: true });
  return (file: string) => join(dir, file);
}

const fetchCache = makeCacheDir("fetch");
export function fetch(url: string, cacheId?: string) {
  const cacheFile = fetchCache(filenamify(cacheId || url));
  if (existsSync(cacheFile)) {
    return Promise.resolve(readFileSync(cacheFile, "utf8"));
  }
  let agent: Agent | undefined;
  if (process.env.http_proxy) {
    agent = createHttpsProxyAgent(process.env.http_proxy);
  }
  return new Promise<string>((resolve, reject) =>
    get(url, { agent }, async (res) => {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of res) chunks.push(chunk);
        const data = Buffer.concat(chunks).toString();
        writeFileSync(cacheFile, data);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    })
  );
}

export async function json(url: string, cacheId?: string) {
  const text = await fetch(url, cacheId);
  return JSON.parse(text);
}
