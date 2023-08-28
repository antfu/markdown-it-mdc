const bracketPairs = {
  '[': ']',
  '{': '}',
  '(': ')',
}
const quotePairs = {
  '\'': '\'',
  '"': '"',
  '`': '`',
}

export function parseProps(str: string) {
  str = str.trim()
  if (!str)
    return undefined

  if (!str.match(/^{.*}$/))
    throw new Error(`Invalid props: ${str}`)

  let index = 0
  const content = str.slice(1, -1).trim()
  const props: [string, string][] = []

  while (index < content.length) {
    if (content[index] === ' ') {
      index += 1
    }
    else if (content[index] === '.') {
      index += 1
      props.push([
        'class',
        until(' #.'),
      ])
    }
    else if (content[index] === '#') {
      index += 1
      props.push([
        'id',
        until(' #.'),
      ])
    }
    else {
      const start = index
      while (index < content.length) {
        index += 1
        if (content[index] === ' ' || content[index] === '=')
          break
      }
      if (start !== index) {
        const key = content.slice(start, index)
        if (content[index] === ' ' || !content[index]) {
          props.push([
            key,
            'true',
          ])
        }
        else {
          index += 1
          props.push([
            key,
            parseValue(),
          ])
        }
      }
      index += 1
    }
  }

  function until(str: string) {
    const start = index
    while (index < content.length) {
      index++
      if (str.includes(content[index]))
        break
    }
    return content.slice(start, index)
  }

  function parseValue() {
    const start = index
    if (content[index] in bracketPairs) {
      findBracket(bracketPairs[content[index] as keyof typeof bracketPairs])
      index += 1
      return content.slice(start, index)
    }
    else if (content[index] in quotePairs) {
      findString(quotePairs[content[index] as keyof typeof quotePairs])
      index += 1
      return content.slice(start, index)
    }
    else {
      return until(' ')
    }
  }

  function findBracket(end: string) {
    while (index < content.length) {
      index++
      if (content[index] in quotePairs)
        findString(quotePairs[content[index] as keyof typeof quotePairs])
      else if (content[index] in bracketPairs)
        findBracket(bracketPairs[content[index] as keyof typeof bracketPairs])
      else if (content[index] === end)
        return
    }
  }
  function findString(end: string) {
    while (index < content.length) {
      index++
      if (content[index] === end)
        return
    }
  }

  // Escale quotes
  props.forEach((v) => {
    if (v[1].match(/^(['"`]).*\1$/))
      v[1] = v[1].slice(1, -1)
  })

  return props
}
