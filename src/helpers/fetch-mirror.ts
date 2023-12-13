const mirrors: string[] = ['https://registry.npmmirror.com']

export function fetch_with_mirror_retry(input: RequestInfo | URL, init?: RequestInit) {
  let url: string = input as string
  if (input instanceof URL) {
    url = input.href
  }

  if (url.startsWith('https://registry.npmjs.org/')) {
    const end = url.slice(27)
    let p = fetch(input, addTimeout(init))
    for (let index = 0; index < mirrors.length; ++index) {
      const mirror = mirrors[index]
      p = p.catch(() => fetch(`${mirror}/${end}`, addTimeout(init, 2000 + index * 1000)))
    }
    return p
  }

  return fetch(input, init)
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
