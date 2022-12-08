/// <reference lib="webworker" />

// @ts-ignore
import { diff_match_patch } from './diff.vendor.js'

addEventListener('message', ({ data }: MessageEvent<{ id: number; a: string; b: string }>) => {
  var dmp = new diff_match_patch()
  var info = dmp.diff_linesToChars_(data.a, data.b)
  var diffs = dmp.diff_main(info.chars1, info.chars2, false)
  dmp.diff_charsToLines_(diffs, info.lineArray)
  postMessage({ id: data.id, diffs })
})
