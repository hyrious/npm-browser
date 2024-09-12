let deps = import('./prettier.deps')

let mod: typeof import('./prettier.deps') | undefined
let id = 0

export function format(code: string, lang: string, then: (formatted: string) => void) {
  if (mod) {
    if (lang in mod && typeof mod[lang] === 'function') {
      const formatFn = mod[lang as 'js']
      const taskId = ++id
      formatFn(code).then(flush.bind(null, taskId, then))
    }
  } else {
    deps.then((mod_) => {
      mod = mod_
      format(code, lang, then)
    })
  }
}

export function cancel() {
  ++id
}

function flush(taskId: number, then: (formatted: string) => void, formatted: string) {
  if (id === taskId) then(formatted)
}
