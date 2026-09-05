# Detection engine

This repository intentionally stops at the scaffold level for the detection engine.

The future detection engine is expected to use layered strategies:

1. existing skip controls already exposed by websites
2. generic DOM and semantic detection
3. platform-specific adapters where necessary
4. local timestamp lookup
5. future advanced content detectors

The current milestone establishes a safe extension shell that can host those strategies without forcing a single detection method into the runtime.

Milestone 3 adds the generic semantic control layer. Candidates are only collected from visible, enabled button-like controls and are ranked using phrase strength, accessibility source, visibility, enabled state, button semantics, and proximity to the active video. A configurable phrase dictionary supports localized equivalents while explicit exclusion phrases prevent common false positives. A single debounced observer handles controls added or changed after initial page load.

Candidate discovery does not click or seek. Automatic action and final safety validation belong to later milestones.

Milestone 4 connects candidates to a conservative action controller. Automatic clicks use a `0.90` confidence threshold, require an active video, and default to intro and recap only. Stale, hidden, disabled, unsupported, low-confidence, and duplicate candidates are rejected without action. The controller does not seek, monkey-patch media APIs, or bypass site security boundaries.
