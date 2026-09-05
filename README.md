# Skiply

Universal Skip Intro is a local-first Chrome extension designed to detect and skip repetitive video segments such as intros, recaps, and end credits without relying on a remote backend or invasive browser hooks.

## Overview

This repository is the initial milestone scaffold for the extension. It includes:

- Vite + React + TypeScript project setup
- Manifest V3 Chrome extension configuration
- popup UI for quick status and settings
- options page for configuration controls
- background service worker
- content script placeholder for access to page contexts
- Vitest, Playwright, ESLint, Prettier, and TypeScript tooling

## Milestone 1 status

This milestone intentionally focuses on bootstrap infrastructure and a safe, extension-ready build. It does not implement the full detection engine yet.

## Quick start

1. Install dependencies:
   `pnpm install`
2. Start the local Vite dev server:
   `pnpm dev`
3. Build the extension bundle:
   `pnpm build`
4. Run tests:
   `pnpm test`
5. Run linting:
   `pnpm lint`
6. Run type checking:
   `pnpm typecheck`

## Loading the extension in Chrome

1. Run `pnpm build`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the generated `dist` directory.
6. Open the extension popup to confirm the UI loads.

## Debug mode

The settings page includes a debug toggle. The initial milestone keeps logging intentionally concise and local to the browser environment.

## Future extension points

The app is organized so that detection logic, platform adapters, storage, and UI remain separate. The first milestone establishes the migration path for future milestones without prematurely integrating skip logic.

## Privacy model

This project is intentionally local-only. It stores settings in `chrome.storage.local` and does not require external services, analytics, databases, or account systems.

## Project structure

```text
src/
  background/
  content/
  options/
  popup/
  shared/
public/
  manifest.json
docs/
```
