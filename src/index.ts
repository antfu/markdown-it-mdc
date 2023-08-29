import type MarkdownIt from 'markdown-it'
import { MarkdownItMdcBlock } from './block'
import { MarkdownItInlineProps } from './inline-props'
import { MarkdownItInlineComponent } from './inline-component'

export interface MarkdownItMdcOptions {

}

const MarkdownItMdc: MarkdownIt.PluginWithOptions<MarkdownItMdcOptions> = (md, _options = {}) => {
  md
    .use(MarkdownItMdcBlock)
    .use(MarkdownItInlineProps)
    .use(MarkdownItInlineComponent)
}

export default MarkdownItMdc
