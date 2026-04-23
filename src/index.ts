import type MarkdownIt from 'markdown-it'
import type { MdcInlineSpanOptions } from './syntax/inline-span'
import { MarkdownItMdcBlock } from './syntax/block'
import { MarkdownItInlineComponent } from './syntax/inline-component'
import { MarkdownItInlineProps } from './syntax/inline-props'
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
     * Pass `true` to enable with defaults, or pass an object to configure.
     *
     * @see https://content.nuxtjs.org/guide/writing/mdc#inline-span
     * @default true
     */
    inlineSpan?: boolean | MdcInlineSpanOptions
    /**
     * Enable inline component syntax.
     *
     * @see https://content.nuxtjs.org/guide/writing/mdc#inline-component
     * @default true
     */
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

  if (inlineSpan) {
    const spanOptions = typeof inlineSpan === 'object'
      ? inlineSpan
      : {}
    md.use(MarkdownItInlineSpan, spanOptions)
  }

  if (inlineComponent)
    md.use(MarkdownItInlineComponent)
}

export default MarkdownItMdc
