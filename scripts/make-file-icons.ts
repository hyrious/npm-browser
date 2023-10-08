import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { Agent, get } from 'https'
import { join } from 'path'
import { HttpsProxyAgent } from 'https-proxy-agent'

function makeCacheDir(name: string) {
  const dir = join('node_modules', '.cache', name)
  mkdirSync(dir, { recursive: true })
  return (file: string) => join(dir, file)
}

let agent: Agent | undefined
if (process.env.http_proxy) {
  agent = new HttpsProxyAgent(process.env.http_proxy)
}

const fetchCache = makeCacheDir('fetch')
async function fetch(url: string, cacheFile: string) {
  const cachePath = fetchCache(cacheFile)
  if (existsSync(cachePath)) {
    return readFileSync(cachePath, 'utf8')
  }
  return new Promise<string>((resolve, reject) => {
    get(url, { agent }, async (res) => {
      try {
        const chunks: Buffer[] = []
        for await (const chunk of res) chunks.push(chunk)
        const data = Buffer.concat(chunks).toString()
        writeFileSync(cachePath, data)
        resolve(data)
      } catch (error) {
        reject(error)
      }
    })
  })
}

function json(url: string, cacheFile: string) {
  return fetch(url, cacheFile).then(JSON.parse)
}

const baseUrl = 'https://raw.githubusercontent.com/braver/FileIcons/master'

console.log('. icons | colors')
const [icons, colors] = await Promise.all([
  json(`${baseUrl}/build/icons.json`, 'icons.json'),
  json(`${baseUrl}/build/colors.json`, 'colors.json'),
])

const result: Record<string, string> = {}

const tasks: Promise<unknown>[] = []
for (const [name, color] of Object.entries(icons)) {
  const type = name.replace(/^file_type_/, '')
  tasks.push(
    fetch(`${baseUrl}/build/assets/${name}.svg`, `${name}.svg`).then((svg) => {
      const hsl: string = colors[color as string]
      const rendered = svg
        .replace(/[\s\S]+?(?=<svg)/, '')
        .replace(/\bxmlns\S+ /g, '')
        .replace(/\bxml:\S+ /g, '')
        .replace(/\bversion=\S+ /g, '')
        .replace(/\baria-hidden=\S+ /g, '')
        .replace(/\brole=\S+ /g, '')
        .replace('#000', hsl)
        .replace('width="100%" height="100%" ', '') // fix svelte
      console.log('.', type)
      result[type] = rendered
    }),
  )
}
await Promise.all(tasks)

const sorted = Object.fromEntries(Object.entries(result).sort((a, b) => a[0].localeCompare(b[0])))

writeFileSync('scripts/file-icons.json', JSON.stringify(sorted, null, 2))
