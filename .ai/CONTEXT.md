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

## Open Product Questions

- What visual direction should WorkspAIce take: minimal native desktop, futuristic workspace, dark cyber, glassy, Notion-like productivity, terminal-inspired, or another style?
- Should mobile and web build paths be removed now or only deprioritized while desktop cleanup happens first?

## Update Protocol

When an agent completes meaningful work, append or edit:

- `Current Progress` for completed changes.
- `Branding State` if names, icons, app IDs, docs, or package metadata changed.
- `Redesign And Cleanup Strategy` if priorities change.
- `Known Risk Areas` if new hazards are discovered.
- `Open Product Questions` when questions are resolved or new ones appear.
