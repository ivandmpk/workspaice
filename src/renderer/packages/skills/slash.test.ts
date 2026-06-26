import { describe, expect, it } from 'vitest'
import { getSlashQuery, parseSlashInvocation } from './slash'

describe('getSlashQuery', () => {
  it('returns partial name while typing a bare slash word', () => {
    expect(getSlashQuery('/')).toBe('')
    expect(getSlashQuery('/tra')).toBe('tra')
    expect(getSlashQuery('/Translate')).toBe('translate')
  })

  it('closes (null) once there is whitespace or non-slash text', () => {
    expect(getSlashQuery('/translate ')).toBeNull()
    expect(getSlashQuery('hello')).toBeNull()
    expect(getSlashQuery('a /translate')).toBeNull()
    expect(getSlashQuery('')).toBeNull()
  })
})

describe('parseSlashInvocation', () => {
  const enabled = ['translate', 'code-review']

  it('extracts skill + args and strips the command from the sent text', () => {
    expect(parseSlashInvocation('/translate hola mundo', enabled)).toEqual({
      invocation: { name: 'translate', args: 'hola mundo' },
      cleanText: 'hola mundo',
    })
  })

  it('handles a bare invocation with no args', () => {
    expect(parseSlashInvocation('/code-review', enabled)).toEqual({
      invocation: { name: 'code-review', args: undefined },
      cleanText: '',
    })
  })

  it('ignores unknown / disabled skills and non-slash text', () => {
    expect(parseSlashInvocation('/unknown do thing', enabled)).toBeNull()
    expect(parseSlashInvocation('just a message', enabled)).toBeNull()
    expect(parseSlashInvocation('text /translate later', enabled)).toBeNull()
  })
})
