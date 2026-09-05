export interface SkipStatistics {
  skippedCount: number;
  lastSkippedAt?: number;
}

export const STATISTICS_KEY = 'universal-skip-intro-statistics';
export const DEFAULT_STATISTICS: SkipStatistics = {
  skippedCount: 0
};
