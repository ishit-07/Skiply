import { describe, expect, it, vi } from 'vitest';
import { ManualTimestampSession } from './manual-timestamp-session';
import type { TimestampRepository } from '../storage/timestamp-repository';

describe('ManualTimestampSession', () => {
  it('saves a timestamp after start and end are marked', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repository: TimestampRepository = {
      save,
      find: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn()
    };
    const session = new ManualTimestampSession(repository, () => 123);
    session.markStart(0);
    const record = await session.markEnd(84, {
      platform: 'local',
      seriesId: 'show-1',
      season: 1,
      episode: 2,
      showTitle: 'Example'
    });

    expect(record.end).toBe(84);
    expect(save).toHaveBeenCalledWith(record);
    expect(session.getStart()).toBeNull();
  });

  it('rejects invalid order and missing platform', async () => {
    const repository: TimestampRepository = {
      save: vi.fn(),
      find: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn()
    };
    const session = new ManualTimestampSession(repository);

    expect(() => session.markStart(-1)).toThrow();
    session.markStart(20);
    await expect(session.markEnd(20, {})).rejects.toThrow();
  });
});
