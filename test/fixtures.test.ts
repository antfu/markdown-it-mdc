/// <reference types="vite/client" />

import process from 'node:process'
import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import { format } from 'prettier'
import { componentPlugin } from '@mdit-vue/plugin-component'
import { frontmatterPlugin } from '@mdit-vue/plugin-frontmatter'

// @ts-expect-error missing type
import MarkdownItCheckbox from 'markdown-it-task-checkbox'
import MarkdownItMdc from '../src'

describe('fixtures', () => {
  const files = import.meta.glob('./input/*.md', { as: 'raw', eager: true })
  const filter = process.env.FILTER
  Object.entries(files)
    .forEach(([path, content]) => {
      const run = !filter || path.includes(filter)
        ? it
        : it.skip

      run(`render ${path}`, async () => {
        const md = new MarkdownIt({
          html: true,
          linkify: true,
          xhtmlOut: true,
        })

        md.use(MarkdownItCheckbox)
          .use(MarkdownItMdc)
          .use(componentPlugin)
          .use(frontmatterPlugin)

        const rendered = md.render(content)
        const formatted = await format(rendered, {
          parser: 'html',
        })

        expect(formatted.trim())
          .toMatchFileSnapshot(path.replace('input', 'output').replace('.md', '.html'))
      })
    })
})
