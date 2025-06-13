const Threshold = 1000

export function is_maybe_minified(code: string): boolean {
  let prev = 0,
    maxTry = 1000,
    match: RegExpMatchArray | null,
    lineEndRegex = /\r?\n/g
  while (maxTry-- > 0 && (match = lineEndRegex.exec(code))) {
    if (match.index! - prev > Threshold) {
      return true
    }
  }
  return false
}
