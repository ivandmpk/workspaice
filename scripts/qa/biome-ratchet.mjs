// Repo-wide Biome diagnostic-count ratchet: fails when the total number of
// error/warning diagnostics rises above the committed baseline, so lint debt
// can only shrink. The changed-files gate (biome-changed.mjs) keeps touched
// files clean; this gate keeps the whole repo from regressing.
//
// Usage:
//   node scripts/qa/biome-ratchet.mjs                    # compare against baseline
//   node scripts/qa/biome-ratchet.mjs --update-baseline  # record current counts
//
// The full repo scan takes ~15-20s (biome project scanner) — acceptable for CI.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const baselineFile = path.join(import.meta.dirname, 'biome-baseline.json')

// biome exits non-zero whenever errors exist, so ignore the exit status and
// parse stdout instead. Read summary.errors/summary.warnings — they are
// totals independent of diagnostic truncation; never count the diagnostics
// array (it also contains non-error/warning entries).
const result = spawnSync('pnpm', ['exec', 'biome', 'check', '--reporter=json', '--max-diagnostics=none'], {
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
})

if (result.error) {
  console.error('biome-ratchet: failed to run biome:', result.error.message)
  process.exit(1)
}

let summary
try {
  summary = JSON.parse(result.stdout).summary
} catch {
  console.error('biome-ratchet: could not parse biome JSON output.')
  console.error(result.stdout.slice(0, 2000))
  console.error(result.stderr.slice(0, 2000))
  process.exit(1)
}

const current = { errors: summary.errors, warnings: summary.warnings }

if (process.argv.includes('--update-baseline')) {
  fs.writeFileSync(baselineFile, `${JSON.stringify(current, null, 2)}\n`)
  console.log(`biome-ratchet: baseline updated to ${current.errors} errors / ${current.warnings} warnings.`)
  process.exit(0)
}

if (!fs.existsSync(baselineFile)) {
  console.error(`biome-ratchet: no baseline at ${baselineFile}. Run with --update-baseline to create it.`)
  process.exit(1)
}

const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'))

if (current.errors > baseline.errors || current.warnings > baseline.warnings) {
  console.error(
    `biome-ratchet: diagnostics increased — current ${current.errors} errors / ${current.warnings} warnings, ` +
      `baseline ${baseline.errors} errors / ${baseline.warnings} warnings.`
  )
  console.error('Fix the new diagnostics, or (only for an agreed exception) run: pnpm qa:biome-ratchet --update-baseline')
  process.exit(1)
}

if (current.errors < baseline.errors || current.warnings < baseline.warnings) {
  console.log(
    `biome-ratchet: pass — ${current.errors} errors / ${current.warnings} warnings, below baseline ` +
      `${baseline.errors}/${baseline.warnings}. Consider ratcheting down: pnpm qa:biome-ratchet --update-baseline`
  )
} else {
  console.log(`biome-ratchet: pass — at baseline (${current.errors} errors / ${current.warnings} warnings).`)
}
