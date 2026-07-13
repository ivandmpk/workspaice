// Pure chat-text zoom math. Keep this a leaf module (no store/router imports):
// it is imported by useShortcut, which is cycle-sensitive (see ARCHITECTURE_NOTES → Code Conventions).

export const CHAT_FONT_BASE_PX = 14
export const CHAT_ZOOM_MIN_PERCENT = 70
export const CHAT_ZOOM_MAX_PERCENT = 160
export const CHAT_ZOOM_STEP_PERCENT = 10

export function percentFromFontSize(px: number): number {
  return Math.round((px / CHAT_FONT_BASE_PX) * 100)
}

export function fontSizeFromPercent(percent: number): number {
  return (CHAT_FONT_BASE_PX * percent) / 100
}

/**
 * Step the chat font size one zoom increment up or down, snapping to the 10% grid
 * so legacy off-grid px values (e.g. 13px = 93%) land on a clean step: 93% → 100% up, 90% down.
 */
export function stepChatZoom(px: number, direction: 1 | -1): number {
  const percent = percentFromFontSize(px)
  const stepped =
    direction === 1
      ? Math.floor(percent / CHAT_ZOOM_STEP_PERCENT) * CHAT_ZOOM_STEP_PERCENT + CHAT_ZOOM_STEP_PERCENT
      : Math.ceil(percent / CHAT_ZOOM_STEP_PERCENT) * CHAT_ZOOM_STEP_PERCENT - CHAT_ZOOM_STEP_PERCENT
  const clamped = Math.min(CHAT_ZOOM_MAX_PERCENT, Math.max(CHAT_ZOOM_MIN_PERCENT, stepped))
  return fontSizeFromPercent(clamped)
}
