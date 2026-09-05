import { describe, expect, it, vi } from 'vitest';
import type { OTTAdapter } from './adapter';
import { AdapterRegistry, createDefaultAdapterRegistry } from './adapter-registry';
import { GenericAdapter } from './generic/generic-adapter';

const makeAdapter = (id: string, matches: boolean): OTTAdapter => ({
  id,
  matches: vi.fn(() => matches),
  getActiveVideo: vi.fn(() => null),
  findSkipControls: vi.fn(() => []),
  getEpisodeMetadata: vi.fn(() => null),
  seekTo: vi.fn(async () => false)
});

describe('AdapterRegistry', () => {
  it('falls back to the generic adapter for unknown platforms', () => {
    const registry = new AdapterRegistry([makeAdapter('known', false)]);
    const selection = registry.select(new URL('https://unknown.example/watch'));

    expect(selection.adapter.id).toBe('generic');
    expect(selection.matchedSpecificAdapter).toBe(false);
  });

  it('prefers a matching platform adapter', () => {
    const platform = makeAdapter('platform', true);
    const selection = new AdapterRegistry([platform], new GenericAdapter()).select(
      new URL('https://known.example/watch')
    );

    expect(selection.adapter).toBe(platform);
    expect(selection.matchedSpecificAdapter).toBe(true);
  });

  it('ships Netflix as the first optional platform adapter', () => {
    const selection = createDefaultAdapterRegistry().select(
      new URL('https://www.netflix.com/watch/123')
    );

    expect(selection.adapter.id).toBe('netflix');
    expect(selection.matchedSpecificAdapter).toBe(true);
  });

  it('selects Prime Video for supported detail URLs', () => {
    const selection = createDefaultAdapterRegistry().select(
      new URL('https://www.primevideo.com/detail/example')
    );

    expect(selection.adapter.id).toBe('prime-video');
  });
});
