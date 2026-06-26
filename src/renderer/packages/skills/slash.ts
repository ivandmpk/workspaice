// Slash-command invocation for skills in the composer.
// `/skill-name <args>` at the very start of the message deterministically
// invokes an enabled skill; the rest of the line becomes the skill's arguments.

export interface InvokedSkill {
  name: string
  args?: string
}

// While typing: returns the partial skill name if the input is a bare `/word`
// (no whitespace yet), else null. Drives whether the picker menu is open.
export function getSlashQuery(text: string): string | null {
  const m = /^\/([a-zA-Z0-9-]*)$/.exec(text)
  return m ? m[1].toLowerCase() : null
}

// On submit: extract a completed leading skill invocation. Returns the matched
// skill + trailing args and the text to actually send (args only). Returns null
// when the text isn't a slash command for an enabled skill — left as plain text.
export function parseSlashInvocation(
  text: string,
  enabledNames: string[]
): { invocation: InvokedSkill; cleanText: string } | null {
  const m = /^\/([a-z0-9-]+)(?:\s+([\s\S]*))?$/.exec(text.trimStart())
  if (!m) return null
  const name = m[1]
  if (!enabledNames.includes(name)) return null
  const args = m[2]?.trim() || undefined
  return { invocation: { name, args }, cleanText: args ?? '' }
}
