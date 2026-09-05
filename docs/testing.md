# Testing

The project includes Vitest and Playwright support to prepare the extension for unit and browser-level validation.

Milestone 2 covers active-video selection with jsdom tests for hidden, offscreen, zero-sized, multiple, and playing-video cases. Lifecycle tests cover delayed video insertion and cleanup after stopping the manager.

Milestone 3 covers normalized phrases, localized configuration, ARIA-labelled controls, data attributes, unsafe phrase exclusions, hidden and disabled controls, confidence ranking, delayed control insertion, debouncing, and observer cleanup.

Milestone 4 covers high-confidence click execution, missing active-video safety, low-confidence rejection, stale/hidden/disabled controls, credits being disabled by default, and duplicate-click prevention.

Milestone 5 covers timestamp bounds, duration validation, metadata matching, rejection of title-only matches, storage defaults and replacement, and manual start/end marking.

Milestone 6 covers adapter fallback for unknown URLs, matching-adapter priority, generic metadata extraction, and safe seek bounds.

Milestone 7 covers Netflix hostname matching, lookalike-domain rejection, exposed metadata extraction, and default registry registration.

Milestone 8 retains the full prior suite while validating the production build for popup/options runtime-command wiring, local statistics, and data management surfaces.

Milestone 9 adds `src/testing/compatibility-harness.ts`, a local DOM harness covering visible text, ARIA labels, role buttons, data attributes, advertisement controls, and next-episode controls. The reliability suite also exercises dynamic insertion, observer cleanup, multiple-video selection, player replacement, stale controls, and conservative failure behavior through the existing lifecycle/controller tests.

The harness is intentionally local and deterministic. It does not access streaming services, bypass DRM, or depend on remote fixtures.
