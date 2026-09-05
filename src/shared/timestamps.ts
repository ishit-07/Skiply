import type { SkipType } from './settings';

export interface EpisodeMetadata {
  platform?: string;
  seriesId?: string;
  showTitle?: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  url?: string;
}

export interface TimestampRecord {
  id: string;
  platform: string;
  showId?: string;
  showTitle?: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  type: SkipType;
  start: number;
  end: number;
  confidence: number;
  createdAt: number;
  updatedAt: number;
}

export interface TimestampMatch {
  record: TimestampRecord;
  score: number;
}

export interface TimestampValidationContext {
  duration: number;
  currentTime?: number;
}

const INTRO_TYPES: ReadonlySet<SkipType> = new Set(['intro', 'recap']);

export const isValidTimestampRecord = (
  record: TimestampRecord,
  context?: TimestampValidationContext
): boolean => {
  if (
    !record.id ||
    !record.platform ||
    !INTRO_TYPES.has(record.type) ||
    !Number.isFinite(record.start) ||
    !Number.isFinite(record.end) ||
    record.start < 0 ||
    record.end <= record.start ||
    !Number.isFinite(record.confidence) ||
    record.confidence < 0 ||
    record.confidence > 1
  ) {
    return false;
  }

  if (context) {
    if (!Number.isFinite(context.duration) || context.duration <= 0 || record.end > context.duration) {
      return false;
    }
    if (
      context.currentTime !== undefined &&
      (!Number.isFinite(context.currentTime) || context.currentTime < 0 || context.currentTime > record.end)
    ) {
      return false;
    }
  }

  return true;
};

const normalized = (value: string | undefined): string =>
  value?.normalize('NFKC').toLocaleLowerCase().trim() ?? '';

const matchingField = (left: string | number | undefined, right: string | number | undefined): boolean =>
  left !== undefined && right !== undefined && normalized(String(left)) === normalized(String(right));

export const matchTimestamp = (
  record: TimestampRecord,
  metadata: EpisodeMetadata
): TimestampMatch | null => {
  if (!metadata.platform || normalized(record.platform) !== normalized(metadata.platform)) {
    return null;
  }

  let score = 0.35;
  let specificSignal = false;

  if (metadata.seriesId && matchingField(record.showId, metadata.seriesId)) {
    score += 0.35;
    specificSignal = true;
  } else if (metadata.seriesId && record.showId) {
    return null;
  }

  if (metadata.season !== undefined && metadata.episode !== undefined) {
    if (record.season !== metadata.season || record.episode !== metadata.episode) {
      return null;
    }
    score += 0.25;
    specificSignal = true;
  } else if (record.season !== undefined || record.episode !== undefined) {
    return null;
  }

  if (metadata.showTitle && matchingField(record.showTitle, metadata.showTitle)) {
    score += 0.08;
    specificSignal = true;
  }

  if (metadata.episodeTitle && matchingField(record.episodeTitle, metadata.episodeTitle)) {
    score += 0.05;
  }

  return specificSignal ? { record, score: Math.min(1, score) } : null;
};
