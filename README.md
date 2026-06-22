<p align="center">
  <img src="assets/icons/256x256.png" alt="WorkspAIce" width="128" height="128" />
</p>

<h1 align="center">WorkspAIce</h1>

<p align="center">
  <strong>Your AI, your machine, your rules.</strong><br />
  A local-first desktop AI workspace — fast, private, multi-provider.<br />
  Forked with ❤️ from <a href="https://chatboxai.app/en">Chatbox</a>.
</p>

---

## 🙏 Credits

WorkspAIce is built on the shoulders of **[Chatbox](https://chatboxai.app/en)** — a sleek, open-source desktop AI client created by the Chatbox team.

We're deeply grateful to the Chatbox maintainers and contributors for building such a solid foundation. Their work made this project possible, and we encourage you to check out the original:

- 🌐 [chatboxai.app](https://chatboxai.app/en)
- 📦 [Chatbox on GitHub](https://github.com/Bin-Huang/chatbox)

Thank you, Chatbox team! 🫶

---

## 🧭 Direction

WorkspAIce is an independent project that takes Chatbox in a different direction:

- 💻 **Local-first** desktop app for macOS and Windows.
- 🔓 **No accounts, no subscriptions, no premium gates.** Just download and use.
- 🛡️ **No telemetry, no analytics, no hosted remote config.** Your conversations stay on your machine.
- 🧠 **No bundled hosted AI service.** You own your API keys and choose your providers.
- 📜 **GPLv3 licensed** — free and open source, today and tomorrow.

---

## 🔌 Provider Model

WorkspAIce connects only to providers that **you** configure. No built-in middleman.

- 🏠 **Local providers** — Ollama, LM Studio, and any OpenAI-compatible local endpoint.
- ☁️ **External APIs** — OpenAI, Anthropic, Gemini, OpenRouter, DeepSeek, SiliconFlow, and more.
- ⚙️ **You're in control** — every provider, model, and API key is yours to manage.

Any feature that once depended on an upstream hosted service has been removed, disabled, or converted into a user-configured integration.

---

## 🛠️ Development

### Current Status

This repository is in early fork cleanup. Completed so far:

- ✅ Rebranded from Chatbox to WorkspAIce (icons, naming, theme, palette).
- ✅ Removed hosted provider registration, telemetry, analytics, remote config, license reconciliation, and updater endpoints.
- ✅ Replaced hosted remote API with local-first stubs.
- ✅ Removed account/license/premium flows, onboarding guide, and copilot features.
- ✅ Repaired TypeScript/build after hosted-service removals.
- 🚧 Ongoing visual redesign of the app shell and chat surface.
- 🚧 TBD whether mobile/web build paths are removed or deprioritized.

### Requirements

Use the versions declared in `package.json`:

- **Node.js** `>=22.12.0 <25.0.0`
- **pnpm** `>=10.17.0`
- **Git**
- **Xcode Command Line Tools** (macOS, for native dependency builds)

Recommended on Apple Silicon macOS with Homebrew:

```bash
brew install node@22 pnpm git
xcode-select --install
```

### Setup

```bash
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm check    # Type-check
pnpm lint     # Lint
pnpm test     # Run tests
pnpm build    # Production build
```

### Project Layout

```text
src/main/       Electron main process
src/preload/    Electron preload bridge
src/renderer/   React renderer app
src/shared/     Shared types, providers, model code, utilities
.ai/            AI-agent memory and workflow rules
```

---

## 📄 License

This fork is licensed under **GPLv3**, same as the upstream Chatbox project.

See [LICENSE](./LICENSE).
