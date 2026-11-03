import { parse, type YamlParseError } from './yaml'

export function parseFrontMatter(source: string) {
  const match = /^\uFEFF?---[^\S\r\n]*\r?\n([\s\S]*?)^---[^\S\r\n]*(?:\r?\n|$)/m.exec(source)
  if (!match || match.index !== 0) return

  const content = match[1]
  const errors: YamlParseError[] = []
  const header = parse(content, errors)
  if (header?.type !== 'map' || errors.length) return
  // The upstream parser can stop before an unrecognized line. Keep that content visible.
  if (
    content
      .slice(header.endOffset)
      .split('\n')
      .some((line) => !/^\s*(?:#.*)?$/.test(line))
  )
    return

  const entries = header.properties.map(({ key, value }) => ({
    key: key.value,
    value: value.type === 'scalar' ? value.value : content.slice(value.startOffset, value.endOffset),
  }))
  if (entries.length) return { entries, body: source.slice(match[0].length) }
}
