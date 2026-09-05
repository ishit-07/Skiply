import { ActiveVideoDetector } from '../../content/active-video-detector';
import {
  GenericSkipControlDetector,
  type CandidateControl
} from '../../content/generic-skip-control-detector';
import type { EpisodeMetadata } from '../../shared/timestamps';
import type { OTTAdapter } from '../adapter';

const NETFLIX_HOST = /(^|\.)netflix\.com$/i;

const getAttribute = (selectors: string[], attribute: string): string | undefined => {
  for (const selector of selectors) {
    const value = document.querySelector<HTMLElement>(selector)?.getAttribute(attribute)?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
};

const getText = (selectors: string[]): string | undefined => {
  for (const selector of selectors) {
    const value = document.querySelector<HTMLElement>(selector)?.textContent?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
};

const parseEpisodeNumber = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }
  const match = value.match(/\b(?:episode|ep)\s*(\d+)\b/i) ?? value.match(/^(\d+)$/);
  return match ? Number(match[1]) : undefined;
};

export class NetflixAdapter implements OTTAdapter {
  public readonly id = 'netflix';
  private readonly videoDetector = new ActiveVideoDetector();
  private readonly controlDetector = new GenericSkipControlDetector();

  public matches(url: URL): boolean {
    return NETFLIX_HOST.test(url.hostname);
  }

  public getActiveVideo(): HTMLVideoElement | null {
    return this.videoDetector.detect()?.video ?? null;
  }

  public findSkipControls(): CandidateControl[] {
    return this.controlDetector.findCandidates(document, this.getActiveVideo());
  }

  public getEpisodeMetadata(): EpisodeMetadata | null {
    const video = document.querySelector<HTMLVideoElement>('video');
    const seriesId =
      getAttribute(
        ['[data-uia="video-title"]', '[data-uia="episode-title"]', '[data-uia="player"]'],
        'data-videoid'
      ) ??
      getAttribute(['[data-uia="video-title"]', '[data-uia="episode-title"]'], 'data-seriesid');
    const showTitle =
      getText(['[data-uia="video-title"]', '[data-uia="episode-title"]']) ??
      document.querySelector('h1')?.textContent?.trim();
    const episodeTitle = getText(['[data-uia="episode-title"]', '[data-uia="episode-title-text"]']);
    const season = Number(getAttribute(['[data-uia="season"]'], 'data-season'));
    const episode =
      parseEpisodeNumber(getAttribute(['[data-uia="episode"]'], 'data-episode')) ??
      parseEpisodeNumber(episodeTitle);

    if (!seriesId && !showTitle && !episodeTitle && !video) {
      return null;
    }

    return {
      platform: 'netflix',
      seriesId,
      showTitle,
      season: Number.isInteger(season) && season >= 0 ? season : undefined,
      episode,
      episodeTitle,
      url: window.location.href
    };
  }

  public async seekTo(seconds: number): Promise<boolean> {
    const video = this.getActiveVideo();
    if (
      !video ||
      !Number.isFinite(seconds) ||
      seconds < 0 ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0 ||
      seconds > video.duration
    ) {
      return false;
    }

    const previous = video.currentTime;
    video.currentTime = seconds;
    return video.currentTime !== previous || seconds === previous;
  }
}
