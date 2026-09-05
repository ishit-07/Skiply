import type { AdapterSelection, OTTAdapter } from './adapter';
import { GenericAdapter } from './generic/generic-adapter';
import { NetflixAdapter } from './netflix/netflix-adapter';
import { PrimeVideoAdapter } from './prime-video/prime-video-adapter';

export class AdapterRegistry {
  private readonly genericAdapter: OTTAdapter;
  private readonly platformAdapters: OTTAdapter[];

  public constructor(
    platformAdapters: readonly OTTAdapter[] = [],
    genericAdapter: OTTAdapter = new GenericAdapter()
  ) {
    this.platformAdapters = [...platformAdapters];
    this.genericAdapter = genericAdapter;
  }

  public select(url: URL = new URL(window.location.href)): AdapterSelection {
    const adapter = this.platformAdapters.find((candidate) => candidate.matches(url));
    return {
      adapter: adapter ?? this.genericAdapter,
      matchedSpecificAdapter: adapter !== undefined
    };
  }

  public register(adapter: OTTAdapter): void {
    this.platformAdapters.push(adapter);
  }
}

export const createDefaultAdapterRegistry = (): AdapterRegistry =>
  new AdapterRegistry([new NetflixAdapter(), new PrimeVideoAdapter()]);
