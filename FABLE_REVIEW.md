# FABLE_REVIEW.md — WorkspAIce App Review

**Date:** 2026-07-02
**Reviewer:** Claude Fable 5 (read-only review; no code changed)
**Scope:** Full Electron app — main process, preload, renderer, packaging, security posture, UI/UX
**Verified during review:** `pnpm check` ✅ clean · `pnpm qa:unit` ✅ 1,099/1,099 pass (5.4s) · full `biome check` ❌ 120 errors / 840 warnings (see Code Quality) · app launched via `pnpm dev:web` with isolated `WORKSPAICE_E2E_USER_DATA_DIR` and inspected manually

This document is written for future LLM/coding agents. Every recommendation names files and is scoped so it can be turned into a task directly. Read `.ai/AGENT_RULES.md`, `.ai/PROJECT.md`, `.ai/ARCHITECTURE_NOTES.md`, and `.ai/STATE.md` before acting on anything here — they are the source of truth and already track several items below as known limitations.

---

## 0. Implementation Status

_Last updated 2026-07-02 (branch `dev`). Findings below are the original snapshot; resolved IDs are marked ✅ inline in §5. `.ai/STATE.md` is the live tracker — start there. Full history is in `git log` / `CHANGELOG.md`._

**Completed (all shipped with full `pnpm qa:ci` green — 1,118 unit + 37 integration + 7 E2E):**

- **P0 — Phase 1 hygiene sweep:** SEC-4 ✅ · PROD-1 ✅ · STAB-1 ✅ · DOC-1 ✅
- **§8 cleanups:** §8.1 dead deps — `react-router-dom`, `swr`, `javascript-obfuscator`, `web-vitals` ✅ (the `store` / `material-ui-popup-state` / `react-swipeable-views` audit is still open) · §8.2 dead code — App Store rating flow + `trackEvent`/`trackGenerateEvent` ✅ (Sentry-shim shrink still open) · §8.3 biome safe-autofix + repo-wide diagnostic ratchet (`qa:biome-ratchet`, baseline 0 errors / 826 warnings) ✅ · §8.10 stale docs deleted ✅
- **P1 — Security spine (part):** SEC-1 ✅ — implemented as a native **approval ledger** (`src/main/mcp/approval-ledger.ts`), which is stronger than the "resolve-by-id" minimal version below: the renderer can also write the settings blob, so a fingerprint-gated native confirmation is the real trust anchor while `webSecurity` is off. See `.ai/ARCHITECTURE_NOTES.md`.

**Open — recommended order:**

1. **SEC-2** (Electron upgrade) — next P1; **its own session** (touches the `app-builder-lib@26.8.1` patch + `electron-store@8`, needs `qa:release:mac`/`win` smoke).
2. **P2:** SEC-3 (provider proxy → `webSecurity:true`) · SEC-8 (prod CSP) · SEC-5 (node-fetch) · §6.3 tool-error unification · §9.1 a11y labels.
3. **Low / opportunistic:** SEC-7 · STAB-2 · STAB-3 · §6.4 `noFloatingPromises` burndown · §6.6 child-leak accounting · §8.2 Sentry-shim shrink · §8.1 remaining dep audit · §8.5 error-mapper rename · §8.6 `biome-ignore-all` narrowing · §8.9 dead `.erb/` scripts.
4. **P3 / with redesign:** InputBox split · MUI→Mantine · settings responsiveness · features F1/F2/F4.
5. **Product decision:** SEC-6 (mobile SQLite encryption) resolves for free if mobile is dropped.

---

## 1. Executive Summary

WorkspAIce is in solid shape for a 1.0.x-beta. The de-commercialization of the Chatbox fork is nearly complete and unusually disciplined: telemetry and Sentry are stubbed to no-ops, config is encrypted at rest via `safeStorage`, the preload bridge enforces an explicit IPC allowlist, skill/sandbox script execution is carefully path-validated, and the deterministic QA gate (typecheck + 1,099 unit + 37 integration + 7 E2E scenarios) is real and passing.

The three findings that matter most:

1. **The XSS → RCE chain is still open.** `webSecurity: false` (known, tracked) combined with the renderer-driven `mcp:stdio-transport:create` IPC handler means any script injection in the renderer can spawn an arbitrary process with arbitrary args/env. The CSP and allowlist shrink the injection surface but do not close this chain. Fixing it means either routing provider requests through the main process (re-enabling `webSecurity`) or constraining MCP spawn to main-process-persisted server configs — ideally both, in that order of effort/payoff.
2. **Electron 35 is past end-of-support.** Electron supports the latest three majors; 35 stopped receiving Chromium/V8 security patches when 38 shipped. For an app that renders LLM/tool/web-search-derived content with `webSecurity` off, running an unpatched Chromium is the single largest unowned risk. The upgrade interacts with the pinned `app-builder-lib@26.8.1` patch — see §7.
3. **One hosted-service remnant survived the purge:** `src/renderer/packages/edgeone.ts` (deploy-HTML-to-Tencent-EdgeOne) is still wired into `Markdown.tsx` and has its own success modal. This directly contradicts the local-first product rule in `.ai/AGENT_RULES.md` and should be removed.

Everything else is incremental: dead upstream code (App Store rating flow, no-op event tracking), four confirmed dead dependencies, a full-codebase lint debt of 120 errors that the changed-files-only `qa:biome` gate never burns down, oversized components (`InputBox.tsx` at 2,064 lines), and a set of cheap accessibility wins (icon-only buttons with no accessible names).

---

## 2. Current Project Understanding

- **What it is:** a local-first, GPLv3 desktop AI chat client for macOS/Windows, forked from Chatbox and being redesigned/de-commercialized. No hosted services, accounts, telemetry, or license flows are allowed; providers (OpenAI, Anthropic, Ollama, custom hosts, 27+) are user-configured.
- **Where it is:** version `1.0.2-beta` on branch `dev`. QA expansion is the active cycle; the chat-surface redesign (`MessageList.tsx`, `Message.tsx`, `InputBox.tsx`) has not started. Mobile (Capacitor) and web build paths still exist; their removal is an open product question in `.ai/STATE.md`.
- **How chat works:** single streaming loop per turn (`src/renderer/stores/session/orchestration.ts`) → `buildContext` → `buildToolsForSession` (MCP, web search, file, KB/session-attachment RAG, sandbox, skills) → `model.chatStream()` wrapping the `ai` SDK's `streamText()`, which internally handles multi-round tool-call exchange. Streaming state is persisted every 2s and finalized in `persistStreamingMessage`.
- **Skills:** two paths — model-driven (`load_skill`/`execute_skill_script` tools, effectively task-mode-only since regular chat doesn't pass `enabledSkillNames`) and deterministic `/slash` invocation that re-loads SKILL.md bodies each turn. Scripts execute in the main process with validated paths, scrubbed env, 30s timeout, 1MB output cap.
- **Sandbox:** `@anthropic-ai/sandbox-runtime` wraps shell commands (macOS Seatbelt / Linux / Windows-via-WSL2) with filesystem deny/allow lists; network is intentionally open.

---

## 3. Tech Stack Summary

| Layer | Tech |
|---|---|
| Shell | Electron **35.7.5** (⚠ past EOL), electron-vite 4, electron-builder 26.8.1 (**patched** — see `patches/`) |
| Renderer | React 18, TypeScript 5.8, TanStack Router (generated route tree) |
| UI | Mantine 7 (target) + MUI 5 (legacy, being migrated away) + Tailwind 3 + Emotion |
| State | Jotai + Zustand-style stores + TanStack Query (+ unused SWR) |
| AI | Vercel `ai` SDK v6 + `@ai-sdk/*` providers, `@mastra/*` (RAG/rerank only, exact-pinned), MCP SDK, `@anthropic-ai/sandbox-runtime` |
| Storage | electron-store (AES-256-CBC at rest, key in OS keychain via `safeStorage`), blob files, libsql vector DB |
| QA | Vitest 4 (unit/integration), Playwright `_electron` E2E, Biome 2 |
| Packaging | pnpm 10 workspace; `release/app` gets a **flat npm install** (`ensure-app-deps.cjs`) — npm ignores pnpm overrides, so version-coupled deps must be exact-pinned there |
| Mobile/web | Capacitor 7 (iOS/Android) + web build — fate undecided |

---

## 4. Strengths

- **Process security fundamentals are right:** `contextIsolation: true`, `nodeIntegration: false`, sandbox defaults pinned explicitly, preload exposes only a channel-allowlisted `invoke()` (`src/preload/index.ts` + `src/shared/ipc-channels.ts`, 107 channels), `setWindowOpenHandler` denies all in-page navigation, CSP blocks remote `<script>`/`<object>`/frames.
- **Secrets handling is thoughtful:** `store-node.ts` encrypts `config.json` with a keychain-protected random key, migrates plaintext configs non-destructively, and *purges legacy plaintext backups* that would otherwise leak API keys — a detail most apps miss.
- **Script-execution surfaces are defended in depth:** skills (`src/main/skills/ipc-handlers.ts`) validate names against strict patterns *and* realpath-prefix-check against the skills dir, scrub env, cap output; sandbox (`src/main/sandbox/manager.ts`) confines cwd, pipes untrusted file content via stdin instead of shell interpolation, kills process trees on timeout.
- **The QA contract is deterministic and honest:** no-skipped-tests gate, coverage floor, E2E against the real packaged Electron app; all green during this review.
- **Institutional memory works.** `.ai/ARCHITECTURE_NOTES.md` accurately documents genuinely non-obvious traps (the electron-builder pnpm-collector root cause, npm-vs-pnpm override coupling, `allowedDomains: ['*']` literal-match footgun). The previous `CODE_REVIEW.md`'s critical findings (plaintext keys, wildcard invoke proxy) were actually fixed, not just acknowledged.
- **De-commercialization is ~95% done** and done correctly: hosted services return errors or no-ops rather than being renamed into fake local services (`src/renderer/packages/remote.ts`).
- **Error handling at the orchestration boundary is complete:** abort vs. error paths both persist final message state; generation errors map to i18n-keyed user-facing codes.

---

## 5. Issues / Risks

Ordered by severity. "Known/tracked" = already in `.ai/` notes.

### 5.1 High

- ✅ **DONE (2026-07-02, approval-ledger approach — see §0)** — **[SEC-1] Renderer can spawn arbitrary processes via `mcp:stdio-transport:create`** (`src/main/mcp/ipc-stdio-transport.ts:36`). The handler accepts `command`, `args`, and `env` directly from the renderer and spawns it. Legitimate use is user-configured MCP servers, but combined with `webSecurity: false` this is the XSS→RCE escalation path: any injected script in the page has full network access *and* a process-spawning primitive. Mitigation options in §7.
- **[SEC-2] Electron 35.7.5 is past end-of-support** (`package.json:201`). No more Chromium security patches. Upgrade to a supported major. Interacts with: the `app-builder-lib@26.8.1` patch pin, `electron-store@8` (v9+ is ESM), and the CJS main process. Plan as its own task with `qa:release:*` smoke tests.
- **[SEC-3] `webSecurity: false`** (`src/main/main.ts:353`). Known/tracked; the inline comment and CSP are good interim work. The durable fix (route provider `fetch()` through the main process, then re-enable) unlocks removing `'unsafe-eval'` pressure and downgrades SEC-1 from "RCE chain" to "defense in depth".

### 5.2 Medium

- ✅ **DONE (2026-07-02)** — **[SEC-4] `openLink` IPC and `setWindowOpenHandler` pass URLs to `shell.openExternal` with no scheme check** (`src/main/main.ts:421`, `main.ts:707`). A compromised renderer (or a crafted link in rendered markdown) can open `file://`, `smb://`, or protocol handlers of other apps. One-line fix: allowlist `http:`, `https:`, `mailto:`.
- ✅ **DONE (2026-07-02)** — **[PROD-1] EdgeOne hosted deploy still shipped** (`src/renderer/packages/edgeone.ts`, `deployHtmlToEdgeOne` imported by `components/Markdown.tsx`, plus `modals/EdgeOneDeploySuccess.tsx`). Sends user HTML artifacts to `https://mcp.edgeone.site`. Violates the local-first non-negotiable. Remove the button, the package, and the modal.
- **[SEC-5] node-fetch@2.7.0 CVEs in packaged app** — known/tracked; root cause is eager `zeroentropy` loading via `@mastra/rag`. The long-term fix (lazy/scoped import) is described in `.ai/ARCHITECTURE_NOTES.md`.
- ✅ **DONE (2026-07-02)** — **[STAB-1] Window creation is gated on knowledge-base init** (`src/main/main.ts:548`: `await knowledgeBaseInitPromise` before `createWindow()`). A hung/slow libsql init (corrupt DB, locked file) means *no window ever appears* and no user-visible error. Show the window first; let KB init resolve behind it (the renderer already tolerates async RAG readiness — see `refreshSessionAttachmentStatuses`).
- **[SEC-6] Mobile SQLite `'no-encryption'`** — known/tracked, pending the mobile-support decision. If mobile is dropped (open product question), this disappears for free.

### 5.3 Low

- **[SEC-7] `editFile` sed escaping is incomplete** (`src/main/sandbox/manager.ts:289`): `escapeSedBRE` escapes BRE metacharacters but not `` ` `` or `"`, and the sed expression is wrapped in **double** quotes — a search/replace string containing a backtick triggers shell command substitution, and a `"` breaks the command. Not a privilege escalation (the same caller can run arbitrary `execCommand`), but it's a correctness bug and hygiene gap. Use single-quoted sed with proper escaping, or do the edit in Node and write via the existing stdin-pipe path.
- **[SEC-8] CSP includes `'unsafe-eval'` in production.** Vite production bundles don't need eval; the comment attributes it to HMR and "some UI libraries". Test a packaged build without it (watch mermaid/shiki/katex) and split the CSP into dev vs. prod variants.
- **[STAB-2] `setStoreValue`/`ensureProxy`/`ensureShortcutConfig` `JSON.parse` renderer input unguarded** (`src/main/main.ts:642+`) — malformed input throws back through IPC as an opaque error. Wrap and return a typed error.
- **[STAB-3] `getDeviceName` uses `execSync`** (`src/main/main.ts:687`) — blocks the main process; use the async form or cache once at startup.
- ✅ **DONE (2026-07-02)** — **[DOC-1] Stale root docs contradict reality:** `CODE_REVIEW.md` (2026-06-23) still lists "API keys stored in plaintext" and "wildcard invoke proxy" as open criticals — both fixed. `ERROR_HANDLING.md` describes an active Sentry integration — Sentry is now a no-op stub. Stale security docs are actively harmful to future agents; update or delete both.

---

## 6. Stability Improvements

1. **Un-gate window creation from KB init** ([STAB-1]) — biggest startup-robustness win, small diff in `main.ts`.
2. **Add typed guards around IPC `JSON.parse` boundaries** ([STAB-2]) and consider zod-validating high-value channel payloads (`skills:*`, `mcp:stdio-transport:create`, `sandbox:*`) in the main process — the preload allowlist controls *which* channels are callable, not *what* is sent.
3. **Unify the tool-error shape.** Known gap (`.ai/ARCHITECTURE_NOTES.md`): MCP returns caught errors as values, skills return `{success, stderr, exitCode}`, web/file tools throw or return error objects. A single `{ok, value|error}` envelope in `tools-builder.ts` wrappers would simplify `stream-chunk-processor.ts` and make model-visible errors consistent.
4. **Burn down the 53 `noFloatingPromises` diagnostics** — these are the classic source of "nothing happened and nothing logged" bugs. Prioritize `src/renderer/stores/` and main-process files.
5. **Raise coverage on the named high-risk targets** from `.ai/STATE.md`: `src/main/store-node.ts` (backup/restore/encryption edge cases are exactly where data loss lives), KB/session-attachment RAG main paths, `InputBox.tsx`, `MessageList.tsx`, session CRUD.
6. **Watchdog for `skills:execute-script` and sandbox child leaks:** the skills timeout resolves the promise but the killed child's streams are abandoned; add `child.kill` → `close`-event accounting (minor, but easy).

---

## 7. Security Hardening Suggestions

In dependency order — each step makes the next cheaper:

1. **Scheme-allowlist `shell.openExternal`** ([SEC-4]). One shared `openExternalSafe(url)` helper in `main.ts` used by both call sites. ~20 lines, do first.
2. **Constrain MCP stdio spawn** ([SEC-1]). Minimal version: persist MCP server configs in the main-process store and change `mcp:stdio-transport:create` to accept a server *id*, resolving command/args/env main-side; the renderer settings UI already writes configs through `setSettings`, so the data is available. This closes renderer-supplied arbitrary spawn even while `webSecurity` is off. (The deep-link install flow already requires user confirmation via modal — good; keep that.)
3. **Route provider HTTP through the main process, re-enable `webSecurity`** ([SEC-3]). Largest item: add a main-process fetch/stream proxy IPC (streaming via `webContents.send` chunks or a `MessagePort`), point the model adapters' `fetch` implementation at it (the `ai` SDK accepts a custom `fetch`), then flip `webSecurity: true`. Also lets `connect-src` tighten.
4. **Electron upgrade to a supported major** ([SEC-2]). Re-verify: the `app-builder-lib` patch (pinned to 26.8.1 — check whether newer electron-builder fixed the pnpm collector, which would let you drop the patch), `electron-store@8` compatibility, `safeStorage` behavior, and run `qa:release:mac` + `qa:release:win`.
5. **Drop `'unsafe-eval'` from the packaged-build CSP** ([SEC-8]); keep it dev-only.
6. **Skill-install trust UX:** before enabling a GitHub/marketplace-installed skill that has a `scripts/` dir, show the script list (and ideally contents) in the confirmation UI; consider executing skill scripts through the sandbox runtime when available instead of raw `spawn`.
7. **Fix the sed escaping** ([SEC-7]) or replace `editFile` with read→replace→write via the existing stdin path.
8. **node-fetch CVE**: implement the tracked fix (scope the `@mastra/rag` import so `zeroentropy` isn't eagerly loaded at main startup), then drop `node-fetch` from `release/app`.

---

## 8. Code Quality Improvements

1. **Dead dependencies (verified unused in `src/`):** `react-router-dom` (TanStack Router is the router), `swr` (TanStack Query is the fetcher), `javascript-obfuscator` (no references anywhere, and obfuscation contradicts GPLv3 anyway), `web-vitals` (only the CRA-era `reportWebVitals.ts` stub). Remove from `package.json`; also audit `store`, `material-ui-popup-state`, `react-swipeable-views` (deprecated upstream) while there.
2. **Dead upstream code paths:** `packages/apple_app_store.ts` + `modals/AppStoreRating.tsx` — `tickAfterMessageGenerated()` is still called from `orchestration.ts:318` and can show an App Store rating modal in a non-App-Store GPLv3 fork; remove. `trackGenerateEvent` (`stores/session/utils.ts:24`) computes provider identifiers to feed a no-op `trackingEvent` — delete both. The Sentry shim/adapters can shrink to a single no-op module.
3. **Full-codebase lint debt: 120 errors / 840 warnings** (`biome check`). The CI gate (`qa:biome`) only checks *changed* files, so this never shrinks. Top rules: 244 `useAwait`, 111 `noNonNullAssertion`, 87 unused params, 83 `noExplicitAny`, 78 unorganized imports, 53 `noFloatingPromises`, 48 unused imports. Suggested mechanism: run `biome check --write` once for the safe autofixes (imports, `useConst`, templates), then add a ratchet (fail CI if total diagnostics increase) instead of a big-bang cleanup.
4. **Oversized components** (known/tracked): `InputBox.tsx` 2,064 lines, `$providerId.tsx` 1,236, `KnowledgeBaseDocuments.tsx` 1,030, `Message.tsx` 932, `SessionSettings.tsx` 899. Don't refactor opportunistically — `.ai/` rules say localized changes only — but when the chat-surface redesign starts, split `InputBox` by concern (attachments, slash-skills, model selector, send pipeline) with tests first.
5. **`WorkspAIceAIAPIError` rename** to a neutral local error mapper (`src/shared/models/errors.ts`) — already an open item in `.ai/STATE.md`; mechanical.
6. **Narrow the 4 `biome-ignore-all` files** (known/tracked) and give `Mermaid.tsx`'s `noDangerouslySetInnerHtml` suppression a real justification comment (`<explanation>` placeholder is still there).
7. **UI-stack consolidation (MUI→Mantine)** is already the standing direction; the practical next step is an inventory: `grep -rl "@mui/" src/renderer | wc -l` and migrate leaf components opportunistically during the chat redesign rather than as a standalone rewrite.
8. **Comment-language consistency:** main-process files mix Chinese and English comments. Fine functionally; translate opportunistically when touching a file (don't do a bulk pass — it pollutes blame).
9. **`.erb/` directory** still carries webpack-era scripts of which only a few (`ensure-app-deps.cjs`, `clean.js`, `notarize.js`, `patch-libsql.cjs`, `postinstall.cjs`) are referenced by `package.json`. Delete the dead ones (`check-port-in-use.js`, `link-modules.*`, duplicate `.js`/`.cjs` pairs) after grepping for references.
10. **Delete or refresh stale root docs** ([DOC-1]): `CODE_REVIEW.md`, `ERROR_HANDLING.md`.

---

## 9. UI/UX Improvements

Observed on the running app (dev-web mode, light inspection) plus code reading:

1. **Icon-only buttons lack accessible names.** In the a11y tree, the sidebar collapse, settings-gear, and all four composer action buttons expose no name (`button` with no label). Add `aria-label` + Mantine `Tooltip` — helps screen readers *and* discoverability of the composer's icon row. (Sidebar's "New Workspace"/"Search"/"Clear Conversation List" are correctly labeled, so the pattern exists.)
2. **Settings three-pane layout overflows horizontally** below ~700px width; the provider detail pane is clipped and requires horizontal scrolling. Collapse to two panes (or stacked navigation) under a breakpoint.
3. **Composer icon row is opaque to new users** — four unlabeled icons + a "0" counter (token estimate?) with no explanation. Tooltips (see #1) plus a first-use hint would fix this cheaply.
4. **Empty state could do more work.** "What can I help you with today?" is fine, but with no provider configured the first-run experience should point at provider setup (see feature F1). Currently a new user can type a message and only then discover nothing is configured.
5. **The persistent "AI-generated content may be inaccurate" disclaimer** costs a line of vertical space in every session forever. Consider showing it only for the first N sessions or moving it into the message-context area.
6. **Chat surface redesign** (`MessageList.tsx`, `Message.tsx`, `InputBox.tsx`) is already the tracked next design phase; the token order in `.ai/PROJECT.md` (tokens → shell → chat) has been followed, so this is unblocked.
7. **Provider settings model list**: capability icons (vision/tools/context) are dense hieroglyphics; a legend tooltip or column headers would help.
8. **Keyboard affordances**: `@mantine/spotlight` is already used for provider search — extend to a global ⌘K palette (see feature F2).
9. **Jotai `atomFamily` deprecation warnings** fire 8× in the console on boot — migrate to `jotai-family` before jotai v3 removes it (this is also future-stability).

---

## 10. Suggested New Features

Ordered roughly by value-to-effort. All are local-first-compatible (no hosted services).

| # | Feature | Notes |
|---|---|---|
| F1 | **First-run onboarding wizard** | Detect no configured provider → guided flow: pick provider → paste key / detect local → test call → first chat. Reuses existing provider settings forms. |
| F2 | **Global command palette (⌘K)** | `@mantine/spotlight` already a dep. Actions: switch/search sessions, new chat, change model, open settings pages, toggle theme. |
| F3 | **Local provider auto-discovery** | Probe `localhost:11434` (Ollama) / `1234` (LM Studio) / LlamaCpp defaults on the provider screen; one-click add. Pure local networking. |
| F4 | **Full-text search across all chats** | Sidebar search appears session-scoped; index message text in the existing libsql DB (FTS5) for cross-session search with hit highlighting. |
| F5 | **Local usage & cost dashboard** | `tokensUsed`/`usage` are already persisted per message. Aggregate per provider/model/day with user-editable price tables. No network. |
| F6 | **Side-by-side model comparison** | Send one prompt to 2–3 configured models in split panes. High demo value; orchestration already supports per-session model settings. |
| F7 | **Quick-capture window** | Global-shortcut mini composer from the tray (shortcut plumbing exists in `main.ts`); submits into a designated session. |
| F8 | **Prompt/template library with variables** | `{{variable}}` prompts, insertable from composer or ⌘K; complements the skills system for lighter-weight reuse. |
| F9 | **Knowledge-base folder watch** | Watch user-chosen directories and auto-(re)index changed files into the KB (chokidar in main process). Makes RAG maintenance-free. |
| F10 | **Full local backup/restore UI** | The 10-min config backup exists but is invisible. Settings page: list backups, restore point-in-time, export/import everything (sessions + settings + KB) as one archive. |
| F11 | **Per-workspace defaults** | Workspaces exist in the sidebar; give each a default model, system prompt, and enabled toolset. |
| F12 | **Skill testing panel** | The in-app skill editor exists; add a "dry run" that shows exactly what the model would receive (rendered SKILL.md + available scripts) and lets the user execute a script with args in isolation. |
| F13 | **Chat archive bulk export** | `export.ts` handles single sessions; add multi-select export (Markdown/JSON) wired into the existing bulk-selection actions from commit `6eaebc7e`. |
| F14 | **Theme accent customization** | Design tokens are centralized in `globals.css` + Mantine theme; expose accent-color and radius pickers in General Settings. |
| F15 | **Message pinning / bookmarks** | Pin important answers; a "pinned" filter per session and globally. Storage is a message flag + index. |

---

## 11. Recommended Fix Priority

| Priority | Items | Rationale |
|---|---|---|
| ✅ **P0 — DONE** | SEC-4 (openExternal allowlist) · PROD-1 (remove EdgeOne) · STAB-1 (un-gate window from KB init) · DOC-1 (stale docs) | Shipped 2026-07-02. |
| **P1 — this cycle** | ✅ SEC-1 (MCP spawn constraint) · ✅ dead deps + dead upstream code (§8.1–8.2, partial — Sentry shim + 3-dep audit open) · ✅ biome ratchet (§8.3) · ⏳ **SEC-2 (Electron upgrade) — remaining, own session** | SEC-2 is the last P1; it interacts with the `app-builder-lib` patch and needs `qa:release:*` smoke. |
| **P2 — next cycle** | SEC-3 (main-process provider proxy → `webSecurity: true`) · SEC-8 (prod CSP) · SEC-5 (node-fetch) · tool-error unification (§6.3) · a11y labels (§9.1) | Proxy work is the largest single engineering item; schedule deliberately. |
| **P3 — with redesign** | InputBox split · MUI→Mantine · settings responsiveness · features F1/F2/F4 | Ride along with the already-planned chat-surface redesign. |

---

## 12. Suggested Implementation Phases

**Phase 1 — Hygiene sweep (1–2 sessions).** P0 items + dead dependency/code removal + `biome check --write` safe autofixes + ratchet script in `scripts/qa/`. Everything verifiable with existing `pnpm qa:ci`. Update `CODE_REVIEW.md`/`ERROR_HANDLING.md` or delete them.

**Phase 2 — Security spine (2–4 sessions).** MCP spawn-by-id refactor (main-side config resolution, keep renderer UI unchanged), then the Electron major upgrade with `qa:release:mac`/`qa:release:win` smoke and a re-verification of `patches/app-builder-lib@26.8.1.patch` (drop it if upstream fixed the pnpm collector). Record any new packaging gotchas in `.ai/ARCHITECTURE_NOTES.md`.

**Phase 3 — Provider proxy (3–6 sessions).** Main-process streaming fetch proxy (IPC or MessagePort), custom `fetch` injection into the `ai`-SDK adapters (`src/renderer/adapters/`, `src/shared/models/`), per-provider regression via `pnpm test:model-provider`, then flip `webSecurity: true`, tighten CSP, remove the big SECURITY comment in `main.ts`, and delete the corresponding Known Risk entries in `.ai/`.

**Phase 4 — Chat redesign + quick features (ongoing).** The tracked `MessageList`/`Message`/`InputBox` redesign, folding in a11y labels, MUI→Mantine leaf migrations, and F1 (onboarding) + F2 (palette) which touch the same surfaces.

Each phase is independently shippable; don't start Phase 3 mid-Phase-2.

---

## 13. Notes for Future Coding Agents

- **Read `.ai/` first, always.** `AGENT_RULES.md` (workflow + end-of-task checklist), `PROJECT.md` (facts), `ARCHITECTURE_NOTES.md` (traps — the packaging section will save you hours), `STATE.md` (in-flight work). This review intentionally did **not** modify `.ai/` (read-only engagement); when you pick up an item from here, add it to `STATE.md` "In Flight / Next Up" yourself.
- **Non-negotiables:** work on `dev`; never push unless explicitly asked; no hosted services/telemetry/accounts; scoped commits; `pnpm check` + `qa:*` before claiming done.
- **Node/pnpm:** prefix commands with `PATH="/opt/homebrew/opt/node@22/bin:$PATH"` if the shell Node is outside `>=22.12.0 <25`.
- **Packaging is the minefield.** `release/app` is a *flat npm install* that ignores pnpm overrides — version-coupled deps must be exact-pinned in `release/app/package.json`. The `app-builder-lib@26.8.1` patch is load-bearing; any electron-builder change requires re-verification. `--mac --arm64` alone does not constrain arch — also pass `-c.mac.target.arch=arm64`.
- **New IPC handlers must be added to `INVOKABLE_IPC_CHANNELS`** in `src/shared/ipc-channels.ts` or the preload bridge blocks them.
- **Never delete `{userData}/.config-key`** in a user's profile — the encrypted config becomes unreadable and regenerates empty.
- **For isolated manual testing:** set `WORKSPAICE_E2E_USER_DATA_DIR` to a temp dir before `pnpm dev:web` (it launches real Electron against real userData otherwise). The renderer is then also reachable at `http://localhost:1212` for browser-based inspection.
- **Verification baseline as of this review:** typecheck clean, 1,099 unit tests green, full-repo biome has 120 pre-existing errors (the CI gate only checks changed files — don't be surprised, and don't "fix" unrelated files into your diff).
- **Cross-references:** the severity items here use stable IDs (SEC-n / STAB-n / PROD-n / DOC-n); reference them in commits and `STATE.md` entries so later agents can map work back to this document.
