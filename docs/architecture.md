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
- `content/generic-skip-control-detector.ts` for accessibility-first semantic control matching
- `content/skip-control-observer.ts` for debounced dynamic control discovery
- `content/skip-controller.ts` for final candidate validation and one-time click execution
- `storage/storage-service.ts` for versioned local persistence
- `storage/timestamp-repository.ts` for timestamp validation and metadata matching
- `content/manual-timestamp-session.ts` for local timestamp marking
- `shared/runtime-messages.ts` for typed popup/content commands
- `shared/statistics.ts` and `storage/statistics-service.ts` for local skip statistics
- `adapters/adapter.ts` for the platform adapter contract
- `adapters/adapter-registry.ts` for specific-adapter selection with generic fallback
- `adapters/generic/generic-adapter.ts` for unknown-site behavior

The active-video layer scores every currently connected HTML video using visibility, viewport intersection, rendered dimensions, playback state, and duration availability. Hidden, detached, zero-sized, or fully offscreen videos are rejected. The lifecycle manager owns one MutationObserver, attaches bounded media event listeners, debounces refreshes, and reports only active-video identity changes.

The generic control detector inspects visible text, ARIA labels, labelled-by references, titles, data attributes, and button semantics. It recognizes intro, recap, and credits phrases, supports configurable localized phrases, and rejects unsafe controls such as ads, trailers, previews, and next-episode actions. Confidence is evidence-based and candidate discovery is separate from skip execution.

The skip controller is the final action boundary. It requires an active video, high confidence, a connected visible enabled element, and an enabled skip type before clicking. Credits remain disabled by default, and a `WeakSet` prevents repeated clicks on the same DOM node during mutation rescans.

Milestone 5 adds local timestamp persistence without connecting it to automatic seeking yet. This keeps repository and storage concerns independent from detection and execution so future validation can safely apply timestamps only after matching episode metadata and video bounds.

Milestone 6 adds the adapter boundary. The registry checks optional platform adapters in registration order and always falls back to `GenericAdapter`, which uses the existing generic video/control detectors and conservative page metadata. No platform-specific adapter is added until generic behavior demonstrates a real compatibility gap.

Milestone 7 registers `NetflixAdapter` as the first optional enhancement. The adapter is deliberately thin: it narrows URL matching and metadata hints while reusing generic active-video, control, and seek safety logic.

Milestone 8 connects the popup to the content script through typed runtime commands. The popup can inspect page/player readiness and mark local timestamp start/end points. The background worker records only a local skip count, while the options page can clear settings, statistics, and timestamp records together.

Milestone 9 adds a local compatibility harness under `src/testing`. It exercises the generic detector and controller as independent units, keeping reliability scenarios reproducible without coupling production code to a specific streaming service.

The extension is designed to remain local-first and to avoid use of backend services or remote telemetry.
