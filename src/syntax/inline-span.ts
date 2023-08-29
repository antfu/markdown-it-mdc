import type MarkdownIt from 'markdown-it'

export interface MdcInlineSpanOptions {

}

export const MarkdownItInlineSpan: MarkdownIt.PluginWithOptions<MdcInlineSpanOptions> = (md) => {
  md.inline.ruler.after('mdc_inline_props', 'mdc_inline_span', (state, silent) => {
    const start = state.pos
    const char = state.src[start]

    if (char !== '[')
      return false

    let index = start + 1
    while (index < state.src.length) {
      const char = state.src[index]
      if (char === ']')
        break
      index += 1
    }

    if (index === start)
      return false

    if (silent)
      return true

    state.posMax = start + 1
    state.push('mdc_inline_span', 'span', 1)

    state.pos = start + 1
    state.posMax = index
    const text = state.push('text', '', 0)
    text.content = state.src.slice(start + 1, index)

    state.pos = index
    state.posMax = index + 1

    state.push('mdc_inline_span', 'span', -1)

    state.pos = index + 1
    state.posMax = index + 1

    return true
  })
}
