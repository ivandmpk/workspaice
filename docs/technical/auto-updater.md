# Auto-Update System (Disabled)

> Last updated: 2026-06

The auto-update system has been removed in this local-first build. `electron-updater` is no longer a dependency, and all update-related IPC channels and UI components have been removed or stubbed.

## What was removed

- `src/main/app-updater.ts` — Main process update logic (deleted)
- `src/renderer/stores/updateStore.ts` — Renderer state management (deleted)
- `src/renderer/routes/about.tsx` — Update UI in About page (removed)
- `src/renderer/Sidebar.tsx` — Update banner (removed)
- `src/preload/index.ts` — IPC bridge for updater (removed)
- `electron-updater` dependency (removed from package.json)

## Rationale

This is a local-first, community edition build. Auto-update requires hosting infrastructure for update feeds and binary distribution, which is not part of this project.
