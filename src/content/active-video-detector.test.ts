// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { ActiveVideoDetector, scoreVideo } from './active-video-detector';

const setRect = (video: HTMLVideoElement, rect: Partial<DOMRect> = {}): void => {
  Object.defineProperty(video, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      x: rect.x ?? 0,
      y: rect.y ?? 0,
      top: rect.top ?? 0,
      left: rect.left ?? 0,
      right: rect.right ?? 640,
      bottom: rect.bottom ?? 360,
      width: rect.width ?? 640,
      height: rect.height ?? 360,
      toJSON: () => ({})
    })
  });
};

const createVideo = (options: { playing?: boolean; hidden?: boolean; rect?: Partial<DOMRect> } = {}) => {
  const video = document.createElement('video');
  Object.defineProperty(video, 'paused', { configurable: true, value: !options.playing });
  Object.defineProperty(video, 'ended', { configurable: true, value: false });
  Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
  Object.defineProperty(video, 'currentTime', { configurable: true, value: options.playing ? 12 : 0 });
  if (options.hidden) {
    video.style.display = 'none';
  }
  setRect(video, options.rect);
  document.body.append(video);
  return video;
};

describe('ActiveVideoDetector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 720 });
  });

  it('selects a visible, playing, player-sized video', () => {
    const hidden = createVideo({ hidden: true, playing: true });
    const active = createVideo({ playing: true });
    const detector = new ActiveVideoDetector();

    expect(detector.detect()?.video).toBe(active);
    expect(scoreVideo(hidden).score).toBe(0);
  });

  it('does not select an offscreen or zero-sized video', () => {
    const offscreen = createVideo({
      playing: true,
      rect: { left: 1400, right: 2040, width: 640 }
    });
    const zeroSized = createVideo({
      playing: true,
      rect: { right: 0, bottom: 0, width: 0, height: 0 }
    });

    expect(new ActiveVideoDetector().detect()).toBeNull();
    expect(scoreVideo(offscreen).score).toBeLessThan(0.55);
    expect(scoreVideo(zeroSized).score).toBeLessThan(0.55);
  });

  it('prefers the playing video when multiple visible videos exist', () => {
    createVideo({ playing: false });
    const playing = createVideo({ playing: true });

    expect(new ActiveVideoDetector().detect()?.video).toBe(playing);
  });
});
