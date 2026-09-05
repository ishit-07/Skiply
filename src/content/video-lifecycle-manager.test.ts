// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoLifecycleManager } from './video-lifecycle-manager';

const makePlayingVideo = (): HTMLVideoElement => {
  const video = document.createElement('video');
  Object.defineProperty(video, 'paused', { configurable: true, value: false });
  Object.defineProperty(video, 'ended', { configurable: true, value: false });
  Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
  Object.defineProperty(video, 'currentTime', { configurable: true, value: 1 });
  Object.defineProperty(video, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      top: 0,
      left: 0,
      right: 640,
      bottom: 360,
      width: 640,
      height: 360,
      x: 0,
      y: 0,
      toJSON: () => ({})
    })
  });
  return video;
};

describe('VideoLifecycleManager', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 720 });
  });

  it('detects a video inserted after startup', async () => {
    const changes: Array<HTMLVideoElement | null> = [];
    const manager = new VideoLifecycleManager({
      debounceMs: 1,
      onActiveVideoChanged: (detection) => changes.push(detection?.video ?? null)
    });

    manager.start();
    const video = makePlayingVideo();
    document.body.append(video);
    await vi.waitFor(() => expect(manager.getActiveVideo()).toBe(video));

    expect(changes).toContain(video);
    manager.stop();
  });

  it('stops observing and clears the active video', async () => {
    const manager = new VideoLifecycleManager({ debounceMs: 1 });
    manager.start();
    const video = makePlayingVideo();
    document.body.append(video);
    await vi.waitFor(() => expect(manager.getActiveVideo()).toBe(video));

    manager.stop();
    expect(manager.getActiveVideo()).toBeNull();

    document.body.append(makePlayingVideo());
    await new Promise((resolve) => window.setTimeout(resolve, 5));
    expect(manager.getActiveVideo()).toBeNull();
  });

  it('uses an adapter-provided active video source when configured', () => {
    const video = makePlayingVideo();
    document.body.append(video);
    const manager = new VideoLifecycleManager({
      getActiveVideo: () => video
    });

    manager.start();

    expect(manager.getActiveVideo()).toBe(video);
    manager.stop();
  });
});
