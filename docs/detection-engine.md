# Detection engine

This repository intentionally stops at the scaffold level for the detection engine.

The future detection engine is expected to use layered strategies:

1. existing skip controls already exposed by websites
2. generic DOM and semantic detection
3. platform-specific adapters where necessary
4. local timestamp lookup
5. future advanced content detectors

The current milestone establishes a safe extension shell that can host those strategies without forcing a single detection method into the runtime.
