import type MarkdownIt from 'markdown-it'

export interface MdcInlinePropsOptions {

}

export const MarkdownItInlineProps: MarkdownIt.PluginWithOptions<MdcInlinePropsOptions> = (md, options) => {
  md.inline.ruler.before('emphasis', 'mdc-inline-props', (state, silent) => {
    const pos = state.pos
    const char = state.src[pos]

    if (char !== '{')
      return false

    console.log({ pos, char })
  })
}
