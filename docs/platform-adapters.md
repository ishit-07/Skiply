# Platform adapters

The architecture is prepared for adapters such as Netflix, Prime Video, or JioHotstar without hardcoding platform logic into the generic detection engine.

Planned design:

- Generic detection remains the default fallback
- Platform adapters only enhance detection when needed
- A shared adapter contract ensures consistent behaviors
- Platform-specific code remains isolated and easy to test

This milestone establishes the extension structure needed to add future adapters safely.

Milestone 6 implements the `OTTAdapter` contract and `AdapterRegistry`. An adapter can match a URL, expose the active video, find semantic skip controls, extract episode metadata, and perform a validated seek. Unknown sites use `GenericAdapter`; it never claims platform support and only uses information exposed by the page.

To add an adapter, implement the contract in a new directory, register it with `AdapterRegistry`, and keep platform-specific selectors and metadata parsing inside that adapter. The generic fallback should remain available even when a specific adapter matches.

Milestone 7 adds the first optional adapter for Netflix. It only matches `*.netflix.com`, uses the shared active-video and semantic-control detectors, and reads metadata from exposed attributes/text when available. It does not assume private player internals or bypass inaccessible, cross-origin, DRM, or closed-shadow-DOM boundaries. Generic detection remains the fallback and is still used for unknown sites.