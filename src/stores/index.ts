import { acceptHMRUpdate, defineStore } from 'pinia'
import { parse } from '../helpers/query'

export const customRegistry = new URL(location.href).searchParams.get('registry')

export const useApplicationStore = defineStore('app', () => {
  const packageName = ref('')
  const packageVersion = ref('')
  const path = ref('')
  const line = ref(0)
  const lineTo = ref(-1)
  const diffVersion = ref('')

  const fromQuery = () => {
    const search = new URL(location.href).searchParams
    const query = parse(search.get('q') || location.hash.slice(1))
    if (query) {
      packageName.value = query.name
      packageVersion.value = query.version
      path.value = query.path
      line.value = query.line
      lineTo.value = query.lineTo
    }
    const diff = search.get('diff')
    if (diff) {
      diffVersion.value = diff
    }
    return search
  }

  const search = fromQuery()

  const snapshot = () => ({
    name: packageName.value,
    version: packageVersion.value,
    path: path.value,
    line: line.value,
    lineTo: lineTo.value,
    diff: diffVersion.value,
  })

  watchEffect(() => {
    let query = packageName.value
    if (packageVersion.value) query += `@${packageVersion.value}`
    if (path.value) {
      query += path.value
      if (line.value) {
        query += `:${line.value}`
        if (lineTo.value > 0 && lineTo.value !== line.value) query += `-${lineTo.value}`
      }
    }
    let diff = diffVersion.value
    if (query && (search.get('q') !== query || search.get('diff') !== diff)) {
      search.set('q', query)
      diff ? search.set('diff', diff) : search.delete('diff')
      // decode here to preserve '@', '/' symbols, hopefully it should not cause any issues
      const url = '?' + decodeURIComponent(search.toString())
      history.replaceState(snapshot(), '', url)
    }
  })

  watch(
    [packageName, packageVersion, path, diffVersion],
    ([name, version, path, diff]) => {
      const suffix = version ? (diff ? `{${diff} → ${version}}` : version) : ''
      const normal_path = path.replace(/^\/\w+\//, '')
      if (path && name && version) {
        document.title = `${normal_path} · ${name}@${suffix}`
      } else if (name) {
        document.title = version ? `${name}@${suffix}` : name
      } else {
        document.title = 'NPM Browser'
      }
    },
    { immediate: true },
  )

  return {
    packageName,
    packageVersion,
    path,
    line,
    lineTo,
    diffVersion,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useApplicationStore, import.meta.hot))
}
