import type MarkdownIt from 'markdown-it'
import YAML from 'js-yaml'
import { parseBlockParams } from '../parse/block-params'

export const MarkdownItMdcBlockContent: MarkdownIt.PluginSimple = (md) => {
  md.block.ruler.after('code', 'mdc_block_yaml',
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
    })

  md.block.ruler.after('code', 'mdc_block_slots',
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
