# Storage

The extension stores configuration and future timestamp metadata in `chrome.storage.local`.

This keeps all persisted state local to the browser and avoids remote systems, databases, or user accounts.

The schema stores settings and timestamp records under separate local keys. Timestamp records use an explicit schema version and are accessed through `StorageService`; the rest of the application does not call `chrome.storage.local` directly.

`LocalTimestampRepository` validates records, bounds them against known video duration when finding a match, and ranks matches using platform, series identifier, season, episode, show title, and episode title. Show-title-only matches are rejected for automatic use.

`ManualTimestampSession` provides the local "Mark Intro Start" and "Mark Intro End" flow. It requires a valid platform and an end time after the start, saves a typed record, and resets after a successful save.
