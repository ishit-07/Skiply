import { DEFAULT_STATISTICS, STATISTICS_KEY, type SkipStatistics } from '../shared/statistics';

export class StatisticsService {
  public async get(): Promise<SkipStatistics> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(STATISTICS_KEY, (result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve({ ...DEFAULT_STATISTICS, ...(result[STATISTICS_KEY] as Partial<SkipStatistics> | undefined) });
      });
    });
  }

  public async recordSkip(): Promise<SkipStatistics> {
    const statistics = await this.get();
    const next = { skippedCount: statistics.skippedCount + 1, lastSkippedAt: Date.now() };
    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.set({ [STATISTICS_KEY]: next }, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve();
      });
    });
    return next;
  }
}
