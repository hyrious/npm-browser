import { format, Options } from 'prettier'
import babel from 'prettier/plugins/babel'
import estree from 'prettier/plugins/estree'
import typescript from 'prettier/plugins/typescript'
import markdown from 'prettier/plugins/markdown'
import postcss from 'prettier/plugins/postcss'
import html_ from 'prettier/plugins/html'

const options: Options = {
  printWidth: 110,
  singleQuote: true,
  quoteProps: 'consistent',
  semi: false,
}

export const js = (code: string) => format(code, { parser: 'babel', plugins: [babel, estree], ...options })
export const ts = (code: string) =>
  format(code, { parser: 'typescript', plugins: [typescript, estree], ...options })
export const md = (code: string) => format(code, { parser: 'markdown', plugins: [markdown], ...options })
export const css = (code: string) => format(code, { parser: 'css', plugins: [postcss], ...options })
export const json = (code: string) =>
  format(code, { parser: 'json-stringify', plugins: [babel, estree], ...options })
export const html = (code: string) => format(code, { parser: 'html', plugins: [html_], ...options })
