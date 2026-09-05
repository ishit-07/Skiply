import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SETTINGS_KEY } from '../shared/settings';
import { STORAGE_SCHEMA_VERSION, StorageService, TIMESTAMPS_KEY } from './storage-service';

const values = new Map<string, unknown>();

beforeEach(() => {
  values.clear();
  vi.stubGlobal('chrome', {
    runtime: { lastError: undefined },
    storage: {
      local: {
        get: (key: string, callback: (result: Record<string, unknown>) => void) =>
          callback({ [key]: values.get(key) }),
        set: (items: Record<string, unknown>, callback: () => void) => {
          Object.entries(items).forEach(([key, value]) => values.set(key, value));
          callback();
        }
      }
    }
  });
});

describe('StorageService', () => {
  it('merges settings with defaults and persists updates', async () => {
    const storage = new StorageService();
    const settings = await storage.updateSettings({ enabled: false });

    expect(settings.enabled).toBe(false);
    expect(values.get(SETTINGS_KEY)).toMatchObject({ enabled: false });
    expect((await storage.getSettings()).skipIntro).toBe(true);
  });

  it('uses a versioned timestamp state and replaces records by id', async () => {
    const storage = new StorageService();
    const first = {
      id: 'one',
      platform: 'test',
      type: 'intro' as const,
      start: 0,
      end: 10,
      confidence: 1,
      createdAt: 1,
      updatedAt: 1
    };
    await storage.saveTimestamp(first);
    await storage.saveTimestamp({ ...first, end: 12 });

    expect(values.get(TIMESTAMPS_KEY)).toEqual({
      version: STORAGE_SCHEMA_VERSION,
      records: [{ ...first, end: 12 }]
    });
  });
});
