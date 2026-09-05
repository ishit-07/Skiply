import { describe, expect, it } from 'vitest';
import { isValidTimestampRecord, matchTimestamp, type TimestampRecord } from './timestamps';

const record: TimestampRecord = {
  id: 'netflix:series-1:1:2:intro',
  platform: 'Netflix',
  showId: 'series-1',
  showTitle: 'Example Show',
  season: 1,
  episode: 2,
  type: 'intro',
  start: 0,
  end: 84,
  confidence: 1,
  createdAt: 1,
  updatedAt: 1
};

describe('timestamp safety and matching', () => {
  it('validates bounds and duration before use', () => {
    expect(isValidTimestampRecord(record, { duration: 100 })).toBe(true);
    expect(isValidTimestampRecord({ ...record, end: 101 }, { duration: 100 })).toBe(false);
    expect(isValidTimestampRecord({ ...record, start: 84 }, { duration: 100 })).toBe(false);
  });

  it('requires episode-specific metadata instead of title-only matching', () => {
    expect(
      matchTimestamp(record, {
        platform: 'netflix',
        seriesId: 'series-1',
        season: 1,
        episode: 2
      })?.score
    ).toBeGreaterThan(0.8);
    expect(matchTimestamp(record, { platform: 'Netflix', showTitle: 'Example Show' })).toBeNull();
    expect(
      matchTimestamp(record, { platform: 'Netflix', seriesId: 'series-1', season: 1, episode: 3 })
    ).toBeNull();
  });
});
