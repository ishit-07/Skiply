import { DEFAULT_SETTINGS, SETTINGS_KEY, type ExtensionSettings } from '../shared/settings';
import type { TimestampRecord } from '../shared/timestamps';

export const STORAGE_SCHEMA_VERSION = 1;
export const TIMESTAMPS_KEY = 'universal-skip-intro-timestamps';

interface StoredTimestampState {
  version: number;
  records: TimestampRecord[];
}

const getLocal = <T>(key: string): Promise<Record<string, T>> =>
  new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(result as Record<string, T>);
    });
  });

const setLocal = (items: Record<string, unknown>): Promise<void> =>
  new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });

export class StorageService {
  public async getSettings(): Promise<ExtensionSettings> {
    const result = await getLocal<Partial<ExtensionSettings>>(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] ?? {}) };
  }

  public async updateSettings(update: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const settings = { ...(await this.getSettings()), ...update };
    await setLocal({ [SETTINGS_KEY]: settings });
    return settings;
  }

  public async getTimestampState(): Promise<StoredTimestampState> {
    const result = await getLocal<StoredTimestampState>(TIMESTAMPS_KEY);
    const stored = result[TIMESTAMPS_KEY];
    if (!stored || stored.version !== STORAGE_SCHEMA_VERSION || !Array.isArray(stored.records)) {
      return { version: STORAGE_SCHEMA_VERSION, records: [] };
    }
    return stored;
  }

  public async saveTimestamp(record: TimestampRecord): Promise<void> {
    const state = await this.getTimestampState();
    const index = state.records.findIndex(({ id }) => id === record.id);
    if (index === -1) {
      state.records.push(record);
    } else {
      state.records[index] = record;
    }
    await setLocal({ [TIMESTAMPS_KEY]: state });
  }

  public async deleteTimestamp(id: string): Promise<void> {
    const state = await this.getTimestampState();
    await setLocal({
      [TIMESTAMPS_KEY]: {
        ...state,
        records: state.records.filter((record) => record.id !== id)
      }
    });
  }

  public async clearTimestamps(): Promise<void> {
    await setLocal({
      [TIMESTAMPS_KEY]: { version: STORAGE_SCHEMA_VERSION, records: [] }
    });
  }
}
