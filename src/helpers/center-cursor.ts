import { PluginValue, ViewPlugin, ViewUpdate } from '@codemirror/view'

// Only enable this plugin 800ms after the editor is initialized.
let enabled = Date.now()
let enable_time = 800

export function enable_center_cursor(duration: number) {
  enabled = Date.now()
  enable_time = duration
}

// https://discuss.codemirror.net/t/cm6-scroll-to-middle/2924/4
class CenterCursorPlugin implements PluginValue {
  update(update: ViewUpdate) {
    if (update.transactions.some((tr) => tr.scrollIntoView) && Date.now() - enabled < enable_time) {
      let { view } = update
      view.requestMeasure({
        read() {
          const { from, to } = view.state.selection.main
          const mid = ((from + to) / 2) | 0
          return {
            cursor: view.coordsAtPos(mid),
            scroller: view.scrollDOM.getBoundingClientRect(),
          }
        },
        write({ cursor, scroller }) {
          if (cursor) {
            let curMid = (cursor.top + cursor.bottom) / 2
            let eltMid = (scroller.top + scroller.bottom) / 2
            if (Math.abs(curMid - eltMid) > 5) {
              view.scrollDOM.scrollTop += curMid - eltMid
            }
          }
        },
      })
    }
  }
}

export const centerCursor = ViewPlugin.fromClass(CenterCursorPlugin)
