import type MarkdownIt from 'markdown-it'
import { MarkdownItMdcBlock } from './block'
import type { MdcBlockOptions } from './block'

export interface MarkdownItMdcOptions {

}

const MarkdownItMdc: MarkdownIt.PluginWithOptions<MarkdownItMdcOptions> = (
  md,
  options = {},
) => {
  md.use(MarkdownItMdcBlock, <MdcBlockOptions>{
    validate() {
      return true
    },
  })
}

export default MarkdownItMdc
