import type MarkdownIt from 'markdown-it'
import { MarkdownItMdcBlock } from './syntax/block'
import { MarkdownItInlineProps } from './syntax/inline-props'
import { MarkdownItInlineComponent } from './syntax/inline-component'
import { MarkdownItInlineSpan } from './syntax/inline-span'

export interface MarkdownItMdcOptions {
  /**
   * Options for toggling each syntax feature.
   */
  syntax?: {
    /**
     * Enable block component syntax.
     *
     * @see https://content.nuxtjs.org/guide/writing/mdc#block-components
     * @default true
     */
    blockComponent?: boolean
    /**
     * Enable inline props syntax.
     *
     * @see https://content.nuxtjs.org/guide/writing/mdc#inline-props
     * @default true
     */
    inlineProps?: boolean
    /**
     * Enable inline span syntax.
     *
     * @see https://content.nuxtjs.org/guide/writing/mdc#inline-span
     * @default true
     */
    inlineSpan?: boolean
    /**
     * Enable inline component syntax.
     *
     * @see https://content.nuxtjs.org/guide/writing/mdc#inline-component
     * @default true
     **/
    inlineComponent?: boolean
  }
}

const MarkdownItMdc: MarkdownIt.PluginWithOptions<MarkdownItMdcOptions> = (md, options = {}) => {
  const {
    blockComponent = true,
    inlineProps = true,
    inlineSpan = true,
    inlineComponent = true,
  } = options.syntax || {}

  if (blockComponent)
    md.use(MarkdownItMdcBlock)

  if (inlineProps)
    md.use(MarkdownItInlineProps)

  if (inlineSpan)
    md.use(MarkdownItInlineSpan)

  if (inlineComponent)
    md.use(MarkdownItInlineComponent)
}

export default MarkdownItMdc
