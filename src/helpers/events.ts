import { observable } from '@hyrious/utils'

export const events = observable<{
  'search': string
  'jump': string
  'jsdelivr': { ev: MouseEvent | KeyboardEvent; path: string }
  'try-jump': { url: string; ctrl: boolean }
}>()
