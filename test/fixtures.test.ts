/// <reference types="vite/client" />

import process from 'node:process'
import { componentPlugin } from '@mdit-vue/plugin-component'
import { frontmatterPlugin } from '@mdit-vue/plugin-frontmatter'
import MarkdownIt from 'markdown-it'
// @ts-expect-error missing type
import MarkdownItCheckbox from 'markdown-it-task-checkbox'
import { format } from 'prettier'
import { describe, expect, it } from 'vitest'

import MarkdownItMdc from '../src'

describe('fixtures', () => {
  const files = import.meta.glob<string>('./input/*.md', { query: '?raw', eager: true, import: 'default' })
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

        await expect(formatted.trim())
          .toMatchFileSnapshot(path.replace('input', 'output').replace('.md', '.html'))
      })
    })
})
