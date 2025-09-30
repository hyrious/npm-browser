import { marked, Renderer } from 'marked'
import { escapeHTML } from 'fast-escape-html'
import { markedHighlight } from 'marked-highlight'
import { gfmHeadingId, resetHeadings } from 'marked-gfm-heading-id'
import markedLinkifyIt from 'marked-linkify-it'
import markedFootnote from 'marked-footnote'
import markedAlert from 'marked-alert'
import renderMathInElement from 'katex/contrib/auto-render'
import { highlight } from './hljs'

let base_url = ''
export function set_base_url(url: string) {
  base_url = url
}

export async function update(source: string, to: HTMLElement, base_url: string) {
  resetHeadings()

  set_base_url(base_url)

  try {
    const html = await marked.parse(source, { async: true })

    to.innerHTML = html

    // render KaTeX on next frame
    requestAnimationFrame(function postprocess() {
      renderMathInElement(to, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      })
    })
  } catch (err) {
    console.error(err)
    to.innerText = err + ''
  }
}

import full from 'markdown-it-emoji/lib/data/full.mjs'
import shortcuts from 'markdown-it-emoji/lib/data/shortcuts.mjs'

const safe_prefixes = ['#', 'http://', 'https://']
const fix_relative_url = (html: string, index: number) => {
  const end = html.indexOf('"', index)
  const url = html.slice(index, end)
  if (safe_prefixes.some((s) => url.startsWith(s))) return html
  const path = new URL(url, 'https://example.org').pathname
  const full_url = fix_redirect(base_url + path)
  return html.slice(0, index) + full_url + html.slice(end)
}
const fix_redirect = (url: string) => {
  if (url.includes('/blob/HEAD/')) {
    url = url.replace(/^https:\/\/github\.com\/https:\/\/github\.com/, 'https://github.com')
    if (is_image(url)) {
      url = url.replace(/^https:\/\/github\.com/, 'https://cdn.jsdelivr.net/gh')
      url = url.replace('/blob/HEAD/', '/')
    }
  }
  return url
}
const image_exts = ['.jpg', '.jpeg', '.png', '.svg', '.gif', '.webp', '.bmp', '.ico']
const is_image = (url: string) => {
  return image_exts.some((ext) => url.endsWith(ext))
}

marked.use(
  markedHighlight({
    async: true,
    highlight: (code, lang) => highlight(code, lang),
  }),
  gfmHeadingId(),
  markedLinkifyIt(),
  markedFootnote(),
  markedAlert(),
  {
    gfm: true,
    extensions: [
      {
        name: 'emoji',
        level: 'inline',
        start(src: string) {
          let index = src.match(/:[a-zA-Z0-9_\-\+]+:/)?.index
          if (index == null)
            for (const id in shortcuts)
              for (const pat of shortcuts[id]) if ((index = src.indexOf(pat)) >= 0) return index
          return index
        },
        tokenizer(src: string) {
          const match = /^:([a-zA-Z0-9_\-\+]+):/.exec(src)
          if (match && match[1] in full) {
            return {
              type: 'emoji',
              raw: match[0],
              text: full[match[1]],
            }
          }
        },
        renderer(token) {
          const codePoint = token.text.codePointAt(0).toString(16)
          return `<g-emoji class="g-emoji" alias="${token.text}" fallback-src="https://github.githubassets.com/images/icons/emoji/unicode/${codePoint}.png">${token.text}</g-emoji>`
        },
      },
    ],
    renderer: {
      // task list
      list({ items, ordered, start }) {
        let body = ''
        for (let i = 0; i < items.length; i++) {
          body += this.listitem(items[i])
        }
        const tag = ordered ? 'ol' : 'ul'
        const suffix = body.includes('<li class="task-list-item">')
          ? ' class="contains-task-list">'
          : ` start="${start}">`
        return '<' + tag + suffix + body + '</' + tag + '>'
      },
      listitem({ text, task, checked }) {
        if (task) {
          const suffix = checked
            ? 'class="task-list-item-checkbox" type="checkbox" checked>'
            : 'class="task-list-item-checkbox" type="checkbox">'
          text = text.replace('type="checkbox">', suffix)
          return '<li class="task-list-item">' + text + '</li>'
        }
        return false
      },
      // katex
      code({ text, lang, escaped }) {
        if (lang === 'math') {
          const code = text.replace(/\n$/, '') + '\n'
          return '<p>$$ ' + (escaped ? code : escapeHTML(code)) + ' $$</p>'
        }
        return false
      },
      // resolve relative links
      link(token) {
        let html = Renderer.prototype.link.call(this, token)
        if (html.startsWith('<a href="')) {
          html = fix_relative_url(html, 9)
        }
        return html
      },
      image(token) {
        let html = Renderer.prototype.image.call(this, token)
        if (html.startsWith('<img src="')) {
          html = fix_relative_url(html, 10)
        }
        return html
      },
      html({ text }) {
        let i
        if ((i = text.indexOf('<img src="')) !== -1) {
          text = fix_relative_url(text, i + 10)
        }
        if ((i = text.indexOf('<a href="')) !== -1) {
          text = fix_relative_url(text, i + 9)
        }
        return text
      },
    },
  },
)
