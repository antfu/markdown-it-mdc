import type { Token } from 'markdown-it'
import type MarkdownIt from 'markdown-it'
import TokenClass from 'markdown-it/lib/token.mjs'

import { searchProps } from '../parse/props'

export interface MdcInlinePropsOptions {

}

export const MarkdownItInlineProps: MarkdownIt.PluginWithOptions<MdcInlinePropsOptions> = (md) => {
  md.inline.ruler.after('entity', 'mdc_inline_props', (state, silent) => {
    const start = state.pos
    const char = state.src[start]

    if (char !== '{')
      return false

    // Vue's mustache {{ }} syntax and string template ${ } syntax
    if (state.src[start + 1] === '{' || state.src[start - 1] === '{' || state.src[start - 1] === '$')
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

    state.pos = end

    if (silent)
      return true

    // We insert a hidden token holding the props, and later apply them to the previous token
    const token = state.push('mdc_inline_props', 'span', 0)
    token.attrs = props
    token.hidden = true

    return true
  })

  // This is a hidden token, we don't need to render anything
  md.renderer.rules.mdc_inline_props = () => {
    return ''
  }

  const _parse = md.parse
  md.parse = function (src, env) {
    const tokens = _parse.call(this, src, env)

    // Apply the props to the parent token
    // when it's the only child of the inline token inside a paragraph or heading
    // e.g. `# Heading {class="foo"}`, it will apply the class to the `h1` tag instead of creating a `span` tag
    tokens.forEach((token, index) => {
      const prev = tokens[index - 1]
      const next = tokens[index + 1]
      if (!['heading_open', 'paragraph_open', 'list_item_open'].includes(prev?.type) || prev.hidden)
        return

      // list item handling
      if (token.hidden && next.type === 'inline')
        token = next

      if (
        token.type === 'inline'
        && token.children?.[token.children.length - 1].type === 'mdc_inline_props'
      ) {
        const props = token.children.pop()?.attrs;
        props?.forEach(([key, value]) => {
          if (key === 'class')
            prev.attrJoin('class', value)
          else
            prev.attrSet(key, value)
        })
      }
    })

    // When using `::ul` syntax, to wrap with a list,
    // we deduplicate the `ul` tag and hide the original one
    // when it's exactly the only child of the `mdc_block_open` token
    tokens.forEach((tokenOpen, index) => {
      if (tokenOpen.type !== 'bullet_list_open')
        return

      const prev = tokens[index - 1]
      if (!prev || prev.type !== 'mdc_block_open' || prev.tag !== 'ul')
        return

      // find the matching close token
      let closeIndex = index + 1
      while (closeIndex < tokens.length) {
        const close = tokens[closeIndex]
        if (close.type === 'bullet_list_close' && close.level === tokenOpen.level)
          break
        closeIndex += 1
      }
      const tokenClose = tokens[closeIndex]
      if (tokenClose.type !== 'bullet_list_close')
        return

      // when prev and next are both `mdc_block` and `ul`,
      // we hide the original `ul` token
      const next = tokens[closeIndex + 1]
      if (next.type === 'mdc_block_close' && next.tag === 'ul') {
        tokenOpen.hidden = true
        tokenClose.hidden = true
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
          prev = new TokenClass('mdc_inline_span', 'span', 1)
          tokens.splice(index - 1, 0, prev)
          const close = new TokenClass('mdc_inline_span', 'span', -1)
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

        // console.log('apply', token.attrs, 'to', prev)

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
