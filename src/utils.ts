const RE_BLOCK_NAME = /^[a-zA-Z$][\w\.$-_]+/

export function parseBlockParams(str: string) {
  str = str.trim()
  if (!str)
    return { name: '', params: '' }
  const name = str.match(RE_BLOCK_NAME)?.[0]
  if (!name)
    throw new Error(`Invalid block params: ${str}`)

  const params = str.slice(name.length).trim()
  return { name, params }
}
