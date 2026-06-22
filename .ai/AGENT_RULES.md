# Agent Rules

These rules apply to all AI agents working in this repository.

## Required Memory Updates

- Always read `.ai/CONTEXT.md` before starting substantial work.
- Always update `.ai/CONTEXT.md` after code changes.
- Update `.ai/CONTEXT.md` when goals, architecture, product decisions, risks, blockers, verification results, or workflow rules change.
- Keep `.ai/CONTEXT.md` useful for future fresh-session agents, not as a user-facing changelog.

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

## Collaboration Discipline

- If requirements are ambiguous, ask the user instead of assuming.
- Do not overwrite unrelated user changes.
- Prefer small, correct changes over broad rewrites.
- Preserve existing behavior unless intentionally changing it for the WorkspAIce direction.
- Run relevant verification when possible and record limitations in `.ai/CONTEXT.md`.
