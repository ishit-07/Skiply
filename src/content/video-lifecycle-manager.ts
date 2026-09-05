import { ActiveVideoDetector, scoreVideo, type ActiveVideoDetection } from './active-video-detector';

export interface VideoLifecycleCallbacks {
  onActiveVideoChanged?: (detection: ActiveVideoDetection | null) => void;
}

export interface VideoLifecycleOptions extends VideoLifecycleCallbacks {
  detector?: ActiveVideoDetector;
  getActiveVideo?: () => HTMLVideoElement | null;
  debounceMs?: number;
}

export class VideoLifecycleManager {
  private readonly detector: ActiveVideoDetector;
  private readonly debounceMs: number;
  private readonly activeVideoProvider?: () => HTMLVideoElement | null;
  private readonly onActiveVideoChanged?: (detection: ActiveVideoDetection | null) => void;
  private readonly videoListeners = new Map<HTMLVideoElement, () => void>();
  private mutationObserver: MutationObserver | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private activeVideo: HTMLVideoElement | null = null;
  private started = false;

  public constructor(options: VideoLifecycleOptions = {}) {
    this.detector = options.detector ?? new ActiveVideoDetector();
    this.debounceMs = options.debounceMs ?? 150;
    this.activeVideoProvider = options.getActiveVideo;
    this.onActiveVideoChanged = options.onActiveVideoChanged;
  }

  public start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.refresh();

    if (typeof document.body !== 'undefined' && document.body) {
      this.mutationObserver = new MutationObserver(() => this.scheduleRefresh());
      this.mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  public stop(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;

    if (this.refreshTimer !== null) {
      globalThis.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    for (const removeListeners of this.videoListeners.values()) {
      removeListeners();
    }
    this.videoListeners.clear();
    this.setActiveVideo(null);
  }

  public refresh(): ActiveVideoDetection | null {
    if (!this.started) {
      return null;
    }

    const detection = this.activeVideoProvider
      ? this.getActiveVideoDetection()
      : this.detector.detect();
    this.syncVideoListeners();
    this.setActiveVideo(detection?.video ?? null);
    return detection;
  }

  private getActiveVideoDetection(): ActiveVideoDetection | null {
    const video = this.activeVideoProvider?.() ?? null;
    return video ? scoreVideo(video) : null;
  }

  public getActiveVideo(): HTMLVideoElement | null {
    return this.activeVideo;
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer !== null) {
      globalThis.clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = globalThis.setTimeout(() => {
      this.refreshTimer = null;
      this.refresh();
    }, this.debounceMs);
  }

  private syncVideoListeners(): void {
    const videos = new Set(Array.from(document.querySelectorAll('video')));

    for (const [video, removeListeners] of this.videoListeners) {
      if (!videos.has(video)) {
        removeListeners();
        this.videoListeners.delete(video);
      }
    }

    for (const video of videos) {
      if (this.videoListeners.has(video)) {
        continue;
      }

      const refresh = () => this.scheduleRefresh();
      for (const eventName of ['playing', 'pause', 'loadedmetadata', 'durationchange', 'emptied']) {
        video.addEventListener(eventName, refresh);
      }

      this.videoListeners.set(video, () => {
        for (const eventName of ['playing', 'pause', 'loadedmetadata', 'durationchange', 'emptied']) {
          video.removeEventListener(eventName, refresh);
        }
      });
    }
  }

  private setActiveVideo(video: HTMLVideoElement | null): void {
    if (this.activeVideo === video) {
      return;
    }

    this.activeVideo = video;
    const detection = video
      ?       this.activeVideoProvider
        ? this.getActiveVideoDetection()
        : this.detector.detect()
      : null;
    this.onActiveVideoChanged?.(detection);
  }
}
