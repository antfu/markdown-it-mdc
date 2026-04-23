import type MarkdownIt from 'markdown-it'

export interface MdcInlineSpanOptions {
  /**
   * Skip footnote-like syntax `[^...]` to avoid conflicts with footnote plugins.
   *
   * @default true
   */
  skipFootnoteLike?: boolean
}

export const MarkdownItInlineSpan: MarkdownIt.PluginWithOptions<MdcInlineSpanOptions> = (md, options = {}) => {
  const { skipFootnoteLike = true } = options

  md.inline.ruler.before('link', 'mdc_inline_span', (state, silent) => {
    const start = state.pos
    const char = state.src[start]

    if (char !== '[')
      return false

    if (skipFootnoteLike && state.src[start + 1] === '^')
      return false

    let index = start + 1
    let depth = 0
    while (index < state.src.length) {
      if (state.src[index] === '\\') {
        index += 2
        continue
      }
      if (state.src[index] === '[') {
        depth++
      }
      else if (state.src[index] === ']') {
        if (depth === 0)
          break
        depth--
      }
      index += 1
    }

    if (index === start)
      return false

    // Don't match [text](url) or [text][ref] - let the link parser handle those
    const nextChar = state.src[index + 1]
    if (nextChar === '(' || nextChar === '[')
      return false

    if (silent)
      return true

    state.push('mdc_inline_span', 'span', 1)

    // Parse the content between brackets as inline markdown
    const oldPos = state.pos
    const oldPosMax = state.posMax
    state.pos = start + 1
    state.posMax = index
    state.md.inline.tokenize(state)
    state.pos = oldPos
    state.posMax = oldPosMax

    state.push('mdc_inline_span', 'span', -1)

    state.pos = index + 1

    return true
  })
}
