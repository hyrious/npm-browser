// query = "<vue>[@3]/path/to/file.js:line"
// match[1] = "vue"
// match[2] = "@3"
// match[3] = "/path/to/file.js:line"
const RE = /^((?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*)(@[^/]+)?(\/[^:]+)?(:\d+)?(-\d+)?$/

export function parse(query: string) {
  let name = ''
  let version = ''
  let path = ''
  let line = 0
  let lineTo = -1

  const match = RE.exec(query)
  if (!match) return null

  name = match[1]
  version = match[2] ? match[2].slice(1) : ''
  path = match[3] || ''
  line = match[4] ? parseInt(match[4].slice(1)) : 0
  lineTo = match[5] ? parseInt(match[5].slice(1)) : -1

  return { name, version, path, line, lineTo }
}
