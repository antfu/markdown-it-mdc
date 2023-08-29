import type MarkdownIt from 'markdown-it'

export interface MdcInlineComponentOptions {

}

export const MarkdownItInlineComponent: MarkdownIt.PluginWithOptions<MdcInlineComponentOptions> = (md) => {
  md.inline.ruler.after('entity', 'mdc_inline_component', (state, silent) => {
    const start = state.pos
    const char = state.src[start]

    if (char !== ':')
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
          if (state.src[index] === ']') {
            contentEnd = index
            index += 1
            break
          }
        }
        break
      }
      if (!/[\w\$_-]/.test(char))
        break
      index += 1
    }

    if (index === start)
      return false

    if (silent)
      return true

    if (contentEnd !== contentStart) {
      const name = state.src.slice(start + 1, contentStart - 1)
      const body = state.src.slice(contentStart, contentEnd)
      state.posMax = contentStart
      state.push('mdc_inline_component', name, 1)
      state.pos = contentStart
      state.posMax = contentEnd
      const text = state.push('text', '', 0)
      text.content = body
      state.pos = contentEnd
      state.posMax = contentEnd
      state.push('mdc_inline_component', name, -1)
    }
    else {
      state.posMax = index
      const name = state.src.slice(start + 1, index)
      state.push('mdc_inline_component', name, 0)
    }

    state.pos = index
    state.posMax = index

    return true
  })
}
