import { ActiveVideoDetector } from '../../content/active-video-detector';
import {
  GenericSkipControlDetector,
  type CandidateControl
} from '../../content/generic-skip-control-detector';
import type { EpisodeMetadata } from '../../shared/timestamps';
import type { OTTAdapter } from '../adapter';

const getMetaContent = (selectors: string[]): string | undefined => {
  for (const selector of selectors) {
    const value = document.querySelector<HTMLMetaElement>(selector)?.content?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
};

const parsePositiveInteger = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

export class GenericAdapter implements OTTAdapter {
  public readonly id = 'generic';
  private readonly videoDetector = new ActiveVideoDetector();
  private readonly controlDetector = new GenericSkipControlDetector();

  public matches(): boolean {
    return true;
  }

  public getActiveVideo(): HTMLVideoElement | null {
    return this.videoDetector.detect()?.video ?? null;
  }

  public findSkipControls(): CandidateControl[] {
    return this.controlDetector.findCandidates(document, this.getActiveVideo());
  }

  public getEpisodeMetadata(): EpisodeMetadata | null {
    const url = window.location.href;
    const platform = window.location.hostname || undefined;
    const showTitle =
      getMetaContent(['meta[property="og:site_name"]', 'meta[name="application-name"]']) ??
      document.querySelector('h1')?.textContent?.trim();
    const season = parsePositiveInteger(
      getMetaContent(['meta[data-season]', 'meta[name="season"]']) ??
        document.querySelector('[data-season]')?.getAttribute('data-season') ??
        undefined
    );
    const episode = parsePositiveInteger(
      getMetaContent(['meta[data-episode]', 'meta[name="episode"]']) ??
        document.querySelector('[data-episode]')?.getAttribute('data-episode') ??
        undefined
    );

    if (!platform && !showTitle && season === undefined && episode === undefined) {
      return null;
    }

    return { platform, showTitle, season, episode, url };
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

    const before = video.currentTime;
    video.currentTime = seconds;
    return video.currentTime !== before || seconds === before;
  }
}
