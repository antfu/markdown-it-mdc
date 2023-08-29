import type MarkdownIt from 'markdown-it'
import { parseBlockParams } from '../parse/block-params'

export const MarkdownItMdcBlockContent: MarkdownIt.PluginSimple = (md) => {
  md.block.ruler.after('code', 'mdc_block_slots',
    (state, startLine, endLine, silent) => {
      const start = state.bMarks[startLine] + state.tShift[startLine]

      if (!(state.src[start] === '#' && state.src[start + 1] !== ' '))
        return false

      if (!state.env.mdcBlock)
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
