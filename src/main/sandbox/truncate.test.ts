import { describe, expect, it } from 'vitest'
import { headTruncate, tailTruncate } from './truncate'

describe('sandbox output truncation', () => {
  it('returns small output unchanged', () => {
    expect(headTruncate('one\ntwo', 3, 100)).toBe('one\ntwo')
    expect(tailTruncate('one\ntwo', 3, 100)).toBe('one\ntwo')
  })

  it('keeps the requested number of lines from the head', () => {
    expect(headTruncate('one\ntwo\nthree\nfour', 2, 100)).toBe(
      'one\ntwo\n\n[Output truncated. Showing first 2 of 4 lines.]'
    )
  })

  it('keeps the requested number of lines from the tail', () => {
    expect(tailTruncate('one\ntwo\nthree\nfour', 2, 100)).toBe(
      '[Output truncated. Showing last 2 of 4 lines.]\n\nthree\nfour'
    )
  })

  it('truncates multibyte output by bytes without splitting a line', () => {
    expect(headTruncate('🙂🙂\nok', 10, 5)).toBe('🙂🙂\n\n[Output truncated. Showing first 1 of 2 lines.]')
    expect(tailTruncate('ok\n🙂🙂', 10, 5)).toBe('[Output truncated. Showing last 1 of 2 lines.]\n\n🙂🙂')
  })

  it('preserves empty output', () => {
    expect(headTruncate('')).toBe('')
    expect(tailTruncate('')).toBe('')
  })
})
