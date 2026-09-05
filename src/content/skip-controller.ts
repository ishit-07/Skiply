import type { CandidateControl } from './generic-skip-control-detector';
import type { SkipType } from '../shared/settings';

export interface SkipControllerOptions {
  confidenceThreshold?: number;
  enabledTypes?: ReadonlySet<SkipType>;
  onSkipped?: (candidate: CandidateControl) => void;
}

export interface SkipActionResult {
  accepted: boolean;
  reason:
    | 'skipped'
    | 'no-active-video'
    | 'low-confidence'
    | 'unsupported-type'
    | 'stale-element'
    | 'hidden-element'
    | 'disabled-element'
    | 'already-processed';
}

const DEFAULT_CONFIDENCE_THRESHOLD = 0.9;
const DEFAULT_ENABLED_TYPES: ReadonlySet<SkipType> = new Set(['intro', 'recap']);

const isVisible = (element: HTMLElement): boolean => {
  if (!element.isConnected) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    (style.opacity !== '' && Number(style.opacity) === 0)
  ) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0 || element.getClientRects().length > 0;
};

const isEnabled = (element: HTMLElement): boolean =>
  !element.matches(':disabled,[aria-disabled="true"]') &&
  element.getAttribute('disabled') === null;

export class SkipController {
  private readonly confidenceThreshold: number;
  private readonly enabledTypes: ReadonlySet<SkipType>;
  private readonly onSkipped?: (candidate: CandidateControl) => void;
  private readonly processedElements = new WeakSet<HTMLElement>();
  private activeVideo: HTMLVideoElement | null = null;

  public constructor(options: SkipControllerOptions = {}) {
    this.confidenceThreshold = options.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
    this.enabledTypes = options.enabledTypes ?? DEFAULT_ENABLED_TYPES;
    this.onSkipped = options.onSkipped;
  }

  public setActiveVideo(video: HTMLVideoElement | null): void {
    this.activeVideo = video;
  }

  public processCandidates(candidates: readonly CandidateControl[]): SkipActionResult | null {
    let rejection: SkipActionResult | null = null;
    for (const candidate of candidates) {
      if (this.processedElements.has(candidate.element)) {
        continue;
      }

      const result = this.processCandidate(candidate);
      if (result.accepted) {
        return result;
      }
      rejection = result;
    }

    return rejection;
  }

  public processCandidate(candidate: CandidateControl): SkipActionResult {
    if (!this.activeVideo) {
      return { accepted: false, reason: 'no-active-video' };
    }
    if (candidate.confidence < this.confidenceThreshold) {
      return { accepted: false, reason: 'low-confidence' };
    }
    if (!this.enabledTypes.has(candidate.type)) {
      return { accepted: false, reason: 'unsupported-type' };
    }
    if (this.processedElements.has(candidate.element)) {
      return { accepted: false, reason: 'already-processed' };
    }
    if (!candidate.element.isConnected) {
      return { accepted: false, reason: 'stale-element' };
    }
    if (!isVisible(candidate.element)) {
      return { accepted: false, reason: 'hidden-element' };
    }
    if (!isEnabled(candidate.element)) {
      return { accepted: false, reason: 'disabled-element' };
    }

    this.processedElements.add(candidate.element);
    candidate.element.click();
    this.onSkipped?.(candidate);
    return { accepted: true, reason: 'skipped' };
  }
}
