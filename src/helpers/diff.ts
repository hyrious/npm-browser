import DiffWorker from './diff.worker?worker'

function count_lines(a: string[]) {
  const count = new Map<string, [count: number, index: number]>()
  for (let i = a.length - 1; i >= 0; i--) {
    const line = a[i]
    const counter = count.get(line)
    if (counter) {
      counter[0]++
      counter[1] = i
    } else {
      count.set(line, [1, i])
    }
  }
  return count
}

function split(a: string[], b: string[]) {
  const a_lines = count_lines(a)
  const b_lines = count_lines(b)

  let min_count = 114514
  let max_length = 0
  let split_at: [a_index: number, b_index: number] | undefined

  for (const line of a_lines.keys()) {
    const base = a_lines.get(line)!
    const counter = b_lines.get(line) // [count, index]
    if (counter) {
      const count = base[0] + counter[0]
      if (count < min_count || (count === min_count && line.length > max_length)) {
        min_count = count
        max_length = line.length
        split_at = [base[1], counter[1]]
      }
    }
  }

  return split_at
}

const MAX_LINES = 10000
function split_rec(a: string[], b: string[], i = 0, j = 0): [a_index: number, b_index: number][] {
  if (a.length < MAX_LINES && b.length < MAX_LINES) {
    return []
  }
  const split_at = split(a, b)
  if (split_at) {
    const [x, y] = split_at
    const ret = split_rec(a.slice(0, x), b.slice(0, y), i, j)
    ret.push([i + x, j + y])
    return ret.concat(split_rec(a.slice(x + 1), b.slice(y + 1), i + x + 1, j + y + 1))
  } else {
    return []
  }
}

const workers = Array.from({ length: navigator.hardwareConcurrency || 1 }, () => new DiffWorker())

interface Payload {
  id: number
  a: string
  b: string
}

type Diffs = [type: -1 | 0 | 1, line: string][]

interface Result {
  id: number
  diffs: Diffs
}

let id_ = 0
const tasks = new Map<number, (result: Diffs) => void>()
function onmessage({ data }: MessageEvent<Result>) {
  const resolve = tasks.get(data.id)
  if (resolve) {
    resolve(data.diffs)
    tasks.delete(data.id)
  }
}
for (const worker of workers) {
  worker.onmessage = onmessage
}

function call_diff_worker(a: string, b: string) {
  const id = id_++
  const worker = workers[id % workers.length]
  return new Promise<Diffs>((resolve) => {
    tasks.set(id, resolve)
    worker.postMessage({ id, a, b } satisfies Payload)
  })
}

function join(lines: string[]) {
  return lines.join('\n') + '\n'
}

// Multi-thread Diff!
// Note: this function is not needed when using @codemirror/merge
// We only need it to render the diff view in `line by line` mode.
export function diff(a: string, b: string) {
  const a_lines = a.split('\n')
  const b_lines = b.split('\n')
  const splits = split_rec(a_lines, b_lines)
  const p_tasks: Promise<Diffs>[] = []
  let [i, j] = [0, 0]
  for (let [x, y] of splits) {
    p_tasks.push(call_diff_worker(join(a_lines.slice(i, x)), join(b_lines.slice(j, y))))
    ;[i, j] = [x, y]
  }
  p_tasks.push(call_diff_worker(join(a_lines.slice(i)), join(b_lines.slice(j))))
  return Promise.all(p_tasks).then((arr) => arr.flat())
}
