# Storage

The extension stores configuration and future timestamp metadata in `chrome.storage.local`.

This keeps all persisted state local to the browser and avoids remote systems, databases, or user accounts.

The initial schema currently stores the main extension settings object under a versioned local key. This is intentionally structured so future timestamp records and migration logic can be added without rewriting the app surface.
