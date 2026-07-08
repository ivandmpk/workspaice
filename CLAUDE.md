# CLAUDE.md — WorkspAIce

Guidance for Claude Code agents working in this repo. This project keeps its long-term memory in `.ai/`. Those files are the source of truth for what the project is and what's going on — this file just makes sure you use them.

## Every session: start here

Before any substantial work, **read these in full**:

- `.ai/AGENT_RULES.md` — mandatory workflow rules + the start/end-of-task checklists. Read first.
- `.ai/PROJECT.md` — stable facts: identity, goals, tech stack, structure, commands.
- `.ai/ARCHITECTURE_NOTES.md` — non-obvious gotchas that will bite you (packaging patches, version pins, IPC allowlist, config encryption). Check before touching builds, deps, or main-process code.
- `.ai/STATE.md` — what's true right now: active work, next up, open questions. Read before assuming a clean slate.

## Every task: update memory before you call it done

`.ai/` is shared memory across sessions — you are expected to keep it current **automatically, without the user asking**. A task is not finished until `.ai/` reflects reality. At the end of every task, run the End-of-Task Checklist in `.ai/AGENT_RULES.md`:

1. Stable fact changed? → `PROJECT.md`.
2. Hit a non-obvious gotcha worth saving a future agent from? → `ARCHITECTURE_NOTES.md`.
3. Task fully done? → delete its entry from `STATE.md` (don't leave a "done" note).
4. New decision/blocker/follow-up surfaced? → add it to `STATE.md`.

Never turn any `.ai/` file into a changelog of what you did — `git log` and `CHANGELOG.md` are that record. `.ai/` answers "what does the next agent need to know and do," nothing else.

## Non-negotiables (full detail in `.ai/AGENT_RULES.md`)

- Work on the `dev` branch. Make scoped commits. **Never push unless explicitly asked.**
- Local-first product: no hosted services, license/subscription/account flows, telemetry, or remote config. If a feature needs a hosted service, remove it, make it user-configured, or ask.
- Node may be outside the engine range by default — prefix project commands with `PATH="/opt/homebrew/opt/node@22/bin:$PATH"` when `pnpm` complains.
- Playwright MCP (verify UI on the running dev app) and Context7 (current library docs) are available — use them proactively.

## Verify before claiming done

`pnpm check` (typecheck), `pnpm lint` / `pnpm check:biome`, and the relevant `pnpm qa:*` scripts. Record durable limitations in `ARCHITECTURE_NOTES.md`, open ones in `STATE.md`.
