import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function existing(files) {
  return files.filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
}

const baseRef = process.env.QA_BIOME_BASE || (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/dev')
const committed = git(['diff', '--name-only', '--diff-filter=ACMR', `${baseRef}...HEAD`])
const unstaged = git(['diff', '--name-only', '--diff-filter=ACMR'])
const staged = git(['diff', '--name-only', '--diff-filter=ACMR', '--cached'])
const files = existing([...new Set([...committed, ...staged, ...unstaged])])

if (files.length === 0) {
  console.log('No changed files to check with Biome.')
  process.exit(0)
}

const result = spawnSync('pnpm', ['exec', 'biome', 'check', ...files], {
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
