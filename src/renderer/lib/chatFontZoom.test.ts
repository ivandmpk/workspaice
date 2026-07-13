import { describe, expect, it } from 'vitest'
import {
  CHAT_FONT_BASE_PX,
  CHAT_ZOOM_MAX_PERCENT,
  CHAT_ZOOM_MIN_PERCENT,
  fontSizeFromPercent,
  percentFromFontSize,
  stepChatZoom,
} from './chatFontZoom'

describe('percentFromFontSize / fontSizeFromPercent', () => {
  it('maps the base font size to 100%', () => {
    expect(percentFromFontSize(CHAT_FONT_BASE_PX)).toBe(100)
    expect(fontSizeFromPercent(100)).toBe(CHAT_FONT_BASE_PX)
  })

  it('round-trips every grid step exactly', () => {
    for (let pct = CHAT_ZOOM_MIN_PERCENT; pct <= CHAT_ZOOM_MAX_PERCENT; pct += 10) {
      expect(percentFromFontSize(fontSizeFromPercent(pct))).toBe(pct)
    }
  })

  it('rounds off-grid px values to the nearest integer percent', () => {
    expect(percentFromFontSize(13)).toBe(93)
    expect(percentFromFontSize(16)).toBe(114)
  })
})

describe('stepChatZoom', () => {
  it('steps up and down by 10% from the base size', () => {
    expect(stepChatZoom(CHAT_FONT_BASE_PX, 1)).toBe(fontSizeFromPercent(110))
    expect(stepChatZoom(CHAT_FONT_BASE_PX, -1)).toBe(fontSizeFromPercent(90))
  })

  it('walks the whole grid without drifting', () => {
    let px = CHAT_FONT_BASE_PX
    px = stepChatZoom(px, 1) // 110
    px = stepChatZoom(px, 1) // 120
    px = stepChatZoom(px, -1) // 110
    expect(percentFromFontSize(px)).toBe(110)
  })

  it('clamps at both bounds', () => {
    expect(stepChatZoom(fontSizeFromPercent(CHAT_ZOOM_MAX_PERCENT), 1)).toBe(fontSizeFromPercent(CHAT_ZOOM_MAX_PERCENT))
    expect(stepChatZoom(fontSizeFromPercent(CHAT_ZOOM_MIN_PERCENT), -1)).toBe(
      fontSizeFromPercent(CHAT_ZOOM_MIN_PERCENT)
    )
  })

  it('snaps legacy off-grid px values to the next grid step', () => {
    // 13px = 93%: zoom-in lands on 100%, zoom-out on 90%
    expect(stepChatZoom(13, 1)).toBe(fontSizeFromPercent(100))
    expect(stepChatZoom(13, -1)).toBe(fontSizeFromPercent(90))
  })

  it('clamps legacy out-of-range px values onto the grid', () => {
    expect(stepChatZoom(9, -1)).toBe(fontSizeFromPercent(CHAT_ZOOM_MIN_PERCENT)) // 9px = 64%
    expect(stepChatZoom(23, 1)).toBe(fontSizeFromPercent(CHAT_ZOOM_MAX_PERCENT)) // 23px = 164%
  })
})
