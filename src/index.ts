import type MarkdownIt from 'markdown-it'
import { MarkdownItMdcBlock } from './block'
import { MarkdownItInlineProps } from './inline-props'

export interface MarkdownItMdcOptions {

}

const MarkdownItMdc: MarkdownIt.PluginWithOptions<MarkdownItMdcOptions> = (
  md,
  _options = {},
) => {
  md
    .use(MarkdownItMdcBlock)
    .use(MarkdownItInlineProps)
}

export default MarkdownItMdc
