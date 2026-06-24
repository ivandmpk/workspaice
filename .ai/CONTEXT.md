# WorkspAIce Project Context

This file is living memory for AI agents working on this repository. Read it before making assumptions or starting substantial work. Keep it updated when goals, architecture, decisions, blockers, or implementation progress change.

## Project Identity

- Repository name: WorkspAIce.
- Origin: fresh fork of an existing GPLv3 desktop AI client.
- License: GPLv3. The fork is intended to remain under GPLv3 if released.
- User intent: personal/non-commercial redesign and refactor into the app experience the user wants.
- Current state: `1.0.1-beta` is released; all new development now targets `1.0.2-beta` under the Unreleased changelog section.

## Product Goals

- End goal: local-first desktop app for macOS and Windows.
- Keep user-configured providers, including local providers and user-supplied external API providers.
- Remove bundled/upstream hosted services.
- Remove all license, subscription, premium, account, and paid service flows.
- Remove telemetry/analytics and hosted remote configuration.
- Preserve GPLv3 compliance.
- Prefer thoughtful, incremental refactors over broad rewrites.
- Build a foundation where AI agents can collaborate across sessions using `.ai/CONTEXT.md` as shared memory.
- The user expects agents to inspect the codebase before making assumptions and to implement practical changes when asked.

## Collaboration Rules For Agents

- Follow `.ai/AGENT_RULES.md` for mandatory workflow rules.
- Treat this file as the canonical project memory for AI-agent coordination.
- Update this file when you make meaningful architectural, design, branding, or workflow changes.
- Do not overwrite user changes or unrelated worktree changes.
- Prefer small, correct changes over large rewrites.
- Use existing patterns unless intentionally redesigning them.
- Before changing UI, identify the relevant renderer components and theme tokens.
- Before renaming internal identifiers, check for persisted data, app protocols, database paths, update endpoints, or external integrations.
- Always work on the `dev` branch.
- Make reasonable, scoped commits after code changes.
- Never push to `dev` unless the user explicitly asks.
- If a situation is ambiguous, ask the user instead of assuming.

## Tech Stack

- Runtime/app shell: Electron, Electron Vite.
- Frontend: React 18, TypeScript.
- Routing: TanStack Router, generated route tree.
- UI libraries: Mantine 7, MUI 5, Tailwind utilities, Emotion.
- State/data: Jotai, Zustand-style stores, TanStack Query, local persistent storage.
- Formatting/linting/typecheck: Biome, TypeScript.
- Package manager: pnpm.
- Node engine: `>=22.12.0 <25.0.0`.
- pnpm engine: `>=10.17.0`.

## Useful Commands

- Start desktop dev app: `pnpm dev` or `pnpm start`.
- Start web-only dev mode: `pnpm dev:web`.
- Build: `pnpm build`.
- Typecheck: `pnpm check`.
- Test: `pnpm test`.
- QA unit tests: `pnpm qa:unit`.
- QA integration tests: `pnpm qa:integration`.
- QA coverage: `pnpm qa:coverage`.
- QA Electron E2E: `pnpm qa:e2e`.
- Full QA CI contract: `pnpm qa:ci`.
- macOS release/package smoke: `pnpm qa:release:mac`.
- Lint: `pnpm lint`.
- Biome check: `pnpm check:biome`.
- Format: `pnpm format`.

## Key Project Structure

- `src/main/`: Electron main process, updater, deep links, storage, OAuth, file parsing, local services.
- `src/preload/`: Electron preload bridge.
- `src/renderer/`: React renderer app and all primary UI.
- `src/renderer/routes/`: TanStack Router route components.
- `src/renderer/routes/__root.tsx`: root app shell, providers, Mantine theme, MUI theme provider, sidebar layout, global modals.
- `src/renderer/static/globals.css`: global design tokens and Mantine color variable mapping.
- `src/renderer/static/index.css`: global base styles, scrollbar styles, safe-area behavior, fonts.
- `src/renderer/Sidebar.tsx`: primary navigation, app branding, chat/task session list, bottom nav links.
- `src/renderer/components/layout/Header.tsx`: chat route header.
- `src/renderer/components/layout/Page.tsx`: generic page shell.
- `src/renderer/components/session/`: session list and session item UI.
- `src/renderer/components/chat/`: message list, messages, loading/status/navigation.
- `src/renderer/components/InputBox/InputBox.tsx`: large composer/input component. Change carefully.
- `src/renderer/routes/settings/`: settings pages.
- `src/renderer/routes/image-creator/`: image generation UI.
- `src/renderer/routes/copilots/`: copilot UI.
- `electron-builder.yml`: desktop packaging metadata.
- `package.json`: package metadata and scripts.
- `README.md` and `doc/`: project documentation.

## Current Architecture Notes

- The root renderer route uses `MantineProvider`, MUI `ThemeProvider`, `NiceModal.Provider`, and global error boundaries.
- `routes/__root.tsx` has function `creteMantineTheme` (upstream typo preserved) that configures Mantine colors, typography, spacing, radii, and component defaults.
- `globals.css` defines CSS variables for light/dark modes. Many components depend on these variable names.
- The main shell uses a persistent/temporary `SwipeableDrawer` sidebar depending on screen size.
- Chat pages are built from `Header`, `MessageList`, `InputBox`, and `ThreadHistoryDrawer`.
- Mobile, RTL, safe-area, and desktop window-control behavior already exist. Preserve unless intentionally removing mobile/web support.
- Background images can be configured globally or per session; root route renders `BackgroundImageOverlay` for root/session pages.

## Branding State

- The active product name is WorkspAIce.
- The repository should be stripped of old upstream product naming.
- Since this is a fresh fork, local storage/database/protocol namespaces can be renamed without backward-compatible migrations unless the user later asks for data migration.
- Hosted upstream service surfaces should be removed rather than renamed into fake WorkspAIce services.

## Redesign And Cleanup Strategy

1. Establish WorkspAIce visual direction and design tokens.
2. Rebrand package metadata, app labels, protocols, local storage names, docs, and UI copy.
3. Remove hosted service references, telemetry, updater endpoints, account/license flows, and remote configuration.
4. Keep user-configured model providers and local providers.
5. Redesign the app shell: `Sidebar.tsx`, `Header.tsx`, `Page.tsx`, session list items.
6. Redesign chat surface: `MessageList.tsx`, `Message.tsx`, composer in `InputBox.tsx`.

## Design Surface Inventory

- Theme tokens: `src/renderer/static/globals.css`.
- Mantine theme/component defaults: `src/renderer/routes/__root.tsx`.
- MUI theme integration: `src/renderer/hooks/useAppTheme` and MUI provider usage in `routes/__root.tsx`.
- Base font and scrollbars: `src/renderer/static/index.css`.
- Primary navigation and branding: `src/renderer/Sidebar.tsx`.
- Chat header: `src/renderer/components/layout/Header.tsx`.
- General page shell: `src/renderer/components/layout/Page.tsx`.
- Session list: `src/renderer/components/session/SessionList.tsx` and `SessionItem.tsx`.
- Chat messages: `src/renderer/components/chat/MessageList.tsx`, `Message.tsx`, `SummaryMessage.tsx`.
- Composer: `src/renderer/components/InputBox/InputBox.tsx` plus subcomponents in the same folder.

## Known Risk Areas

- `InputBox.tsx` is very large and behavior-heavy. Prefer localized, visual changes unless refactoring with tests.
- Renaming app IDs/protocols can break installed-app behavior, deep links, settings paths, and local data. This is acceptable in the fresh fork unless the user asks for migration.
- Hosted updater/API endpoints should be removed or disabled.
- Analytics and telemetry should be removed or replaced with local no-op behavior.
- Mobile support exists via Capacitor. Preserve if not intentionally dropping mobile builds.
- RTL and safe-area behavior exists. Preserve unless intentionally redesigning supported platforms.
- **electron-builder + pnpm dependency collector (ROOT CAUSE of the recurring `Cannot find module` crashes — now fixed via patch).** electron-builder 26 picks a node-modules collector based on detected package manager. Because the repo is a pnpm workspace (`packageManager: pnpm` + `pnpm-lock.yaml`), it used `PnpmNodeModulesCollector`, which runs `pnpm list --prod --json --depth Infinity` and trusts that output. `pnpm list --json` **deduplicates/collapses repeated subtrees** (e.g. `electron-store > conf > ajv` is emitted with empty `dependencies`), so the pnpm collector silently dropped ~149 transitive packages (`fast-deep-equal`, `fast-uri`, `@emotion/*`, `@babel/*`, `function-bind`, `get-intrinsic`, etc.) from the asar → runtime `Cannot find module` crashes. The previous whack-a-mole of adding each missing dep to `release/app/package.json` was treating symptoms. **Fix:** a pnpm patch on `app-builder-lib@26.8.1` (`patches/app-builder-lib@26.8.1.patch`) that makes `out/util/appFileCopier.js` try the **NPM** collector first (`const pmApproaches = [PM.NPM, <detected>, PM.TRAVERSAL]`). electron-builder's `NpmNodeModulesCollector` runs `npm list` (which keeps a `_dependencies` field on every node) and **back-fills deduplicated subtrees** from a name@version cache, so it collects the complete tree from `release/app`'s flat npm install (created by `ensure-app-deps.cjs`). It also tolerates the mis-declared `@types/*` runtime deps that `ensure-app-deps` strips (TRAVERSAL would hard-fail on those). Result: asar went from 463 → 574 packages. NOTE: this patch is pinned to `app-builder-lib@26.8.1`; re-verify on any electron-builder upgrade.
- **pnpm 10.33 ignores the `pnpm` field in `package.json`.** Patch/override/onlyBuiltDependencies config now MUST live in `pnpm-workspace.yaml`. The existing `patchedDependencies`/`overrides`/`onlyBuiltDependencies` were silently ignored under pnpm 10.33 until moved to `pnpm-workspace.yaml`. They now live there.
- **npm (release/app) does NOT honor pnpm `overrides` → version-coupled packages must be exact-pinned in `release/app/package.json`.** `ensure-app-deps.cjs` runs `npm install` in `release/app`, and npm ignores the pnpm `overrides` in `pnpm-workspace.yaml`. With caret ranges, npm pulled `@mastra/libsql@0.13.8` (peer `@mastra/core >=0.15.3 <0.16`) while `@mastra/core` stayed `0.13.2`, causing `TypeError: Class extends value undefined` (`@mastra/libsql/dist/index.cjs` extends `storage.ObservabilityStorage`, which only exists in core 0.15.x). Dev was unaffected because pnpm overrides pin a compatible `0.13.2` set. **Fix:** `@mastra/core`, `@mastra/libsql`, `@mastra/rag` are now **exact-pinned** (`0.13.2`/`0.13.2`/`1.0.8`) in `release/app/package.json` to mirror the pnpm overrides. Any future version-coupled dependency must likewise be exact-pinned in `release/app/package.json`, not just overridden in `pnpm-workspace.yaml`. (Other overrides — `@tanstack/*` are build-time only; `handlebars`/`convict`/`fast-xml-parser` are `>=` security minimums npm satisfies anyway — so only `@mastra` needed pinning.)
- **General coupling note.** Always run `pnpm install` at the workspace root after changing either `package.json`/`pnpm-workspace.yaml` or `release/app/package.json`. With the NPM-collector patch, missing transitive deps no longer need to be added manually to `release/app/package.json`; the collector now packs the complete flat npm tree.
- **node-fetch@2.7.0 in release/app (CVE-2022-0235 / CVE-2023-26159 — cannot remove yet).** `node-fetch@2.7.0` is a required direct dep in `release/app/package.json` because `zeroentropy` (pulled in by `@mastra/rag`) requires it, and removing it caused `Cannot find module 'whatwg-url'` crashes in the packaged app. No patched 2.x version exists; 3.x is ESM-only and incompatible with the CJS Electron main process. Long-term fix: remove or scope the `@mastra/rag` import so `zeroentropy` is not eagerly loaded at main-process startup.
- **IPC channel allowlist.** The preload bridge (`src/preload/index.ts`) now validates all `invoke()` calls against `src/shared/ipc-channels.ts` (105 channels). If you add a new `ipcMain.handle` registration, you **must** also add the channel string to `INVOKABLE_IPC_CHANNELS` in `ipc-channels.ts` or it will be blocked at the bridge.
- **Config encryption key.** `config.json` is encrypted at rest via electron-store + safeStorage. The OS-keychain-protected key is stored at `{userData}/.config-key`. If this file is deleted or corrupted (e.g. macOS keychain reset), the store falls back to re-generating a new key and re-encrypting — but the old encrypted data will be unreadable. Advise users not to delete `.config-key`.

## Current Progress

- **v1.0.0-beta hardening baseline closed.** Built for macOS (arm64/x64, DMG) and Windows (x64/arm64, NSIS Setup.exe). All unsigned. Removed broken `signtoolOptions` reference to missing `custom_win_sign.js` from electron-builder.yml. Post-release macOS packaging fixes and the security hardening pass are now documented as part of the completed `1.0.0-beta` baseline.
- **Versioning moved to 1.0.2-beta planning.** `1.0.1-beta` is released; all future development should be tracked under `1.0.2-beta` / Unreleased until that beta is cut. Release version values are set in `package.json` and `release/app/package.json` and flow to Electron's `app.getVersion()` (About page, Sidebar, electron-builder artifact names), but do not bump them until a release-prep task.
- **Root changelog added.** `CHANGELOG.md` records the complete fork-to-now changeset and now reserves an Unreleased `1.0.2-beta` section for all future development.
- **Installed local 1.0.1-beta macOS arm64 test build.** Ran `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm build` and `pnpm exec electron-builder --mac --arm64`; build completed with pre-existing Rollup warnings. Replaced `/Applications/WorkspAIce.app` with `release/build/mac-arm64/WorkspAIce.app`. Installed app reports `CFBundleShortVersionString=1.0.1-beta`, code signature verifies, and launch smoke check shows main/GPU/network/renderer processes running after startup.
- Initial repository scan completed.
- Confirmed GPLv3 license file exists at `LICENSE`.
- Identified main renderer redesign entry points and branding references.
- Created `.ai/CONTEXT.md` as first AI-agent coordination artifact.
- User decided WorkspAIce should be a local-first macOS/Windows desktop app with user-configured providers and no hosted bundled services, licenses, subscriptions, or telemetry.
- User workflow rule: always work on `dev`, commit reasonable code changes, do not push unless asked.
- Broad text/path rebrand from the old upstream product name to WorkspAIce completed.
- Hosted provider registration was removed from shared providers.
- New default chat/image sessions now use OpenAI provider defaults instead of the removed hosted provider.
- Renderer startup no longer initializes hosted telemetry, hosted remote config, license reconciliation, or hosted update listeners.
- Hosted remote API module was replaced with local-first stubs returning empty data or explicit local-only errors.
- Hosted provider settings routes and component subtree were deleted.
- Verification note: `git diff --check` passes and old-name text/path searches pass. Use Homebrew Node 22 for project commands because the default shell Node may be outside the repo engine range: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" <command>`.
- Added `.ai/AGENT_RULES.md` with mandatory rules for context updates, dev-branch workflow, commits, no pushes unless asked, local-first product constraints, and ambiguity handling.
- Simplified `README.md` to describe WorkspAIce as a GPLv3 fork of the original Chatbox app, document the local-first macOS/Windows direction, remove upstream marketing/download/service content, and keep relevant setup/development details.
- Overhauled `README.md` with centered app icon banner, dedicated Credits section honoring the Chatbox team, restructured sections (Direction, Provider Model, Development), removed AI Agent Workflow (stays in `.ai/`), added emojis throughout.
- Installed dependencies with Node 22. `pnpm install` completed; native `zipfile` attempted a source build and logged `/bin/sh: python: command not found`, but install/postinstall completed.
- Started the desktop dev app with Node 22. Main/preload/renderer booted at `http://localhost:1212/`; PID/log during this session: `32121`, `/var/folders/_8/9kbq_whj0cz1g_ybdxbvppp00000gn/T/opencode/workspaice-dev.log`.
- Fixed dev startup blockers from hosted-service cleanup: `useProviders.ts` syntax error, missing `icon-workspaice.svg`, stale hosted guide copy, local-only remote/license stubs, remote dialog types, image-model groups, knowledge-base remote config access, and image-generation settings import.
- Verification note: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm exec tsc --noEmit` passes. Latest dev log shows app initialization and Vite HMR reload noise, not the previous renderer compile blockers.
- Removed remaining visible cloud-service settings from screenshots: built-in WorkspAIce MCP server provisioning, WorkspAIce AI web search, WorkspAIce search upsells, and error-reporting toggles.
- MCP is now custom-server only in the settings UI/menu/bootstrap path; stale `enabledBuiltinServers` config is ignored by runtime paths.
- Web search now defaults to Bing. Supported settings providers are Bing, Tavily, BoCha, and Querit; Tavily remains the only parse-link provider. The deleted WorkspAIce cloud search provider is no longer selectable or loaded.
- Error/event reporting is disabled by default and upload paths are no-op: renderer/main Sentry adapters, Sentry init, Plausible/JK analytics init, generic event tracking, and global error reporting now avoid remote reporting.
- Verification note: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm exec tsc --noEmit`, related Vitest files, and `git diff --check` pass after the cloud-service settings cleanup.
- Browser-tested the running app with Playwright MCP at `http://localhost:1212/`. Verified MCP settings show only custom MCP servers, Web Search defaults to Bing with no WorkspAIce AI option, and General settings has no error-reporting toggle.
- Playwright found failed remote asset loads from persisted seeded sessions using `static.workspaiceai.app` and `download.workspaiceai.app`. Added an image/avatar runtime guard so those bundled hosted asset URLs are treated as absent and are not requested, including for existing local storage.
- Added "Available Tools And Services" section to `.ai/AGENT_RULES.md` documenting that Playwright MCP and Context7 are available to all agents for browser testing and tech-stack documentation lookups.
- Recolored renderer theme tokens to the WorkspAIce 4-color palette from `design-materials/color-palette.txt`: light `#F5F5F5` / dark `#303841` / accent `#76ABAE` / second accent `#FF5722`. Functional colors (error/success/warning) kept distinct but harmonized to the palette. Remapped `src/renderer/static/globals.css` (light + dark blocks + new accent2 Mantine bindings), `src/renderer/static/index.css` (scrollbar + link colors), `src/renderer/hooks/useAppTheme.ts` (MUI dark bg), and registered `workspaice-accent2` in `src/renderer/routes/__root.tsx` Mantine theme. UI structure untouched — only color tokens. Verified with Playwright MCP at `http://localhost:1212/`: light guide, dark home, dark settings, dark chat composer all render with correct off-white / slate / teal / orange palette. `tsc --noEmit` passes. 9 pre-existing vitest failures and biome issues in unrelated files (hosted-service test remnants) confirmed pre-existing on baseline.
- Fixed provider icons in Settings → Model Provider by replacing `import.meta.glob` in `src/renderer/components/settings/provider/providerIcons.tsx` with explicit per-icon imports for all 18 PNGs in `src/renderer/static/icons/providers/`. The glob path with `eager: true` and `<{ default: string }>` type assertion was producing a non-URL string in this Vite/Electron-Vite version, causing Mantine `<Image>` to render the broken-image placeholder. Explicit imports guarantee a valid Vite asset URL. Verified with Playwright MCP: all 7 featured icons (OpenAI, Gemini, Claude, DeepSeek, SiliconFlow, OpenRouter, Ollama) now render their colored brand marks in both light and dark mode. `tsc --noEmit` passes.
- Completed category-A telemetry/credentials removal: deleted GA4 Measurement Protocol client (`analystic-node.ts`) with hardcoded api_secret, removed gtag+Plausible scripts from all HTML shells, deleted sentry SDK imports replaced with local no-op shim (`sentry_shim.tsx`), removed sentry vite/webpack plugins and all @sentry/* deps, deleted protect.ts anti-piracy redirect, removed dead env stubs. Verification: tsc, biome, and git diff --check pass.
- Completed category-B hosted endpoint and URL removal: deleted app-updater.ts, electron-updater dep, publish block from electron-builder.yml; removed updater UI from Sidebar, about, and settings; removed CORS proxy URL from request.ts; deleted Artifact feature (Artifact.tsx, ArtifactPreview.tsx, artifact-preview modal); stripped demo/seed data from initial_data.ts; removed isBlockedRemoteAssetUrl guard; repointed about/menu/format-chat/provider links from workspaiceai.app to github.com/ivandmpk/workspaice; removed HTTP-Referer header from OpenRouter/OpenAI model definitions; removed remoteConfig/setting_workspaiceai_first branching; simplified useVersion.ts. Verification: tsc passes.
- Completed category-C license/account subsystem removal: deleted premiumActions.ts, authInfoStore.ts, WorkspAIceWelcomeCard.tsx, ClaimWaitingCard.tsx; removed license fields from settings schema (licenseKey, licenseInstances, licenseDetail, licensePlanName, licenseActivationMethod, accessToken, refreshToken, WorkspAIceAIModel); removed WorkspAIceAIAPIError imports from most callers (class still referenced in some catch blocks); removed hosted OAuth/login stubs from remote.ts; deleted remote-file-parser.ts, workspaice-parser.ts; removed workspaice-ai from DocumentParserType, KnowledgeBaseProviderMode, KB/RAG model-providers; deleted copilots route directory and all copilot references; removed unused remote stubs (getPremiumPrice, getDialogConfig, getSessionRagConfig, getModelManifest, uploadAndCreateUserFile). Verification: tsc passes, route tree regenerated.
- Completed category-D docs/i18n cleanup: updated docs/ (auto-updater.md, ai-providers.md, tools-and-integrations.md, session-module-split-plan.md, dependency-reorg.md, README-CN.md); removed hosted-service keys from all 14 locale translation.json files; cleaned changelog entries and for-key-scan.ts; updated prd-*.md files.
- Replaced app icon across every surface with the WorkspAIce W + AI mark from `design-materials/icon-main.png`. Added `scripts/regen-app-icons.mjs` + `png2icons` devDep for deterministic regeneration. Outputs (25 files): `assets/icon.png` (1024), `assets/icon.icns` (Mac), `assets/icon.ico` (Win, 9 sizes), `assets/icons/{16..1024}x{...}.png` (Linux set), `assets/iconTemplate{,.@2x.,Raw,RawPreview}.png` (macOS tray uses monochrome 'W' template per Apple conventions — 'AI' badge dropped at 16px), `src/renderer/static/icon.png`, `src/renderer/static/favicon.png`, `src/renderer/favicon.ico` (9 sizes), `src/renderer/logo192.png` (was missing but referenced). Hand-authored new 24×24 `icon-workspaice.svg`, 256×256 `assets/icon.svg` (conceptual source), and replaced splash-screen SVG in both `src/renderer/index.html` and `src/renderer/index.ejs` (was old chat-bubble face with 9 concentric circles; now W + AI mark with subtle 2-circle backdrop). Mobile sources: `resources/icon-only.png` (1024), `icon-foreground.png` (1024), `icon-background.png` (1024 flat slate), `splash.png` + `splash-dark.png` (2732×2732) — ready for `pnpm mobile:assets`. `tsc` passes, biome passes on script. Playwright MCP confirmed sidebar logo and Guide card show new icon; `/static/icon.png` (715KB), `/static/favicon.png` (1.3KB), `/favicon.ico` (89KB, 9 sizes) all serve the new mark. Run `PATH="/opt/homebrew/opt/node@22/bin:$PATH" node scripts/regen-app-icons.mjs` to regenerate.
- Removed the Getting Started/onboarding guide completely from the renderer startup path: deleted `src/renderer/routes/guide/`, deleted unused `onboardingStore`, removed `/guide` sidebar/help navigation, removed `guide` from session type unions, and removed the guide startup redirect. Desktop renderer bootstrap now resets the hash to `#/` before mounting so launches always open the blank new-chat page instead of restoring a previous route/session. New chat creation no longer preselects `defaultChatModel` or last-used chat model; `chatStore.createSession` only applies last-used defaults to picture sessions. Removed the first-run Message Layout prompt and obsolete Startup Page setting. Verification: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm exec tsc --noEmit`, `git diff --check`, `pnpm build`, and `pnpm exec electron-builder --mac` pass. Installed `/Applications/WorkspAIce.app` from `release/build/mac-arm64/WorkspAIce.app`, ad-hoc signed it, and verified via CDP that startup hash is `#/`, body contains `Select Model` and `What can I help you with today?`, and does not contain `Getting Started`, `Boxy`, or `Message Layout`; `app.asar` contains no guide/onboarding files. Packaging note: local unsigned macOS builds use `hardenedRuntime: false` in `electron-builder.yml` to avoid Electron Framework Team ID mismatch when no Developer ID cert is available.
- Fixed Ollama image-input gating for local vision models. `src/shared/providers/definitions/models/ollama.ts` now enriches listed Ollama models through native `POST /api/show` and adds `vision` when Ollama reports it in `capabilities`; when that metadata is unavailable, a tighter fallback allowlist includes current Ollama vision families such as `gemma4`, `qwen3-vl`, `qwen3.5`, `qwen3.6`, MiniCPM-V, GLM-OCR, Nemotron, MedGemma, Ministral, and DeepSeek-OCR. The fallback no longer broadly marks all `qwen3*` models as vision and excludes text-only `gemma3:270m`/`gemma3:1b` variants. Manual model capability checkboxes remain supported.
- Removed remaining visible hosted trial/upgrade error surfaces from chat and adjacent error flows: chat error cards no longer render the `WorkspAIce AI free trial available` link; knowledge-base failed-file server parsing retry UI was removed; image-generation/file-parse/shared WorkspAIceAI error components now route upgrade-style placeholders to local settings or inert spans instead of hosted plan/login URLs. Deleted the now-unused `RemoteRetryModal.tsx`.
- Verification note for the Ollama vision/local-only cleanup: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm exec tsc --noEmit` passes; `git diff --check` passes; `pnpm build` passes with pre-existing Rollup chunk/eval warnings; dev renderer at `http://localhost:1212/` loads with no console errors and Playwright confirmed the initial page has no free-trial text. Built macOS x64 and arm64 artifacts via `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm exec electron-builder --mac --arm64 --x64`; x64 packaged unsigned and arm64 was ad-hoc signed. Replaced `/Applications/WorkspAIce.app` with `release/build/mac-arm64/WorkspAIce.app`, re-signed ad hoc, and verified the installed app process launches. Window inspection via AppleScript was blocked by macOS Assistive Access permissions, so installed-app smoke verification is launch/process-level only.
- Added `landing/` static site advertising WorkspAIce: 5-section single page (hero with dual CTA — Download v1.0.0-beta + View on GitHub, why/providers/credits/footer), flat minimal aesthetic, light + dark themes via `[data-theme]` with toggle, respects `prefers-color-scheme` and `prefers-reduced-motion`, mobile-first responsive. Uses 4-color palette from `design-materials/color-palette.txt` (#F5F5F5 / #76ABAE / #303841 / #FF5722) with darker accessibility variants (#3F7679 for teal text, #C2410C for orange button) to hit WCAG AA 4.5:1 contrast; brand-bright #FF5722 / #76ABAE reserved for decorative use (heart, AI badge, card icon shape). All assets copied locally; no external runtime dependencies. `Dockerfile` uses `nginx:1.27-alpine` with `nginx.conf` providing gzip, 1y immutable cache for `/assets/`, no-cache for HTML, 5-min must-revalidate for root `/style.css` and `/app.js`. Built and ran locally with `docker build` + `docker run -p 8080:80`; verified with Playwright MCP at `http://127.0.0.1:8080/`: light + dark + mobile (390×844) snapshots all render cleanly, no console errors, theme toggle persists in localStorage, anchor links smooth-scroll, download CTA points to `https://github.com/ivandmpk/workspaice/releases/tag/1.0.0-beta`. WCAG AA contrast verified for both themes (light: body 10.90, muted 5.50, eyebrow/local/link 4.72, primary button text 5.18; dark: body 10.90, muted 5.76, eyebrow/link 6.27, primary button text 5.18). Committed on dev: feat(landing) and fix(landing) a11y/cache. Deployment is the user's responsibility.
- **Fixed macOS packaged app crash: missing runtime deps in app.asar.** The v1.0.0-beta macOS build crashed on launch with `Cannot find module 'electron-debug'` because `pnpm-lock.yaml` had a stale entry for `release/app` with only 2 deps from before the v1.0.0-beta package.json update (commit 575d29e). electron-builder uses pnpm for dep resolution, so the stale lock file caused the asar to include only ~19 packages instead of the expected 320+. Regenerated `pnpm-lock.yaml`, fixed `electron-debug` crash. A second crash (`Cannot find module 'protobufjs/minimal'`) followed because `protobufjs` is a peer dependency of `@opentelemetry/otlp-transformer` (pulled in by `@mastra/core` → `@mastra/rag`) — electron-builder skipped it as a peer dep. Added `protobufjs` plus 10 additional missing runtime/peer deps (`@opentelemetry/resources`, `@opentelemetry/sdk-metrics`, `@opentelemetry/sdk-trace-base`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/context-async-hooks`, `yauzl`, `brace-expansion`, `content-disposition`, `type-is`, `path-to-regexp`, `tar`) as direct dependencies to both `release/app/package.json` and root `package.json`. `release/app/package.json` now has 35 production deps (up from 23). Rebuilt macOS arm64+x64 artifacts and replaced `/Applications/WorkspAIce.app`. Verified: dev instance runs clean with no module-not-found errors; installed app launches (PID 94357) with no crash dialog; arm64 asar contains 313 unique packages including all new deps.
- **Extended macOS packaged app dependency fix for protobufjs and zeroentropy/node-fetch.** A later packaged arm64 launch failed with `Cannot find module '@protobufjs/aspromise'` from `protobufjs/src/util/minimal.js`; added the full `protobufjs@7.5.4` runtime helper closure as direct production deps in both root and `release/app` manifests (`@protobufjs/aspromise`, `base64`, `codegen`, `eventemitter`, `fetch`, `float`, `inquire`, `path`, `pool`, `utf8`, plus `long`) and pinned `protobufjs` to `7.5.4`. The next launch failed with `Cannot find module 'whatwg-url'` from `zeroentropy` → `node-fetch@2.7.0`; added `node-fetch@2.7.0`, `whatwg-url@5.0.0`, `tr46@0.0.3`, and `webidl-conversions@3.0.1` as direct production deps too. Regenerated `pnpm-lock.yaml` and `release/app/package-lock.json`, rebuilt with `pnpm build`, packaged with `pnpm exec electron-builder --mac --arm64 --x64`, and verified both arm64 and x64 `app.asar` contain the protobuf and URL dependency closures. Rebuilt arm64 app launched from `release/build/mac-arm64/WorkspAIce.app` and remained running after startup with no module-not-found crash observed. `git diff --check` passes. Follow-up: consider replacing broad `@mastra/rag` imports or vendoring the small chunking helper to avoid eagerly loading `zeroentropy` at main-process startup.
- **ROOT-CAUSE FIX for the recurring `Cannot find module` crashes (replaces the whack-a-mole above).** Diagnosed that electron-builder 26's `PnpmNodeModulesCollector` (`pnpm list --prod --json --depth Infinity`) deduplicates repeated subtrees and silently dropped ~149 transitive packages from the asar (current trigger: `Cannot find module 'fast-deep-equal'` from `electron-store > conf > ajv`, whose deduplicated occurrence had empty `dependencies`). Fixed by adding `patches/app-builder-lib@26.8.1.patch` that forces electron-builder to try the **NPM** collector first in `out/util/appFileCopier.js` (`pmApproaches = [PM.NPM, <detected>, PM.TRAVERSAL]`); the NPM collector back-fills deduped subtrees via its `_dependencies` cache and tolerates the stripped `@types/*` deps. Asar grew 463 → 574 packages; verified `fast-deep-equal`, `fast-uri`, `json-schema-traverse`, `require-from-string`, `@emotion/react`, `@babel/runtime`, etc. now present. Also discovered pnpm 10.33 ignores the `pnpm` field in `package.json`, so moved `patchedDependencies`/`overrides`/`onlyBuiltDependencies` into `pnpm-workspace.yaml` (the prior 3 patches/overrides had been silently inactive).
- **Security hardening pass completed (CODE_REVIEW.md findings addressed).** 8 commits on dev branch. Changes: (1) IPC channel allowlist — 105 channels enumerated in `src/shared/ipc-channels.ts`; preload validates every `invoke()` call against the allowlist, blocking arbitrary channel access. (2) CSP + `X-Content-Type-Options` added via `onHeadersReceived`; `_headers` expanded with CSP, nosniff, Referrer-Policy, HSTS. (3) `nodeIntegration:false`/`contextIsolation:true` pinned explicitly; `webSecurity:false` kept (renderer needs it for CORS-free provider API calls — see Open Questions). (4) Config at rest encrypted via electron-store + OS keychain (`safeStorage`); migration from plaintext is non-destructive and one-time; 17 legacy plaintext backups purged on first run. (5) Sandbox `cwd` restricted to sandbox root; `writeFile` uses stdin instead of shell interpolation. (6) Skills `execute-script` validates `skillName` via `isValidSkillName()` and `scriptName` via new `isValidScriptName()`; tests added. (7) Skills IPC `catch+throw` converted to structured `{success:false,error}` envelopes for install/delete/check-update. (8) `tar` upgraded `^4.4.19 → ^7.5.16` (CVE-2021-37712). (9) Legacy Webpack ecosystem removed (17 devDeps, `.erb/configs/`, `.eslintrc.js`). (10) Dead Sentry no-op call removed; `configAtoms.ts` deleted; `Mermaid.tsx Loading...` i18n-routed. Verified: tsc clean, 9 pre-existing vitest failures unchanged (0 new failures), 4 new passing tests, full Playwright CDP regression pass (27 checks), `pnpm build` succeeds.
- **Second packaged crash fixed: `@mastra/libsql` version skew.** After the asar was complete, launch hit `TypeError: Class extends value undefined` at `@mastra/libsql/dist/index.cjs` (extends `storage.ObservabilityStorage`). Cause: `ensure-app-deps.cjs` runs `npm install`, which ignores pnpm `overrides`; with caret ranges npm pulled `@mastra/libsql@0.13.8` (peer `@mastra/core >=0.15.3`) against the pinned `@mastra/core@0.13.2`. Fixed by exact-pinning `@mastra/core@0.13.2`, `@mastra/libsql@0.13.2`, `@mastra/rag@1.0.8` in `release/app/package.json` to mirror the pnpm overrides / working dev set. Rebuilt arm64+x64; packaged `@mastra/libsql` is now 0.13.2 (0 `ObservabilityStorage` refs); ad-hoc-signed arm64 app from `release/build/mac-arm64/WorkspAIce.app` launches and stays running (main + 3 renderer/GPU/utility helpers), no crash dialog, no DiagnosticReports. Dev instance (`pnpm dev`, `http://localhost:1212/`) also boots clean. See Known Risk Areas for the durable rules (NPM-collector patch, pnpm-workspace.yaml config home, exact-pin version-coupled deps in release/app).
- **Introduced Workspaces: local folders for organizing chats.** Sessions now support optional `workspaceId` in shared schemas and session metadata; IndexedDB stores it naturally and mobile SQLite maps it through a `workspace_id` column with an additive migration. Added local `workspaceStore` backed by `StorageKey.Workspaces` for workspace CRUD, expanded state, and destructive `deleteWorkspaceAndSessions()` behavior. Sidebar `SessionList` now renders ungrouped chats under `Chat`, user folders under `Workspaces`, and supports creating/renaming/deleting workspaces, moving chats via row menu, and drag/drop into workspace groups. Deleting a workspace deletes all chats inside it by product decision; ungrouped chats remain in the `Chat` section. Verification: targeted Vitest metadata tests pass (26 tests), Biome passes on feature files, `git diff --check` passes, Playwright on local dev verified create modal, modal reset, menu move into/out of workspace, drag/drop into workspace, destructive delete confirmation, cleanup of temporary workspaces, and final reload with 0 console errors (only pre-existing Jotai/mobile-meta warnings). Full `tsc --noEmit` is currently blocked by an unrelated missing `@anthropic-ai/sandbox-runtime` import in `src/main/sandbox/manager.ts`.
- Added a compact red/orange `BETA` badge to the Sidebar branding row between `WorkspAIce` and the version number, using the existing `workspaice-accent2` Mantine color token so the visual reminder works in both light and dark themes. Verification: `biome check src/renderer/Sidebar.tsx` and `git diff --check` pass; browser smoke check at `http://localhost:1212/` confirmed one `BETA` badge in the sidebar title row with no console errors. Full `tsc --noEmit` remains blocked by the known unrelated missing `@anthropic-ai/sandbox-runtime` import in `src/main/sandbox/manager.ts`.
- **Released `1.0.1-beta` in `CHANGELOG.md` and rebuilt macOS artifacts.** Added the `2026-06-23` release date and beta badge note to the changelog. Hardened `.erb/scripts/ensure-app-deps.cjs` so packaging moves generated `release/app/node_modules` out of the way before removal; this avoids transient macOS `ENOTEMPTY` cleanup failures during multi-arch electron-builder runs. Verification: `pnpm build` passed with existing Rollup warnings; `pnpm exec electron-builder --mac --arm64 --x64` completed; `hdiutil verify` passed for `release/build/WorkspAIce-1.0.1-beta.dmg` and `release/build/WorkspAIce-1.0.1-beta-arm64.dmg`; both packaged app bundles report `CFBundleShortVersionString=1.0.1-beta`. SHA256: x64 DMG `956c7ecea817dd8edade4cb39bb8f0bef281d6c5912e668d0a17c0ce64317dc0`; arm64 DMG `2fc04d4f7d9a542c09f25f79e0d3271b67a5be2ece992e96edf0d15ad87fa3d5`.
- **Removed remaining hosted license compatibility and stale Copilots/i18n remnants.** Settings schema/defaults no longer include hosted license fields (`licenseKey`, license detail/instances/plan/activation/expired state, memorized manual key); settings export now labels secrets as `API Keys`. Session file/link preprocessing is local-only: large attachment session-retrieval licensing checks were removed, link preprocessing always uses the local parser, and stale hosted indexing errors now render as local-only guidance. Deleted the unused Lemon Squeezy license module and removed license-specific image-generation recovery UI. The legacy `WorkspAIceAIAPIError` mapper was narrowed to local/provider/parser/search errors with hosted plan/quota/license entries removed; locale JSON files and `for-key-scan.ts` were cleaned of license, Copilots, and WorkspAIce AI hosted-service keys. Knowledge Base and parser labels now use Local/MinerU wording instead of WorkspAIce AI service wording. Verification: focused Vitest passes (`sessionHelpers.test.ts`, `homeWelcomeCard.test.ts`, 14 tests), `git diff --check` passes, targeted stale-string scans pass except intentional false positives (`isProviderAvailable`, GPL/plugin license metadata, third-party registry descriptions). Full `tsc --noEmit` remains blocked only by the known unrelated missing `@anthropic-ai/sandbox-runtime` import in `src/main/sandbox/manager.ts`.
- **QA/testing suite implemented.** Added the stable QA script contract (`qa:unit`, `qa:integration`, `qa:coverage`, `qa:e2e`, `qa:ci`, `qa:release:mac`) with Vitest unit/integration configs, v8 coverage thresholds based on the initial measured baseline, Playwright Electron E2E config, and macOS-only GitHub Actions workflows for CI and release QA. `WORKSPAICE_E2E_USER_DATA_DIR` now isolates Electron `userData` before store initialization for E2E runs, and the built-but-unpackaged app can load the correct preload bundle. Critical E2E coverage launches the app, opens/edits mock provider settings without real secrets, preserves composer draft state without sending, and exercises workspace create/rename/chat/delete flows. Added focused jsdom/component coverage for provider add-modal state and refreshed stale tests around local/provider error codes, image generation local provider flow, and SQLite workspace metadata. `src/main/sandbox/sandbox-runtime.d.ts` locally declares the optional sandbox runtime so typecheck is unblocked without adding runtime behavior. `doc/QA-RUNBOOK.md` documents commands, gates, coverage ratchet policy, release QA, and exclusions. Verification: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm qa:ci` passes end-to-end, including 1025 unit tests, 31 integration tests, coverage, build, and 4 Playwright Electron E2E tests; `git diff --check` passes.
- Moved the Sidebar `BETA` badge below the WorkspAIce brand text instead of inline between the title and version, keeping the version on the title row. Verification: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm exec biome check src/renderer/Sidebar.tsx` and `git diff --check` pass.

## Open Product Questions

- ~~What visual direction should WorkspAIce take~~: resolved — clean modern productivity palette, `#F5F5F5` light / `#303841` dark / `#76ABAE` accent / `#FF5722` highlight (matches `design-materials/` icon and `color-palette.txt`).
- Should mobile and web build paths be removed now or only deprioritized while desktop cleanup happens first?
- WorkspAIceAIAPIError class still exists in `src/shared/models/errors.ts` as a misnamed shared error-code mapper for local/provider/parser/search errors. Hosted plan/quota/license entries have been removed. Renaming it to a neutral local error mapper is a follow-up mechanical cleanup.
- Static landing site added at `landing/`. Deployment is the user's responsibility (they have their own infrastructure). Container is at `workspaice-landing` running on port 8080 locally; image is `workspaice-landing:latest`.
- **webSecurity:false** — kept because the renderer makes provider API requests via `fetch()` directly, and most providers don't send CORS headers. Re-enabling requires routing all provider requests through the main process (no CORS), tracked as a dedicated follow-up.
- **node-fetch CVEs** — unfixable in 2.x, cannot remove without a packaged-app crash, long-term fix is removing the zeroentropy/@mastra/rag import path. Tracked.
- **Mobile SQLite encryption** — `storages.ts:109` still uses `'no-encryption'`. SQLCipher for Capacitor is a follow-up pending the mobile-support decision.
- **biome-ignore-all directives** — 4 files suppress `noExplicitAny` blanket. Narrowing to per-line suppressions is a low-priority cleanup. `settingsStore.ts` also suppresses `noFallthroughSwitchClause` for the migration switch.
- **InputBox.tsx refactor, MUI→Mantine migration, state management consolidation** — deferred architecture work, tracked separately.

## Update Protocol

When an agent completes meaningful work, append or edit:

- `Current Progress` for completed changes.
- `Branding State` if names, icons, app IDs, docs, or package metadata changed.
- `Redesign And Cleanup Strategy` if priorities change.
- `Known Risk Areas` if new hazards are discovered.
- `Open Product Questions` when questions are resolved or new ones appear.
