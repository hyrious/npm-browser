import { decode } from '@hyrious/utils'
import { diffViewLoading } from '../stores/code'
import { fetchRegistry } from './fetch-mirror'
import { get, set } from './idb'
import { extractPackage } from './untar'

let abortController: AbortController | null = null

export async function unpkg(query: string): Promise<string> {
  diffViewLoading.value = true
  try {
    if (customRegistry) {
      const [name, version, path] = parse(query)

      let buffer: ArrayBuffer
      const cached = await get(name, version)
      if (cached) {
        buffer = cached.buffer
      } else {
        let url = `https://registry.npmjs.org/${name}/-/${name.split('/').pop()}-${version}.tgz`
        abortController = new AbortController()
        const response = await fetchRegistry(url, { signal: abortController.signal })
        buffer = await response.arrayBuffer()
        customRegistry || (await set(name, version, new Uint8Array(buffer)))
      }

      let fileBuffer: ArrayBuffer | undefined
      await extractPackage(buffer, (file) => {
        if (match(file.name, path)) {
          fileBuffer = file.buffer
        }
      })

      if (fileBuffer) {
        return decode(new Uint8Array(fileBuffer))
      } else {
        throw new Error(`File '${path}' not found in package '${name}@${version}'`)
      }
    } else {
      const res = await fetch(`https://cdn.jsdelivr.net/npm/${query}`)
      const text = await res.text()
      return text ?? '/* empty */'
    }
  } catch (err) {
    console.error(err)
    return err + ''
  } finally {
    diffViewLoading.value = false
  }
}

const prefix = 'package/'
function match(raw: string, req: string): boolean {
  raw = normalize(raw)
  req = normalize(req)
  return raw === req
}

// '/package/file.js' -> 'file.js'
function normalize(raw: string) {
  raw = raw.replace(/\\/g, '/')
  if (raw[0] === '/') raw = raw.slice(1)
  if (raw.startsWith(prefix)) raw = raw.slice(prefix.length)
  return raw
}

// query = '@scope/pkg@0.1.0/file.js
function parse(query: string): [name: string, version: string, file: string] {
  const index = query.indexOf('@', 1)
  if (index >= 0) {
    const name = query.slice(0, index)
    const rest = query.slice(index + 1)
    const versionIndex = rest.indexOf('/')
    if (versionIndex >= 0) {
      const version = rest.slice(0, versionIndex)
      const file = rest.slice(versionIndex + 1)
      return [name, version, file]
    }
  }
  throw new Error(`Failed to resolve '${query}'`)
}
