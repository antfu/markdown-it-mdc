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
      if (state.src[index] === '\\')
        index += 2
      if (state.src[index] === ']')
        break
      index += 1
    }

    if (index === start)
      return false

    if (silent)
      return true

    state.push('mdc_inline_span', 'span', 1)

    const text = state.push('text', '', 0)
    text.content = state.src.slice(start + 1, index)

    state.push('mdc_inline_span', 'span', -1)

    state.pos = index + 1

    return true
  })
}
