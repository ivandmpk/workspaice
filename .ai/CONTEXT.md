# WorkspAIce Project Context

This file is living memory for AI agents working on this repository. Read it before making assumptions or starting substantial work. Keep it updated when goals, architecture, decisions, blockers, or implementation progress change.

## Project Identity

- Repository name: WorkspAIce.
- Origin: fresh fork of an existing GPLv3 desktop AI client.
- License: GPLv3. The fork is intended to remain under GPLv3 if released.
- User intent: personal/non-commercial redesign and refactor into the app experience the user wants.
- Current state: early fork cleanup and local-only product reset.

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

## Current Progress

- **v1.0.0-beta released for testing.** Built for macOS (arm64/x64, DMG) and Windows (x64/arm64, NSIS Setup.exe). All unsigned. Removed broken `signtoolOptions` reference to missing `custom_win_sign.js` from electron-builder.yml. **Development frozen until beta testing completes — no further code changes until test feedback is received.**
- **Versioning started.** First beta release tagged: `v1.0.0-beta`. Version is set in `package.json` and flows to Electron's `app.getVersion()` (About page, Sidebar, electron-builder artifact names).
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

## Open Product Questions

- ~~What visual direction should WorkspAIce take~~: resolved — clean modern productivity palette, `#F5F5F5` light / `#303841` dark / `#76ABAE` accent / `#FF5722` highlight (matches `design-materials/` icon and `color-palette.txt`).
- Should mobile and web build paths be removed now or only deprioritized while desktop cleanup happens first?
- WorkspAIceAIAPIError class still exists in src/shared/models/errors.ts and is referenced in several catch blocks. It maps hosted API error codes to user-friendly messages. Since the hosted API is removed, these errors will never be triggered, but replacing the class with generic ApiError is a follow-up task.
- Static landing site added at `landing/`. Deployment is the user's responsibility (they have their own infrastructure). Container is at `workspaice-landing` running on port 8080 locally; image is `workspaice-landing:latest`.

## Update Protocol

When an agent completes meaningful work, append or edit:

- `Current Progress` for completed changes.
- `Branding State` if names, icons, app IDs, docs, or package metadata changed.
- `Redesign And Cleanup Strategy` if priorities change.
- `Known Risk Areas` if new hazards are discovered.
- `Open Product Questions` when questions are resolved or new ones appear.
