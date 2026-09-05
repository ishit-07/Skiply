import type { CandidateControl } from '../content/generic-skip-control-detector';
import type { EpisodeMetadata } from '../shared/timestamps';

export interface OTTAdapter {
  id: string;
  matches(url: URL): boolean;
  getActiveVideo(): HTMLVideoElement | null;
  findSkipControls(activeVideo?: HTMLVideoElement | null): CandidateControl[];
  getEpisodeMetadata(): EpisodeMetadata | null;
  seekTo(seconds: number): Promise<boolean>;
}

export interface AdapterSelection {
  adapter: OTTAdapter;
  matchedSpecificAdapter: boolean;
}
