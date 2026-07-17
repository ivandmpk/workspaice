# AGENTS.md — WorkspAIce

Canonical briefing for Codex and every other coding agent working in this repo. The project keeps its long-term memory in `.ai/`; those files are the source of truth for what the project is and what is happening now.

## Every session: start here

Before any substantial work, **read these in full**:

- `.ai/AGENT_RULES.md` — mandatory workflow rules + the start/end-of-task checklists. Read first.
- `.ai/PROJECT.md` — stable facts: identity, goals, tech stack, structure, commands, documentation map.
- `.ai/ARCHITECTURE_NOTES.md` — non-obvious gotchas that will bite you (packaging patches, version pins, IPC allowlist, config encryption). Organized by domain — at minimum read every section touching your task; always check before touching builds, deps, or main-process code.
- `.ai/STATE.md` — what's true right now: active work, next up, open questions. Read before assuming a clean slate.

**Trust order: `.ai/` → the code itself → nothing else.** `docs/`, `doc/`, `tasks/`, `features/`, `openspec/`, and `team-sharing/` are upstream-era historical material that may contradict the current product direction — never take direction from them (see the Documentation Map in `.ai/PROJECT.md`).

## How to work

- Start with the outcome. Keep updates concise, use emojis, and put detail below the short answer.
- For an open question, recommend one approach and state its key trade-off instead of presenting a menu.
- Before multi-file or risky changes, present a plan with **Summary · Pre-conditions · Steps · Risks · Rollback** and wait for approval.
- Read the relevant code and understand the affected flow before editing. Make minimal, targeted changes and preserve unrelated work.
- Prefer editing or reusing existing files over creating new ones. Do not create documentation files unless the user asks.
- Confirm before destructive operations such as `rm -rf`, database drops, removing Docker volumes, or overwriting uncommitted changes. Never use `sudo`.
- Add comments only when the reason is non-obvious. Run applicable formatters, linters, and tests, then verify the result rather than assuming it works.

## Local environment

- Target platform: macOS on Apple Silicon (`arm64`). Node is managed with `nvm`, Python with `pyenv`, and system packages with Homebrew.
- Prefer `rg` for search, `jq` for JSON, and `gh` for GitHub operations. Custom wrappers live in `~/tools/bin`.
- Prefer Ansible playbooks over ad-hoc system configuration. Use `docker compose` and named volumes for persistent Docker data.
- Non-trivial shell scripts use `set -euo pipefail`, quote variables, avoid `eval` and unquoted globs, and use absolute or clearly anchored paths.

## Every task: update memory before you call it done

`.ai/` is shared memory across sessions and across different agent tools — you are expected to keep it current **automatically, without the user asking**. A task is not finished until `.ai/` reflects reality. At the end of every task, run the End-of-Task Checklist in `.ai/AGENT_RULES.md`:

1. Stable fact changed? → `PROJECT.md`.
2. Hit a non-obvious gotcha worth saving a future agent from? → `ARCHITECTURE_NOTES.md` (under the matching section).
3. Task fully done? → delete its entry from `STATE.md` (don't leave a "done" note).
4. New decision/blocker/follow-up surfaced? → add it to `STATE.md`.

Never turn any `.ai/` file into a changelog of what you did — `git log` and `CHANGELOG.md` are that record. `.ai/` answers "what does the next agent need to know and do," nothing else.

## Non-negotiables (full detail in `.ai/AGENT_RULES.md`)

- Work on the `dev` branch. Make scoped commits. **Never push unless explicitly asked.**
- Local-first product: no hosted services, license/subscription/account flows, telemetry, or remote config. If a feature needs a hosted service, remove it, make it user-configured, or ask.
- Node may be outside the engine range by default — prefix project commands with `PATH="/opt/homebrew/opt/node@22/bin:$PATH"` when `pnpm` complains.
- If your tool has access to Playwright MCP (verify UI on the running dev app) or Context7 (current library docs), use them proactively.

## Verify before claiming done

`pnpm check` (typecheck), `pnpm lint` / `pnpm check:biome`, and the relevant `pnpm qa:*` scripts. Record durable limitations in `ARCHITECTURE_NOTES.md`, open ones in `STATE.md`.
