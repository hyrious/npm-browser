import { format, type Options } from 'prettier'

const babel = () => import('prettier/plugins/babel')
const estree = () => import('prettier/plugins/estree')
const typescript = () => import('prettier/plugins/typescript')
const markdown = () => import('prettier/plugins/markdown')
const postcss = () => import('prettier/plugins/postcss')
const html_ = () => import('prettier/plugins/html')

const options: Options = {
  printWidth: 110,
  singleQuote: true,
  quoteProps: 'consistent',
  semi: false,
}

const all = async (...deps: Promise<any>[]) => {
  const res = await Promise.all(deps)
  return res.map((mod) => mod.default)
}

export const js = async (code: string) =>
  format(code, { parser: 'babel', plugins: await all(babel(), estree()), ...options })

export const ts = async (code: string) =>
  format(code, { parser: 'typescript', plugins: await all(typescript(), estree()), ...options })

export const md = async (code: string) =>
  format(code, { parser: 'markdown', plugins: [await markdown()], ...options })

export const css = async (code: string) =>
  format(code, { parser: 'css', plugins: [await postcss()], ...options })

export const json = async (code: string) =>
  format(code, { parser: 'json-stringify', plugins: await all(babel(), estree()), ...options })

export const html = async (code: string) =>
  format(code, { parser: 'html', plugins: [await html_()], ...options })
