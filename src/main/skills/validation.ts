export const SKILL_NAME_RE = /^[a-z0-9-]+$/

export function isValidSkillName(value: string): boolean {
  return value.length > 0 && value.length <= 64 && SKILL_NAME_RE.test(value)
}

// Script file names may contain an extension (e.g. `run.sh`, `analyze-data.py`)
// so they allow dots/underscores, but must start with an alphanumeric (no
// hidden dotfiles), contain no path separators, and no `..` traversal.
export const SCRIPT_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export function isValidScriptName(value: string): boolean {
  return value.length > 0 && value.length <= 128 && !value.includes('..') && SCRIPT_NAME_RE.test(value)
}
