# WorkspAIce QA Runbook

WorkspAIce uses a layered QA suite: TypeScript and Biome for static checks, Vitest for unit/integration coverage, Playwright for Electron critical-flow smoke tests, and release-only macOS packaging verification.

## Commands

- `pnpm qa:unit` — fast source tests under `src/**`.
- `pnpm qa:integration` — integration suites under `test/integration/**`, excluding live model-provider tests.
- `pnpm qa:coverage` — unit coverage with the current ratchet thresholds.
- `pnpm qa:e2e` — builds the app and runs Playwright Electron smoke tests.
- `pnpm qa:ci` — CI gate: typecheck, Biome, unit, integration, coverage, build, E2E.
- `pnpm qa:release:mac` — release/manual macOS packaging smoke.

Use Node 22 for local runs:

```sh
PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm qa:ci
```

## CI Gates

- `.github/workflows/ci.yml` runs on macOS for pushes to `dev` and pull requests.
- CI installs with `pnpm install --frozen-lockfile` and runs `pnpm qa:ci`.
- Coverage artifacts are uploaded on every run.
- Playwright traces, screenshots, and videos are uploaded only on failure.

## E2E Coverage

Playwright launches the built Electron app with an isolated user profile via `WORKSPAICE_E2E_USER_DATA_DIR`.

Automated E2E flows cover:

- app launch to the first meaningful chat screen;
- Settings -> Model Provider navigation;
- creating/editing a mock custom provider with fake local-only values;
- composer draft input preservation without sending to any provider;
- workspace create, rename, chat-in-workspace, and delete behavior.

## Coverage Ratchet

The initial coverage gate is intentionally modest and should only move upward. If coverage drops below the current thresholds, add targeted tests or explicitly discuss a threshold change before lowering it.

## Release QA

`.github/workflows/release-qa.yml` runs manually or on release tags. It builds and packages macOS artifacts, verifies DMG outputs with `hdiutil`, and uploads `release/build`.

## Known Exclusions

- No automated test calls real AI/provider APIs, hosted services, paid APIs, or user secrets.
- Live model-provider integration tests remain excluded from default QA.
- Visual regression snapshots are not part of v1; Playwright captures screenshots only on failure.
- Windows packaging is not in v1 CI. macOS is the initial automated platform.
