# Platform adapters

The architecture is prepared for adapters such as Netflix, Prime Video, or JioHotstar without hardcoding platform logic into the generic detection engine.

Planned design:

- Generic detection remains the default fallback
- Platform adapters only enhance detection when needed
- A shared adapter contract ensures consistent behaviors
- Platform-specific code remains isolated and easy to test

This milestone establishes the extension structure needed to add future adapters safely.