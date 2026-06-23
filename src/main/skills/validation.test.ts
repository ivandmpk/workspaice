import { describe, expect, it } from 'vitest'
import { isValidScriptName, isValidSkillName } from './validation'

describe('isValidSkillName', () => {
  it('accepts lowercase kebab-case names', () => {
    expect(isValidSkillName('data-analysis')).toBe(true)
    expect(isValidSkillName('writing')).toBe(true)
    expect(isValidSkillName('skill123')).toBe(true)
  })

  it('rejects traversal, separators, and invalid characters', () => {
    expect(isValidSkillName('..')).toBe(false)
    expect(isValidSkillName('foo/bar')).toBe(false)
    expect(isValidSkillName('foo\\bar')).toBe(false)
    expect(isValidSkillName('Foo')).toBe(false)
    expect(isValidSkillName('foo.bar')).toBe(false)
    expect(isValidSkillName('')).toBe(false)
    expect(isValidSkillName('a'.repeat(65))).toBe(false)
  })
})

describe('isValidScriptName', () => {
  it('accepts script files with extensions', () => {
    expect(isValidScriptName('run.sh')).toBe(true)
    expect(isValidScriptName('analyze-data.py')).toBe(true)
    expect(isValidScriptName('process_v2.js')).toBe(true)
    expect(isValidScriptName('script')).toBe(true)
  })

  it('rejects traversal, separators, hidden files, and bad input', () => {
    expect(isValidScriptName('../etc/passwd')).toBe(false)
    expect(isValidScriptName('a/b.sh')).toBe(false)
    expect(isValidScriptName('a\\b.sh')).toBe(false)
    expect(isValidScriptName('..')).toBe(false)
    expect(isValidScriptName('foo..bar')).toBe(false)
    expect(isValidScriptName('.hidden')).toBe(false)
    expect(isValidScriptName('')).toBe(false)
    expect(isValidScriptName('a'.repeat(129))).toBe(false)
  })
})
