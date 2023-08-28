/// <reference types="vite/client" />

import process from 'node:process'
import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import MarkdownItMdc from '../src'

describe('should', () => {
  const files = import.meta.glob('./input/*.md', { as: 'raw' })
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
        md.use(MarkdownItMdc)

        expect(md.render(await content()))
          .toMatchFileSnapshot(path.replace('input', 'output').replace('.md', '.html'))
      })
    })
})
