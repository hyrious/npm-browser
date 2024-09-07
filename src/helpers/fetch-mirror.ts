const mirrors: string[] = ['https://registry.npmmirror.com']

export async function fetchRegistry(input: RequestInfo | URL, init?: RequestInit) {
  let url: string = input as string
  if (input instanceof URL) {
    url = input.href
  }

  if (url.startsWith('https://registry.npmjs.org/')) {
    const end = url.slice(27)
    const search = new URL(location.href).searchParams

    let p: Promise<Response>
    if (search.has('registry')) {
      const prefix = normalize(search.get('registry'))
      if (prefix === 'https://npm.pkg.github.com') {
        let token = sessionStorage.getItem('ghtoken')
        if (!token) {
          token = prompt('Enter the GitHub Token:')
          if (!token) return Promise.reject(new Error('No GitHub Token, failed to fetch ' + url))
          sessionStorage.setItem('ghtoken', token)
        }
        let headers = new Headers(init?.headers)
        headers.set('Authorization', `Bearer ${token}`)
        init = { ...init, headers }
        // The tarball URL is different from the official one.
        let path = end
        if (path.endsWith('.tgz')) {
          let version = path.match(/\-([-\w\d\.]+)\.tgz$/)![1]
          let meta = await fetchRegistry(url.slice(0, url.indexOf('/-/'))).then((r) => r.json())
          p = fetch(`https://netlify.hyrious.me/proxy/${meta.versions[version].dist.tarball}`, init)
        } else {
          p = fetch(`https://netlify.hyrious.me/proxy/${prefix}/${end}`, init)
        }
      } else {
        p = fetch(`${prefix}/${end}`, init)
      }
    } else {
      p = fetch(input, addTimeout(init))
      for (let index = 0; index < mirrors.length; ++index) {
        const mirror = mirrors[index]
        p = p.catch(() => fetch(`${mirror}/${end}`, addTimeout(init, 2000 + index * 1000)))
      }
    }

    return p
  }

  return fetch(input, init)
}

function normalize(url: string | null): string {
  if (!url) return 'https://registry.npmjs.org'
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url
  if (url.endsWith('/')) url = url.slice(0, -1)
  return url
}

function addTimeout(init: RequestInit | undefined, timeout = 2000): RequestInit {
  if (init && init.signal) {
    init.signal = combineSignal(init.signal, AbortSignal.timeout(timeout))
  } else if (init) {
    init.signal = AbortSignal.timeout(timeout)
  } else {
    init = { signal: AbortSignal.timeout(timeout) }
  }
  return init
}

function combineSignal(a: AbortSignal, b: AbortSignal) {
  const controller = new AbortController()
  const signal = controller.signal
  const onabort = () => {
    controller.abort()
    a.removeEventListener('abort', onabort)
    b.removeEventListener('abort', onabort)
  }
  a.addEventListener('abort', onabort)
  b.addEventListener('abort', onabort)
  return signal
}
