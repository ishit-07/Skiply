# Architecture

This repository implements the initial milestone for a Chrome extension architecture intended for generic skip detection.

The extension intentionally separates concerns into major execution layers:

- `background` for the service worker lifecycle and storage coordination
- `content` for page-aware runtime detection hooks
- `popup` for the extension popup UI
- `options` for settings
- `shared` for common schema and configuration used by UI and worker contexts
- `content/active-video-detector.ts` for conservative active-player selection
- `content/video-lifecycle-manager.ts` for debounced DOM and media lifecycle updates

The active-video layer scores every currently connected HTML video using visibility, viewport intersection, rendered dimensions, playback state, and duration availability. Hidden, detached, zero-sized, or fully offscreen videos are rejected. The lifecycle manager owns one MutationObserver, attaches bounded media event listeners, debounces refreshes, and reports only active-video identity changes.

The extension is designed to remain local-first and to avoid use of backend services or remote telemetry.
