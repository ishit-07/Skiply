# Architecture

This repository implements the initial milestone for a Chrome extension architecture intended for generic skip detection.

The extension intentionally separates concerns into major execution layers:

- `background` for the service worker lifecycle and storage coordination
- `content` for page-aware runtime detection hooks
- `popup` for the extension popup UI
- `options` for settings
- `shared` for common schema and configuration used by UI and worker contexts

The extension is designed to remain local-first and to avoid use of backend services or remote telemetry.
