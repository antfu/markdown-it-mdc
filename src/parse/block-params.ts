import { parseProps } from './props'

const RE_BLOCK_NAME = /^[a-z$][$\w.-]*/

/**
 * Parse `component-name {.params}` from block params.
 */
export function parseBlockParams(str: string) {
  str = str.trim()
  if (!str)
    return { name: '' }
  const name = str.match(RE_BLOCK_NAME)?.[0]
  if (!name)
    throw new Error(`Invalid block params: ${str}`)

  const params = str.slice(name.length).trim()
  return {
    name,
    props: parseProps(params),
  }
}
