import type { SkipType } from '../shared/settings';
import type { EpisodeMetadata, TimestampRecord } from '../shared/timestamps';
import { isValidTimestampRecord } from '../shared/timestamps';
import type { TimestampRepository } from '../storage/timestamp-repository';

export class ManualTimestampSession {
  private start: number | null = null;

  public constructor(
    private readonly repository: TimestampRepository,
    private readonly now: () => number = Date.now
  ) {}

  public markStart(currentTime: number): void {
    if (!Number.isFinite(currentTime) || currentTime < 0) {
      throw new Error('Invalid timestamp start');
    }
    this.start = currentTime;
  }

  public getStart(): number | null {
    return this.start;
  }

  public async markEnd(
    currentTime: number,
    metadata: EpisodeMetadata,
    type: Exclude<SkipType, 'credits'> = 'intro'
  ): Promise<TimestampRecord> {
    if (this.start === null || !Number.isFinite(currentTime) || currentTime <= this.start) {
      throw new Error('Timestamp end must be after a valid start');
    }
    if (!metadata.platform) {
      throw new Error('Platform is required for a timestamp');
    }

    const timestamp = this.start;
    const now = this.now();
    const record: TimestampRecord = {
      id: `${metadata.platform}:${metadata.seriesId ?? metadata.showTitle ?? 'unknown'}:${metadata.season ?? 'x'}:${metadata.episode ?? 'x'}:${type}`,
      platform: metadata.platform,
      showId: metadata.seriesId,
      showTitle: metadata.showTitle,
      season: metadata.season,
      episode: metadata.episode,
      episodeTitle: metadata.episodeTitle,
      type,
      start: timestamp,
      end: currentTime,
      confidence: 1,
      createdAt: now,
      updatedAt: now
    };

    if (!isValidTimestampRecord(record)) {
      throw new Error('Invalid timestamp record');
    }
    await this.repository.save(record);
    this.start = null;
    return record;
  }

  public reset(): void {
    this.start = null;
  }
}
