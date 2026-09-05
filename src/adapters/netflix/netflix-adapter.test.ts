// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { NetflixAdapter } from './netflix-adapter';

describe('NetflixAdapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('matches Netflix hosts but not lookalike domains', () => {
    const adapter = new NetflixAdapter();

    expect(adapter.matches(new URL('https://www.netflix.com/watch/123'))).toBe(true);
    expect(adapter.matches(new URL('https://help.netflix.com/'))).toBe(true);
    expect(adapter.matches(new URL('https://netflix.com.example/'))).toBe(false);
  });

  it('extracts only metadata exposed through stable attributes or text', () => {
    const title = document.createElement('div');
    title.dataset.uia = 'video-title';
    title.setAttribute('data-videoid', 'series-42');
    title.textContent = 'Example Show';
    const episode = document.createElement('div');
    episode.dataset.uia = 'episode-title';
    episode.setAttribute('data-episode', 'Episode 3');
    episode.textContent = 'Episode 3';
    document.body.append(title, episode);

    expect(new NetflixAdapter().getEpisodeMetadata()).toMatchObject({
      platform: 'netflix',
      seriesId: 'series-42',
      showTitle: 'Example Show',
      episode: 3,
      episodeTitle: 'Episode 3'
    });
  });
});
