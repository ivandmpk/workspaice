import fs from 'node:fs'
import path from 'node:path'

const roots = ['src', 'test/integration']
const excludedPrefixes = ['test/integration/model-provider/']
const testFilePattern = /\.(?:test|spec)\.[cm]?[jt]sx?$/
const skippedPattern = /\b(?:describe|it|test)\.(?:skip|todo|skipIf|runIf)\b/

function collect(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return collect(entryPath)
    return entry.isFile() && testFilePattern.test(entry.name) ? [entryPath] : []
  })
}

const violations = roots
  .flatMap(collect)
  .filter((file) => !excludedPrefixes.some((prefix) => file.replaceAll(path.sep, '/').startsWith(prefix)))
  .flatMap((file) =>
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .map((line, index) => ({ file, line, lineNumber: index + 1 }))
      .filter(({ line }) => skippedPattern.test(line))
  )

if (violations.length > 0) {
  console.error('Skipped or conditional tests are not allowed in deterministic QA suites:')
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.lineNumber}: ${violation.line.trim()}`)
  }
  console.error('Move credential-dependent checks under test/integration/model-provider or make the test deterministic.')
  process.exit(1)
}

console.log('No skipped tests in deterministic QA suites.')
