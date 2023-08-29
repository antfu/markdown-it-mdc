import type MarkdownIt from 'markdown-it'
import { MarkdownItMdcBlock } from './syntax/block'
import { MarkdownItInlineProps } from './syntax/inline-props'
import { MarkdownItInlineComponent } from './syntax/inline-component'
import { MarkdownItInlineSpan } from './syntax/inline-span'
import { MarkdownItMdcBlockContent } from './syntax/block-content'

export interface MarkdownItMdcOptions {

}

const MarkdownItMdc: MarkdownIt.PluginWithOptions<MarkdownItMdcOptions> = (md, _options = {}) => {
  md
    .use(MarkdownItMdcBlock)
    .use(MarkdownItInlineProps)
    .use(MarkdownItInlineComponent)
    .use(MarkdownItInlineSpan)
    .use(MarkdownItMdcBlockContent)
}

export default MarkdownItMdc
