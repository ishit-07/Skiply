export interface ActiveVideoDetection {
  video: HTMLVideoElement;
  score: number;
  reasons: string[];
}

export interface VideoDetectionOptions {
  minimumScore?: number;
}

const DEFAULT_MINIMUM_SCORE = 0.55;

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const isFinitePositive = (value: number): boolean => Number.isFinite(value) && value > 0;

const getViewport = (): { width: number; height: number } => ({
  width: typeof window === 'undefined' ? 0 : window.innerWidth,
  height: typeof window === 'undefined' ? 0 : window.innerHeight
});

const getVisibilityScore = (video: HTMLVideoElement): number => {
  if (typeof window === 'undefined') {
    return 0;
  }

  const style = window.getComputedStyle(video);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    (style.opacity !== '' && Number(style.opacity) === 0)
  ) {
    return 0;
  }

  return 1;
};

const getViewportScore = (video: HTMLVideoElement): number => {
  const rect = video.getBoundingClientRect();
  const viewport = getViewport();
  if (rect.width <= 0 || rect.height <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    return 0;
  }

  const visibleWidth = Math.max(0, Math.min(rect.right, viewport.width) - Math.max(rect.left, 0));
  const visibleHeight = Math.max(0, Math.min(rect.bottom, viewport.height) - Math.max(rect.top, 0));
  const visibleArea = visibleWidth * visibleHeight;
  const area = rect.width * rect.height;

  return area > 0 ? clamp(visibleArea / area) : 0;
};

const getDimensionScore = (video: HTMLVideoElement): number => {
  const rect = video.getBoundingClientRect();
  const area = rect.width * rect.height;
  if (area <= 0) {
    return 0;
  }

  return clamp(area / (640 * 360));
};

export const scoreVideo = (video: HTMLVideoElement): ActiveVideoDetection => {
  const reasons: string[] = [];
  let score = 0;

  if (!video.isConnected) {
    return { video, score: 0, reasons: ['disconnected'] };
  }

  const visibilityScore = getVisibilityScore(video);
  if (visibilityScore === 0) {
    return { video, score: 0, reasons: ['hidden'] };
  }
  score += 0.25;
  reasons.push('visible');

  const viewportScore = getViewportScore(video);
  if (viewportScore === 0) {
    return { video, score: 0, reasons: ['not-in-viewport'] };
  }
  score += viewportScore * 0.3;
  if (viewportScore > 0) {
    reasons.push('in-viewport');
  }

  const dimensionScore = getDimensionScore(video);
  score += dimensionScore * 0.2;
  if (dimensionScore >= 0.5) {
    reasons.push('player-sized');
  }

  if (!video.paused && !video.ended) {
    score += 0.2;
    reasons.push('playing');
  } else if (video.currentTime > 0 && isFinitePositive(video.duration)) {
    score += 0.08;
    reasons.push('has-playback-position');
  }

  if (isFinitePositive(video.duration)) {
    score += 0.05;
    reasons.push('known-duration');
  }

  if (video.muted && video.paused) {
    score -= 0.1;
    reasons.push('muted-paused');
  }

  return { video, score: clamp(score), reasons };
};

export class ActiveVideoDetector {
  private readonly minimumScore: number;

  public constructor(options: VideoDetectionOptions = {}) {
    this.minimumScore = options.minimumScore ?? DEFAULT_MINIMUM_SCORE;
  }

  public detect(): ActiveVideoDetection | null {
    const videos = Array.from(document.querySelectorAll('video'));
    const detections = videos.map(scoreVideo).sort((left, right) => right.score - left.score);
    const best = detections[0];

    return best && best.score >= this.minimumScore ? best : null;
  }
}
