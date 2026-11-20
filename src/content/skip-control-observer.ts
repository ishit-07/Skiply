import {
  GenericSkipControlDetector,
  type CandidateControl
} from './generic-skip-control-detector';

export interface SkipControlObserverOptions {
  detector?: GenericSkipControlDetector;
  findCandidates?: (activeVideo: HTMLVideoElement | null) => CandidateControl[];
  debounceMs?: number;
  onCandidates: (candidates: CandidateControl[]) => void;
}

const RELEVANT_ATTRIBUTES = new Set([
  'aria-disabled',
  'aria-hidden',
  'aria-label',
  'aria-labelledby',
  'class',
  'disabled',
  'hidden',
  'style',
  'title'
]);

const isRelevantMutation = (mutation: MutationRecord): boolean =>
  mutation.type === 'childList' ||
  (mutation.type === 'attributes' &&
    (RELEVANT_ATTRIBUTES.has(mutation.attributeName ?? '') ||
      mutation.attributeName?.startsWith('data-') === true));

export class SkipControlObserver {
  private readonly detector: GenericSkipControlDetector;
  private readonly debounceMs: number;
  private readonly onCandidates: (candidates: CandidateControl[]) => void;
  private readonly findCandidates?: (activeVideo: HTMLVideoElement | null) => CandidateControl[];
  private observer: MutationObserver | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private activeVideo: HTMLVideoElement | null = null;
  private lastCandidateFingerprint: string | null = null;
  private readonly elementIds = new WeakMap<HTMLElement, number>();
  private nextElementId = 1;

  public constructor(options: SkipControlObserverOptions) {
    this.detector = options.detector ?? new GenericSkipControlDetector();
    this.findCandidates = options.findCandidates;
    this.debounceMs = options.debounceMs ?? 150;
    this.onCandidates = options.onCandidates;
  }

  public start(activeVideo: HTMLVideoElement | null = null): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.activeVideo = activeVideo;
    this.scan();

    if (document.body) {
      this.observer = new MutationObserver((mutations) => {
        if (mutations.some(isRelevantMutation)) {
          this.scheduleScan();
        }
      });
      this.observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    }
  }

  public setActiveVideo(activeVideo: HTMLVideoElement | null): void {
    this.activeVideo = activeVideo;
    if (this.started) {
      this.scheduleScan();
    }
  }

  public stop(): void {
    this.started = false;
    this.observer?.disconnect();
    this.observer = null;
    if (this.timer !== null) {
      globalThis.clearTimeout(this.timer);
      this.timer = null;
    }
    this.lastCandidateFingerprint = null;
  }

  private getElementId(element: HTMLElement): number {
    const existing = this.elementIds.get(element);
    if (existing !== undefined) {
      return existing;
    }
    const id = this.nextElementId++;
    this.elementIds.set(element, id);
    return id;
  }

  public scan(): CandidateControl[] {
    if (!this.started) {
      return [];
    }
    const candidates = this.findCandidates
      ? this.findCandidates(this.activeVideo)
      : this.detector.findCandidates(document, this.activeVideo);
    const fingerprint = candidates
      .map((candidate) =>
        [
          this.getElementId(candidate.element),
          candidate.element.isConnected ? 'connected' : 'stale',
          candidate.type,
          candidate.confidence,
          candidate.detectionSource
        ].join(':')
      )
      .join('|');
    const nextFingerprint = fingerprint === '' ? 'no-candidates' : fingerprint;
    if (nextFingerprint !== this.lastCandidateFingerprint) {
      this.lastCandidateFingerprint = nextFingerprint;
      this.onCandidates(candidates);
    }
    return candidates;
  }

  private scheduleScan(): void {
    if (this.timer !== null) {
      globalThis.clearTimeout(this.timer);
    }
    this.timer = globalThis.setTimeout(() => {
      this.timer = null;
      this.scan();
    }, this.debounceMs);
  }
}
