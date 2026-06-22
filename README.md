# WorkspAIce

WorkspAIce is a personal GPLv3 fork of the original Chatbox app: https://chatboxai.app/en.

The goal of this fork is to redesign and refactor the app into a local-first desktop AI workspace for macOS and Windows. This project is not affiliated with the original Chatbox project.

## Direction

- Local-first desktop app for macOS and Windows.
- No bundled hosted AI service.
- No license service, subscriptions, premium gates, or account requirement.
- No telemetry, analytics, or hosted remote configuration.
- Keep user-configured providers, including local providers and user-supplied external API providers.
- Preserve GPLv3 licensing for any future release.

## Provider Model

WorkspAIce is intended to connect only to providers configured by the user.

Relevant provider types include:

- Local providers such as Ollama and LM Studio-style endpoints.
- User-supplied OpenAI-compatible providers.
- User-configured external providers such as OpenAI, Anthropic, Gemini, OpenRouter, and similar APIs.

Any feature that depends on an upstream hosted service should be removed, disabled, or converted into a user-configured integration.

## Current Status

This repository is in early fork cleanup.

Completed initial cleanup:

- Rebranded the app toward WorkspAIce.
- Added `.ai/CONTEXT.md` as shared memory for AI agents.
- Added `.ai/AGENT_RULES.md` with mandatory agent workflow rules.
- Removed the bundled hosted provider registration.
- Removed hosted provider settings routes.
- Disabled hosted telemetry, hosted remote config, license reconciliation, and hosted update listeners from renderer startup.
- Replaced the renderer hosted remote API module with local-first stubs.

Known follow-up work:

- Finish removing leftover hosted-service concepts from UI copy and settings flows.
- Verify and fix TypeScript/build issues after installing the supported Node version and dependencies.
- Continue the visual redesign of the app shell and chat surface.
- Decide whether mobile/web build paths should be removed or only deprioritized.

## Development Requirements

Use the versions declared in `package.json`.

- Node.js: `>=22.12.0 <25.0.0`
- pnpm: `>=10.17.0`
- Git
- Xcode Command Line Tools on macOS for native dependency builds

Recommended on Apple Silicon macOS with Homebrew:

```bash
brew install node@22 pnpm git
xcode-select --install
```

## Setup

```bash
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
```

## Project Layout

```text
src/main/       Electron main process
src/preload/    Electron preload bridge
src/renderer/   React renderer app
src/shared/     Shared types, providers, model code, utilities
.ai/            AI-agent memory and workflow rules
```

## AI Agent Workflow

Agents working in this repository must read and follow:

- `.ai/CONTEXT.md`
- `.ai/AGENT_RULES.md`

Important rules:

- Always work on the `dev` branch.
- Update `.ai/CONTEXT.md` after code changes.
- Make reasonable scoped commits after code changes.
- Do not push unless explicitly asked.
- Ask when requirements are ambiguous.

## License

This fork is licensed under GPLv3, same as the upstream project.

See [LICENSE](./LICENSE).
