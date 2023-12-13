import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token'
import YAML from 'js-yaml'
import { parseBlockParams } from '../parse/block-params'

export const MarkdownItMdcBlock: MarkdownIt.PluginSimple = (md) => {
  const min_markers = 2
  const marker_str = ':'
  const marker_char = marker_str.charCodeAt(0)

  md.block.ruler.before(
    'fence',
    'mdc_block_shorthand',
    // eslint-disable-next-line prefer-arrow-callback
    function mdc_block_shorthand(state, startLine, endLine, silent) {
      const line = state.src.slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine])

      if (!line.match(/^:[\w]/))
        return false

      const {
        name,
        props,
      } = parseBlockParams(line.slice(1))

      state.lineMax = startLine + 1

      if (!silent) {
        const token = state.push('mdc_block_shorthand', name, 0)
        props?.forEach(([key, value]) => {
          if (key === 'class')
            token.attrJoin(key, value)
          else
            token.attrSet(key, value)
        })
      }

      state.line = startLine + 1
      return true
    },
  )

  md.block.ruler.before(
    'fence',
    'mdc_block',
    // eslint-disable-next-line prefer-arrow-callback
    function mdc_block(state, startLine, endLine, silent) {
      let pos: number
      let nextLine: number
      let auto_closed = false
      let start = state.bMarks[startLine] + state.tShift[startLine]
      let max = state.eMarks[startLine]
      const indent = state.sCount[startLine]

      // Check out the first character quickly,
      // this should filter out most of non-containers
      //
      if (state.src[start] !== ':')
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

      if (!params.name)
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

      const tokenOpen = state.push('mdc_block_open', params.name, 1)
      tokenOpen.markup = markup
      tokenOpen.block = true
      tokenOpen.info = params.name
      tokenOpen.map = [startLine, nextLine]

      // Add props
      if (params.props) {
        params.props?.forEach(([key, value]) => {
          if (key === 'class')
            tokenOpen.attrJoin(key, value)
          else
            tokenOpen.attrSet(key, value)
        })
      }

      // Parse content
      const blkIndent = state.blkIndent
      state.blkIndent = indent
      state.env.mdcBlockTokens ||= [] as Token[]
      state.env.mdcBlockTokens.unshift(tokenOpen)
      state.md.block.tokenize(state, startLine + 1, nextLine)
      state.blkIndent = blkIndent
      state.env.mdcBlockTokens.shift(tokenOpen)

      // Ending Tag
      const tokenClose = state.push('mdc_block_close', params.name, -1)
      tokenClose.markup = state.src.slice(start, pos)
      tokenClose.block = true

      state.tokens.slice(
        state.tokens.indexOf(tokenOpen) + 1,
        state.tokens.indexOf(tokenClose),
      )
        .filter(i => i.level === tokenOpen.level + 1)
        .forEach((i, _, arr) => {
          if (arr.length <= 2 && i.tag === 'p')
            i.hidden = true
        })

      state.parentType = old_parent
      state.lineMax = old_line_max
      state.line = nextLine + (auto_closed ? 1 : 0)

      return true
    },
    {
      alt: ['paragraph', 'reference', 'blockquote', 'list'],
    },
  )

  md.block.ruler.after(
    'code',
    'mdc_block_yaml',
    // eslint-disable-next-line prefer-arrow-callback
    function mdc_block_yaml(state, startLine, endLine, silent) {
      if (!state.env.mdcBlockTokens?.length)
        return false

      const start = state.bMarks[startLine] + state.tShift[startLine]
      const end = state.eMarks[startLine]

      if (state.src.slice(start, end) !== '---')
        return false

      let lineEnd = startLine + 1

      let found = false
      while (lineEnd < endLine) {
        const line = state.src.slice(state.bMarks[lineEnd] + state.tShift[startLine], state.eMarks[lineEnd])
        if (line === '---') {
          found = true
          break
        }
        lineEnd += 1
      }

      if (!found)
        return false

      if (!silent) {
        const yaml = state.src.slice(state.bMarks[startLine + 1], state.eMarks[lineEnd - 1])

        const data = YAML.load(yaml) as Record<string, unknown>
        const token = state.env.mdcBlockTokens[0]
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'class')
            token.attrJoin(key, value)
          else
            token.attrSet(key, typeof value === 'string' ? value : JSON.stringify(value))
        })
      }

      state.line = lineEnd + 1
      state.lineMax = lineEnd + 1
      return true
    },
  )

  md.block.ruler.after(
    'code',
    'mdc_block_slots',
    // eslint-disable-next-line prefer-arrow-callback
    function mdc_block(state, startLine, endLine, silent) {
      if (!state.env.mdcBlockTokens?.length)
        return false

      const start = state.bMarks[startLine] + state.tShift[startLine]

      if (!(state.src[start] === '#' && state.src[start + 1] !== ' '))
        return false

      const line = state.src.slice(start, state.eMarks[startLine])

      const {
        name,
        props,
      } = parseBlockParams(line.slice(1))

      let lineEnd = startLine + 1

      while (lineEnd < endLine) {
        const line = state.src.slice(state.bMarks[lineEnd] + state.tShift[startLine], state.eMarks[lineEnd])
        if (line.match(/^#(\w)+/) || line.startsWith('::'))
          break
        lineEnd += 1
      }

      if (silent) {
        state.line = lineEnd
        state.lineMax = lineEnd
        return true
      }

      state.lineMax = startLine + 1
      const slot = state.push('mdc_block_slot', 'template', 1)
      slot.attrSet(`#${name}`, '')
      props?.forEach(([key, value]) => {
        if (key === 'class')
          slot.attrJoin(key, value)
        else
          slot.attrSet(key, value)
      })

      state.line = startLine + 1
      state.lineMax = lineEnd

      state.md.block.tokenize(state, startLine + 1, lineEnd)

      state.push('mdc_block_slot', 'template', -1)

      state.line = lineEnd
      state.lineMax = lineEnd

      return true
    },
  )
}
