import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { Agent, get } from "https";
import { join } from "path";
import createHttpsProxyAgent from "https-proxy-agent";

function makeCacheDir(name: string) {
  const dir = join("node_modules", ".cache", name);
  mkdirSync(dir, { recursive: true });
  return (file: string) => join(dir, file);
}

const fetchCache = makeCacheDir("fetch");
async function fetch(url: string, cacheFile: string) {
  const cachePath = fetchCache(cacheFile);
  if (existsSync(cacheFile)) {
    return readFileSync(cachePath, "utf8");
  }
  let agent: Agent | undefined;
  if (process.env.http_proxy) {
    agent = createHttpsProxyAgent(process.env.http_proxy);
  }
  return new Promise<string>((resolve, reject) => {
    get(url, { agent }, async (res) => {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of res) chunks.push(chunk);
        const data = Buffer.concat(chunks).toString();
        writeFileSync(cachePath, data);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
}

function json(url: string, cacheFile: string) {
  return fetch(url, cacheFile).then(JSON.parse);
}

const baseUrl = "https://raw.githubusercontent.com/braver/FileIcons/master";

console.log(". icons | colors");
const [icons, colors] = await Promise.all([
  json(`${baseUrl}/build/icons.json`, "icons.json"),
  json(`${baseUrl}/build/colors.json`, "colors.json"),
]);

const result: Record<string, string> = {};

const tasks: Promise<unknown>[] = [];
for (const [name, color] of Object.entries(icons)) {
  const type = name.replace(/^file_type_/, "");
  tasks.push(
    fetch(`${baseUrl}/build/assets/${name}.svg`, `${name}.svg`).then((svg) => {
      const hsl: string = colors[color as string];
      const rendered = svg.replace('xmlns="http://www.w3.org/2000/svg" ', "").replace("#000", hsl);
      console.log(".", type);
      result[type] = rendered;
    })
  );
}
await Promise.all(tasks);

writeFileSync("scripts/file-icons.json", JSON.stringify(result, null, 2));
