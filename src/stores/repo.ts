import { get_git_repo } from '../helpers/utils'

export const publishTime = ref(0)

const decoder = new TextDecoder()
export const pkg = computed(() => {
  const f = files.value.find((e) => trim_root(e.name) === 'package.json')
  if (!f) return ''
  return JSON.parse(decoder.decode(f.buffer))
})
export const repo = computed(() => get_git_repo(pkg.value))
export const desc = computed(() => pkg.value.description)

function trim_root(str: string) {
  const i = str.indexOf('/')
  if (i !== -1) str = str.slice(i + 1)
  return str
}
