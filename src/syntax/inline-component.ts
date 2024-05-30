import type MarkdownIt from 'markdown-it'

export interface MdcInlineComponentOptions {

}

export const MarkdownItInlineComponent: MarkdownIt.PluginWithOptions<MdcInlineComponentOptions> = (md) => {
  md.inline.ruler.after('entity', 'mdc_inline_component', (state, silent) => {
    const start = state.pos
    const char = state.src[start]

    // Requires a space before the colon
    if (!(char === ':' && state.src[start - 1] === ' '))
      return false

    let index = start + 1
    let contentStart = -1
    let contentEnd = -1
    while (index < state.src.length) {
      const char = state.src[index]
      if (char === '[') {
        contentStart = index + 1
        while (index < state.src.length) {
          index += 1
          if (state.src[index] === '\\')
            index += 2
          if (state.src[index] === ']') {
            contentEnd = index
            index += 1
            break
          }
        }
        break
      }
      if (!/[\w$\-]/.test(char))
        break
      index += 1
    }

    // Empty name
    if (index <= start + 1)
      return false

    if (silent)
      return true

    if (contentEnd !== contentStart) {
      const name = state.src.slice(start + 1, contentStart - 1)
      const body = state.src.slice(contentStart, contentEnd)
      state.push('mdc_inline_component', name, 1)
      const text = state.push('text', '', 0)
      text.content = body
      state.push('mdc_inline_component', name, -1)
    }
    else {
      const name = state.src.slice(start + 1, index)
      state.push('mdc_inline_component', name, 0)
    }

    state.pos = index

    return true
  })
}
