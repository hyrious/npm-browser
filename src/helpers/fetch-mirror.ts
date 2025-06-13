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
          let version = extractTgzVersion(path)
          let meta = await fetchRegistry(url.slice(0, url.indexOf('/-/'))).then((r) => r.json())
          p = fetch(`https://netlify.hyrious.me/proxy/${meta.versions[version].dist.tarball}`, init)
        } else {
          p = fetch(`https://netlify.hyrious.me/proxy/${prefix}/${end}`, init)
        }
      } else {
        p = fetch(`${prefix}/${end}`, init)
      }
    } else {
      p = fetchHeuristic(input, init, (m: string) => `${m}/${end}`)
    }

    return p
  }

  return fetch(input, init)
}

// path = '@foo/bar/-/bar-1.0.0.tgz'.
// path = '@foo-foo/bar-bar/-/bar-bar-1.0.0.tgz'.
function extractTgzVersion(path: string): string {
  const i = path.indexOf('/-/')
  if (i >= 0) {
    const name = path.slice(0, i).split('/').pop()!
    const basename = path.slice(i + 3, -4) // 'bar-bar-1.0.0'
    if (basename.startsWith(name + '-')) {
      return basename.slice(name.length + 1)
    }
  }
  throw new Error('Invalid tarball path: ' + path)
}

function fetchHeuristic(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  getMirrorURL: (mirror: string) => string,
): Promise<Response> {
  const mirror = sessionStorage.getItem('mirror')
  const n = mirror ? Number.parseInt(mirror) : -2
  if (n === -1) {
    // Offcial then fallbacks to mirrors
    return fetchSequence([input, ...mirrors.map(getMirrorURL)], init, (i) => {
      sessionStorage.setItem('mirror', String(i - 1))
    })
  } else if (n >= 0 && mirrors[n]) {
    // Mirrors[n] then fallbacks to official
    const imap: number[] = [n, -1]
    const sequence: (RequestInfo | URL)[] = [getMirrorURL(mirrors[n]), input]
    for (let i = 0; i < mirrors.length; i++) {
      if (i !== n) {
        imap.push(i)
        sequence.push(getMirrorURL(mirrors[i]))
      }
    }
    return fetchSequence(sequence, init, (i) => {
      sessionStorage.setItem('mirror', String(imap[i]))
    })
  } else {
    // Race fetch, then remember the faster one
    return fetchParallel([input, ...mirrors.map(getMirrorURL)], init, (i) => {
      sessionStorage.setItem('mirror', String(i - 1))
    })
  }
}

function fetchParallel(
  sequence: (RequestInfo | URL)[],
  init: RequestInit | undefined,
  done: (i: number) => void,
): Promise<Response> {
  init?.signal?.throwIfAborted()
  const abortControllers = sequence.map(() => new AbortController())
  init?.signal?.addEventListener('abort', () => abortControllers.forEach((a) => a.abort()))

  let resolve!: (res: Response) => void, reject!: (err: unknown) => void
  const promise = new Promise<Response>((c, e) => {
    resolve = c
    reject = e
  })

  let lastError: unknown,
    finished = false
  const tasks: Promise<unknown>[] = []
  for (let i = 0; i < sequence.length; i++) {
    const url = sequence[i]
    tasks.push(
      fetch(url, { ...init, signal: abortControllers[i].signal }).then(
        (response) => {
          abortControllers.forEach((a, j) => {
            if (i !== j) a.abort()
          })
          done(i)
          resolve(response)
          finished = true
          lastError = void 0
        },
        (err) => {
          lastError = err
        },
      ),
    )
  }

  Promise.allSettled(tasks).then(() => {
    if (!finished) reject(lastError)
  })

  return promise
}

async function fetchSequence(
  sequence: (RequestInfo | URL)[],
  init: RequestInit | undefined,
  done: (i: number) => void,
): Promise<Response> {
  let i = 0,
    response: Response | undefined,
    lastError: unknown
  for (const url of sequence) {
    try {
      response = await fetch(url, init)
      if (response.ok) {
        done(i)
        return response
      }
    } catch (err) {
      lastError = err
    }
    i++
  }
  if (response) return response
  throw lastError
}

function normalize(url: string | null): string {
  if (!url) return 'https://registry.npmjs.org'
  if (url === 'npmmirror') return 'https://registry.npmmirror.com'
  if (url === 'github') return 'https://npm.pkg.github.com'
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url
  if (url.endsWith('/')) url = url.slice(0, -1)
  return url
}
