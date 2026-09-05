import type { EpisodeMetadata, TimestampMatch, TimestampRecord } from '../shared/timestamps';
import { isValidTimestampRecord, matchTimestamp } from '../shared/timestamps';
import { StorageService } from './storage-service';

export interface TimestampRepository {
  save(record: TimestampRecord): Promise<void>;
  find(metadata: EpisodeMetadata, duration?: number): Promise<TimestampMatch | null>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export class LocalTimestampRepository implements TimestampRepository {
  private readonly storage: StorageService;

  public constructor(storage: StorageService = new StorageService()) {
    this.storage = storage;
  }

  public async save(record: TimestampRecord): Promise<void> {
    if (!isValidTimestampRecord(record)) {
      throw new Error('Invalid timestamp record');
    }
    await this.storage.saveTimestamp(record);
  }

  public async find(metadata: EpisodeMetadata, duration?: number): Promise<TimestampMatch | null> {
    const { records } = await this.storage.getTimestampState();
    const matches = records
      .filter((record) => isValidTimestampRecord(record, duration === undefined ? undefined : { duration }))
      .map((record) => matchTimestamp(record, metadata))
      .filter((match): match is TimestampMatch => match !== null)
      .sort((left, right) => right.score - left.score);
    return matches[0] ?? null;
  }

  public delete(id: string): Promise<void> {
    return this.storage.deleteTimestamp(id);
  }

  public clear(): Promise<void> {
    return this.storage.clearTimestamps();
  }
}
