// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { GenericAdapter } from './generic-adapter';

describe('GenericAdapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('extracts conservative metadata from generic page signals', () => {
    const heading = document.createElement('h1');
    heading.textContent = 'Example Show';
    const season = document.createElement('div');
    season.dataset.season = '2';
    const episode = document.createElement('div');
    episode.dataset.episode = '4';
    document.body.append(heading, season, episode);

    expect(new GenericAdapter().getEpisodeMetadata()).toMatchObject({
      platform: 'localhost',
      showTitle: 'Example Show',
      season: 2,
      episode: 4
    });
  });

  it('uses the active video and safely rejects invalid seeks', async () => {
    const video = document.createElement('video');
    Object.defineProperty(video, 'paused', { configurable: true, value: false });
    Object.defineProperty(video, 'ended', { configurable: true, value: false });
    Object.defineProperty(video, 'duration', { configurable: true, value: 100 });
    Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 0 });
    Object.defineProperty(video, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ top: 0, left: 0, right: 640, bottom: 360, width: 640, height: 360 })
    });
    document.body.append(video);
    const adapter = new GenericAdapter();

    expect(await adapter.seekTo(-1)).toBe(false);
    expect(await adapter.seekTo(101)).toBe(false);
    expect(await adapter.seekTo(42)).toBe(true);
    expect(video.currentTime).toBe(42);
  });
});
