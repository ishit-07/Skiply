import {
  GenericSkipControlDetector,
  type CandidateControl
} from './generic-skip-control-detector';

export interface SkipControlObserverOptions {
  detector?: GenericSkipControlDetector;
  debounceMs?: number;
  onCandidates: (candidates: CandidateControl[]) => void;
}

export class SkipControlObserver {
  private readonly detector: GenericSkipControlDetector;
  private readonly debounceMs: number;
  private readonly onCandidates: (candidates: CandidateControl[]) => void;
  private observer: MutationObserver | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private activeVideo: HTMLVideoElement | null = null;

  public constructor(options: SkipControlObserverOptions) {
    this.detector = options.detector ?? new GenericSkipControlDetector();
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
      this.observer = new MutationObserver(() => this.scheduleScan());
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
  }

  public scan(): CandidateControl[] {
    if (!this.started) {
      return [];
    }
    const candidates = this.detector.findCandidates(document, this.activeVideo);
    this.onCandidates(candidates);
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
