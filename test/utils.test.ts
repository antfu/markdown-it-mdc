import { describe, expect, it } from 'vitest'
import { parseBlockParams } from '../src/utils'

describe('parseBlockParams', () => {
  it('basic', () => {
    expect(parseBlockParams(''))
      .toEqual({ name: '', params: '' })

    expect(parseBlockParams('foo'))
      .toEqual({ name: 'foo', params: '' })

    expect(parseBlockParams('foo-bar'))
      .toEqual({ name: 'foo-bar', params: '' })

    expect(parseBlockParams(' $foo.bar1  {#id .class}'))
      .toEqual({ name: '$foo.bar1', params: '{#id .class}' })
  })

  it('errors', () => {
    expect(() => parseBlockParams('{foo}'))
      .toThrow('Invalid block params: {foo}')
  })
})
