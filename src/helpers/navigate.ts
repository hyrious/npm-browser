import { RangeSet } from '@codemirror/state'
import { Decoration, EditorView, MatchDecorator, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view'
import { events } from './events'

// https://discuss.codemirror.net/t/avoid-replacing-match-in-matchdecorator-decorator-to-add-link-icon-after-urls

class LinkWidget extends WidgetType {
  constructor(readonly start: number, readonly end: number, readonly url: string) {
    super()
  }
  eq(other: LinkWidget): boolean {
    return other.start === this.start && other.end === this.end && other.url === this.url
  }
  toDOM(): HTMLElement {
    const a = document.createElement('a')
    a.textContent = this.url
    a.className = 'cm-link'
    a.onclick = this.navigate.bind(this)
    return a
  }
  navigate(ev: MouseEvent) {
    ev.preventDefault()
    events.emit('try-jump', { url: this.url, ctrl: ev.ctrlKey || ev.metaKey })
  }
}

const linkDecorator = new MatchDecorator({
  regexp: /\brequire\((?:'([^']+)'|"([^"]+)")\)|\bfrom\s*(?:'([^']+)'|"([^"]+)")/g,
  decorate(add, from, to, match, view) {
    const start = from + match[0].match(/['"]/)!.index! + 1
    const url = match[1] || match[2] || match[3] || match[4]
    const end = start + url.length
    add(start, end, Decoration.replace({ widget: new LinkWidget(start, end, url) }))
  },
})

const linkPlugin = ViewPlugin.fromClass(
  class LinkPlugin {
    decorator = linkDecorator
    decorations: RangeSet<Decoration>
    constructor(view: EditorView) {
      this.decorations = this.decorator.createDeco(view)
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) {
        this.decorations = this.decorator.updateDeco(u, this.decorations)
      }
    }
  },
  { decorations: (v) => v.decorations },
)

export { linkPlugin }

export function path_resolve(here: string, to: string) {
  const parts = here.split('/')
  const to_parts = to.split('/')
  parts.pop()
  for (const part of to_parts) {
    if (part === '..') {
      parts.pop()
    } else if (part !== '.') {
      parts.push(part)
    }
  }
  return parts.join('/')
}
