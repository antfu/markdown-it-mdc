import { describe, expect, it } from 'vitest'
import { parseBlockParams } from '../src/utils'

describe('parseBlockParams', () => {
  it('basic', () => {
    expect(parseBlockParams(''))
      .toEqual({ name: '', params: undefined })

    expect(parseBlockParams('foo'))
      .toEqual({ name: 'foo', params: undefined })

    expect(parseBlockParams('foo-bar'))
      .toEqual({ name: 'foo-bar', params: undefined })

    expect(parseBlockParams(' $foo.bar1  {#my-id .my-class}'))
      .toMatchInlineSnapshot(`
        {
          "name": "$foo.bar1",
          "props": [
            [
              "id",
              "my-id",
            ],
            [
              "class",
              "my-class",
            ],
          ],
        }
      `)
  })

  it('errors', () => {
    expect(() => parseBlockParams('{foo}'))
      .toThrow('Invalid block params: {foo}')
  })
})
