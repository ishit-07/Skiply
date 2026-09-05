// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { PrimeVideoAdapter } from './prime-video-adapter';

describe('PrimeVideoAdapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('matches Prime Video detail and watch URLs only', () => {
    const adapter = new PrimeVideoAdapter();

    expect(adapter.matches(new URL('https://www.primevideo.com/detail/example'))).toBe(true);
    expect(adapter.matches(new URL('https://www.amazon.com/gp/video/detail/example'))).toBe(true);
    expect(adapter.matches(new URL('https://example.com/watch/season-2-episode-3'))).toBe(false);
  });

  it('extracts season and episode from exposed URL structure', () => {
    const title = document.createElement('h1');
    title.textContent = 'Example Show';
    document.body.append(title);
    window.history.replaceState({}, '', '/detail/example?season=2&episode=3');

    expect(new PrimeVideoAdapter().getEpisodeMetadata()).toMatchObject({
      platform: 'prime-video',
      showTitle: 'Example Show',
      season: 2,
      episode: 3
    });
  });
});
