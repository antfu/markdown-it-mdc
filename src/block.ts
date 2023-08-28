import type MarkdownIt from 'markdown-it'
import type { RuleBlock } from 'markdown-it/lib/parser_block'
import type Renderer from 'markdown-it/lib/renderer'
import type Token from 'markdown-it/lib/token'
import { parseBlockParams } from './utils'

export interface MdcBlockOptions {
  marker?: string | undefined
  validate?(params: string, markup: string): boolean
  render?: Renderer.RenderRule | undefined
}

export interface ExtendToken extends Token {
  mdc?: {
    name: string
    props?: [string, string][]
    level: number
  }
}

export function MarkdownItMdcBlock(md: MarkdownIt, options: MdcBlockOptions) {
  const name = 'mdc'

  // Second param may be useful if you decide
  // to increase minimal allowed marker length
  function validateDefault(params: string) {
    return !!params
  }

  function renderDefault(tokens: ExtendToken[], idx: number, _options: MarkdownIt.Options, env: any, slf: Renderer) {
    // // add a class to the opening tag
    // if (tokens[idx]?.mdc?.blockName)
    //   tokens[idx].attrJoin('class', tokens[idx]!.mdc!.blockName)

    return slf.renderToken(tokens, idx, _options)
  }

  options = options || {}

  const min_markers = 2
  const marker_str = options.marker || ':'
  const marker_char = marker_str.charCodeAt(0)
  const validate = options.validate || validateDefault
  const render = options.render || renderDefault

  const container: RuleBlock = (state, startLine, endLine, silent) => {
    let pos: number
    let nextLine: number
    let token: ExtendToken
    let auto_closed = false
    let start = state.bMarks[startLine] + state.tShift[startLine]
    let max = state.eMarks[startLine]
    const indent = state.sCount[startLine]

    // Check out the first character quickly,
    // this should filter out most of non-containers
    //
    if (marker_char !== state.src.charCodeAt(start))
      return false

    // Check out the rest of the marker string
    for (pos = start + 1; pos <= max; pos++) {
      if (marker_str !== state.src[pos])
        break
    }

    const marker_count = Math.floor((pos - start))
    if (marker_count < min_markers)
      return false

    const markup = state.src.slice(start, pos)
    const params = parseBlockParams(state.src.slice(pos, max))

    if (!validate(params.name, markup))
      return false

    // Since start is found, we can report success here in validation mode
    if (silent)
      return true

    // Search for the end of the block
    nextLine = startLine

    for (;;) {
      nextLine++
      if (nextLine >= endLine) {
        // unclosed block should be autoclosed by end of document.
        // also block seems to be autoclosed by end of parent
        break
      }

      start = state.bMarks[nextLine] + state.tShift[nextLine]
      max = state.eMarks[nextLine]

      if (start < max && state.sCount[nextLine] < state.blkIndent) {
        // non-empty line with negative indent should stop the list:
        // - ```
        //  test
        break
      }

      if (marker_char !== state.src.charCodeAt(start))
        continue

      // if (state.sCount[nextLine] - state.blkIndent >= 4) {
      //   // closing fence should be indented less than 4 spaces
      //   continue
      // }

      for (pos = start + 1; pos <= max; pos++) {
        if (marker_str !== state.src[pos])
          break
      }

      // closing code fence must be the exact long as the opening one
      if ((pos - start) !== marker_count)
        continue

      // make sure tail has spaces only
      // pos -= (pos - start)
      pos = state.skipSpaces(pos)

      if (pos < max)
        continue

      // found!
      auto_closed = true
      break
    }

    const old_parent = state.parentType
    const old_line_max = state.lineMax
    // @ts-expect-error force
    state.parentType = 'mdc_block'

    // this will prevent lazy continuations from ever going past our end marker
    state.lineMax = nextLine

    token = state.push(`mdc_block_${name}_open`, params.name, 1) as ExtendToken
    token.markup = markup
    token.block = true
    token.info = params.name
    token.map = [startLine, nextLine]
    token.mdc = {
      name: params.name,
      props: params.props,
      level: marker_count - 1,
    }
    // Add props
    if (params.props) {
      params.props.forEach(([key, value]) => {
        if (key === 'class')
          token.attrJoin(key, value)
        else
          token.attrSet(key, value)
      })
    }

    // Parse content
    const blkIndent = state.blkIndent
    state.blkIndent = indent
    state.md.block.tokenize(state, startLine + 1, nextLine)
    state.blkIndent = blkIndent

    // Ending Tag
    token = state.push(`mdc_block_${name}_close`, params.name, -1)
    token.markup = state.src.slice(start, pos)
    token.block = true

    state.parentType = old_parent
    state.lineMax = old_line_max
    state.line = nextLine + (auto_closed ? 1 : 0)

    return true
  }

  md.block.ruler.before('fence', `mdc_block_${name}`, container, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
  md.renderer.rules[`mdc_block_${name}_open`] = render
  md.renderer.rules[`mdc_block_${name}_close`] = render
}
