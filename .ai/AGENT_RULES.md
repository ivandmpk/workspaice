# Agent Rules

These rules apply to all AI agents working in this repository. The `.ai/*.md` files exist to brief the *next agent*, not to inform a human reader — write tersely, no narration, no "I did X" prose.

## Start-of-Task Checklist

1. Read `.ai/PROJECT.md`, `.ai/ARCHITECTURE_NOTES.md`, and `.ai/STATE.md` in full before substantial work.
2. Check `STATE.md`'s "In Flight / Next Up" for anything related to the current task before assuming a clean slate.

## End-of-Task Checklist

Run this **automatically at the end of every task, without being asked** — keeping `.ai/` current is part of "done," not a separate request the user has to make. Updating these files is as much a part of finishing a task as the code change itself; a task with stale `.ai/` files is not finished. Run through all four questions in order. Most tasks only trigger one or two.

1. **Did a stable fact change?** (goals, tech stack, file/folder structure, product direction) → edit `PROJECT.md` in place. Rare.
2. **Did you discover or fix something non-obvious that cost you time to figure out** (a packaging gotcha, a version-pinning constraint, a security/IPC rule, an encryption/migration behavior, a footgun a future agent would otherwise re-trip)? → add an entry to `ARCHITECTURE_NOTES.md`. Keep entries even after related work ships — only remove an entry once the underlying issue is actually gone from the code.
3. **Did the current task finish completely, with nothing left to decide or do?** → delete its entry from `STATE.md`'s "In Flight / Next Up" (or "Open Product Questions" if it was a question). Do not replace it with a "done" note — the commit and `CHANGELOG.md` are the record of what happened. If you started something but it's not finished, update its `STATE.md` entry to describe what's left, not what you did.
4. **Did the task surface a new decision, blocker, or follow-up the next agent needs to know about?** → add or update an entry in `STATE.md` under "In Flight / Next Up" or "Open Product Questions".

If none of the four apply (e.g. a one-off question, a read-only investigation), touch nothing in `.ai/`.

**Never** add a running history/changelog of completed work to any `.ai/` file — `git log` and `CHANGELOG.md` already are that record. If you're about to write a bullet describing what you *did* rather than what the next agent needs to *know* or *do differently*, delete it instead.

## Git Workflow

- Always work on the `dev` branch.
- Make reasonable, scoped commits after code changes.
- Do not push to `dev` unless the user explicitly asks.
- Before committing, inspect `git status`, `git diff --stat`, and recent commits.
- Stage only intended files.
- Never amend commits unless the user explicitly asks.
- Never use destructive commands such as `git reset --hard` or `git checkout --` unless the user explicitly approves.

## Product Direction

- WorkspAIce is a local-first desktop app for macOS and Windows.
- Keep user-configured providers, including local providers and user-supplied external API providers.
- Do not add bundled hosted services, license services, subscription flows, premium gates, account requirements, telemetry, or hosted remote configuration.
- If a feature requires a hosted service, either remove it, make it user-configured, or ask the user before proceeding.

## Available Tools And Services

- **Playwright MCP** — available for browser-based testing and interacting with the running dev app. Use it to verify UI behavior, inspect rendered pages, or test interactions.
- **Context7** — available for fetching up-to-date documentation about the project's tech stack (React, Electron, Mantine, TanStack Router, TypeScript, Vite, etc.). Use it when you need current API docs or usage examples.
- Both services are available to all agents working in this repository. Use them proactively when they would improve correctness or speed.

## Collaboration Discipline

- If requirements are ambiguous, ask the user instead of assuming.
- Do not overwrite unrelated user changes.
- Prefer small, correct changes over broad rewrites.
- Preserve existing behavior unless intentionally changing it for the WorkspAIce direction.
- Run relevant verification when possible; record durable limitations in `ARCHITECTURE_NOTES.md` and open/in-flight ones in `STATE.md` (see End-of-Task Checklist above).
