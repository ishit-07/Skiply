import { ActiveVideoDetector } from '../../content/active-video-detector';
import {
  GenericSkipControlDetector,
  type CandidateControl
} from '../../content/generic-skip-control-detector';
import type { EpisodeMetadata } from '../../shared/timestamps';
import type { OTTAdapter } from '../adapter';

const PRIME_HOST = /(^|\.)((primevideo|amazon)\.com)$/i;
const EPISODE_PATTERN = /(?:episode|ep)[=/-]?(\d+)/i;
const SEASON_PATTERN = /(?:season|s)[=/-]?(\d+)/i;

export class PrimeVideoAdapter implements OTTAdapter {
  public readonly id = 'prime-video';
  private readonly videoDetector = new ActiveVideoDetector();
  private readonly controlDetector = new GenericSkipControlDetector();

  public matches(url: URL): boolean {
    return PRIME_HOST.test(url.hostname) && (url.pathname.includes('/detail/') || url.pathname.includes('/watch'));
  }

  public getActiveVideo(): HTMLVideoElement | null {
    return this.videoDetector.detect()?.video ?? null;
  }

  public findSkipControls(activeVideo?: HTMLVideoElement | null): CandidateControl[] {
    return this.controlDetector.findCandidates(document, activeVideo === undefined ? this.getActiveVideo() : activeVideo);
  }

  public getEpisodeMetadata(): EpisodeMetadata | null {
    const url = new URL(window.location.href);
    const path = `${url.pathname} ${url.search}`;
    const seasonMatch = path.match(SEASON_PATTERN);
    const episodeMatch = path.match(EPISODE_PATTERN);
    const showTitle =
      document.querySelector('[data-testid="detail-page-title"]')?.textContent?.trim() ??
      document.querySelector('h1')?.textContent?.trim();

    if (!showTitle && !seasonMatch && !episodeMatch) {
      return null;
    }

    return {
      platform: 'prime-video',
      showTitle,
      season: seasonMatch ? Number(seasonMatch[1]) : undefined,
      episode: episodeMatch ? Number(episodeMatch[1]) : undefined,
      url: url.href
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
