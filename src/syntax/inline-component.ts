import type MarkdownIt from 'markdown-it'
import { parseBracketContent } from '../parse/brackets'

export interface MdcInlineComponentOptions {

}

const ALLOWED_PREV_CHARS = new Set([' ', '\t', '\n', '*', '_', '['])

export const MarkdownItInlineComponent: MarkdownIt.PluginWithOptions<MdcInlineComponentOptions> = (md) => {
  md.inline.ruler.after('entity', 'mdc_inline_component', (state, silent) => {
    const start = state.pos
    const char = state.src[start]

    // Must start with a colon
    if (char !== ':')
      return false

    // Allow at the start of content, or after whitespace/punctuation
    const prevChar = state.src[start - 1]
    if (start > 0 && !ALLOWED_PREV_CHARS.has(prevChar))
      return false

    let index = start + 1
    let nameEnd = -1
    let contentStart = -1
    let contentEnd = -1

    // Parse component name
    while (index < state.src.length) {
      const char = state.src[index]
      if (char === '[') {
        nameEnd = index
        const result = parseBracketContent(state.src, index)
        if (result) {
          contentStart = index + 1
          contentEnd = result.endIndex - 1
          index = result.endIndex
        }
        break
      }
      if (!/[\w$\-]/.test(char))
        break
      index += 1
    }

    // If no bracket was found, name ends at current index
    if (nameEnd === -1)
      nameEnd = index

    // Empty name
    if (nameEnd <= start + 1)
      return false

    state.pos = index

    if (silent)
      return true

    const name = state.src.slice(start + 1, nameEnd)

    if (contentStart !== -1) {
      state.push('mdc_inline_component', name, 1)

      // Parse the content between brackets as inline markdown
      const oldPos = state.pos
      const oldPosMax = state.posMax
      state.pos = contentStart
      state.posMax = contentEnd
      state.md.inline.tokenize(state)
      state.pos = oldPos
      state.posMax = oldPosMax

      state.push('mdc_inline_component', name, -1)
    }
    else {
      state.push('mdc_inline_component', name, 0)
    }

    return true
  })
}
