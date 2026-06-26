# Current State

For agents, not humans. What's true right now. Edit in place after every task (see `AGENT_RULES.md` End-of-Task Checklist items 3-4) — when an item is fully resolved, delete it rather than leaving it as a historical note. History lives in `git log` and `CHANGELOG.md`, not here.

## Active Cycle

- Development version is `1.0.2-beta` (root and `release/app` manifests). Keep working under this version until the user explicitly says it's released, then move to `1.0.3-beta`.
- Last installed/verified local macOS build: `1.0.2-beta` (`CFBundleShortVersionString` confirmed, codesign valid, ad-hoc signed for local testing).

## In Flight / Next Up

- Chat surface redesign (`MessageList.tsx`, `Message.tsx`, `InputBox.tsx`) — not started.
- `InputBox.tsx` refactor, MUI→Mantine migration, state management consolidation — deferred architecture work, no active owner.

## Open Product Questions

- Should mobile and web build paths be removed now or only deprioritized while desktop cleanup happens first?
- `WorkspAIceAIAPIError` class still exists in `src/shared/models/errors.ts` as a misnamed shared error-code mapper for local/provider/parser/search errors (hosted plan/quota/license entries already removed). Renaming it to a neutral local error mapper is a follow-up mechanical cleanup.
- Static landing site at `landing/`. Deployment is the user's responsibility (own infrastructure). Local container: `workspaice-landing`, port 8080, image `workspaice-landing:latest`.
- `webSecurity:false`, the node-fetch CVE, mobile SQLite encryption, and biome-ignore-all narrowing are tracked as known limitations — see `ARCHITECTURE_NOTES.md` Known Risk Areas for details, not duplicated here.
