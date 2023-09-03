import type MarkdownIt from 'markdown-it'
import Token from 'markdown-it/lib/token.js'
import { searchProps } from '../parse/props'

export interface MdcInlinePropsOptions {

}

export const MarkdownItInlineProps: MarkdownIt.PluginWithOptions<MdcInlinePropsOptions> = (md) => {
  md.inline.ruler.after('entity', 'mdc_inline_props', (state, silent) => {
    const start = state.pos
    const char = state.src[start]

    if (char !== '{')
      return false

    // Vue's mustache {{ }} syntax
    if (state.src[start + 1] === '{' || state.src[start - 1] === '{')
      return false

    const search = searchProps(state.src, start)
    if (!search)
      return false

    const {
      props,
      index: end,
    } = search

    if (end === start)
      return false

    if (silent)
      return true

    state.pos = start
    state.posMax = end

    // We insert a hidden token holding the props, and later apply them to the previous token
    const token = state.push('mdc_inline_props', 'span', 0)
    token.attrs = props
    token.hidden = true

    state.pos = end
    state.posMax = end

    return true
  })

  // This is a hidden token, we don't need to render anything
  md.renderer.rules.mdc_inline_props = () => {
    return ''
  }

  // Apply the props to the parent token
  // when it's the only child of the inline token inside a paragraph or heading
  // e.g. `# Heading {class="foo"}`, it will apply the class to the `h1` tag instead of creating a `span` tag
  const _parse = md.parse
  md.parse = function (src, env) {
    const tokens = _parse.call(this, src, env)

    tokens.forEach((token, index) => {
      const prev = tokens[index - 1]
      if (prev?.type !== 'heading_open' && prev?.type !== 'paragraph_open')
        return

      if (
        token.type === 'inline'
        && token.children?.length === 2
        && token.children[0].type === 'text'
        && token.children[1].type === 'mdc_inline_props'
      ) {
        const props = token.children[1].attrs
        token.children.splice(1, 1)
        props?.forEach(([key, value]) => {
          if (key === 'class')
            prev.attrJoin('class', value)
          else
            prev.attrSet(key, value)
        })
      }
    })

    return tokens
  }

  // Replace the inline renderer to apply the props to the previous token
  const _renderInline = md.renderer.renderInline
  md.renderer.renderInline = function (tokens: Token[], options, env) {
    tokens = [...tokens]
    tokens.forEach((token, index) => {
      if (token.type === 'mdc_inline_props') {
        let prevIndex = index - 1

        // Find the first non-whitespace token before this one
        let prev = tokens[prevIndex]
        while (prevIndex >= 0) {
          if (prev.type === 'text' && !prev.content.trim()) {
            prevIndex--
            prev = tokens[prevIndex]
          }
          else {
            break
          }
        }

        // If the previous token is a text token, we need to wrap it in a span
        if (!prev.tag && prev.type === 'text') {
          prev = new Token('mdc_inline_span', 'span', 1)
          tokens.splice(index - 1, 0, prev)
          const close = new Token('mdc_inline_span', 'span', -1)
          tokens.splice(index + 2, 0, close)
        }
        // If the previous token is a closing tag, we need to find the matching opening tag
        else if (prev.nesting === -1) {
          let searchIndex = index - 1
          while (searchIndex >= 0) {
            const searchToken = tokens[searchIndex]
            if (searchToken.nesting === 1 && searchToken.tag === prev.tag && searchToken.level === prev.level) {
              prev = searchToken
              break
            }
            searchIndex--
          }
        }

        if (prev.nesting === -1)
          throw new Error(`No matching opening tag found for ${JSON.stringify(prev)}`)

        token.attrs?.forEach(([key, value]) => {
          if (key === 'class')
            prev.attrJoin('class', value)
          else
            prev.attrSet(key, value)
        })
      }
    })
    return _renderInline.call(this, tokens, options, env)
  }
}
