// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkipControlObserver } from './skip-control-observer';

const makeVisible = (element: HTMLElement): void => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ top: 0, left: 0, right: 100, bottom: 40, width: 100, height: 40 })
  });
  Object.defineProperty(element, 'getClientRects', {
    configurable: true,
    value: () => [{ width: 100, height: 40 }]
  });
};

describe('SkipControlObserver', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('finds controls inserted after startup with one debounced observer', async () => {
    const onCandidates = vi.fn();
    const observer = new SkipControlObserver({ debounceMs: 1, onCandidates });
    observer.start();
    onCandidates.mockClear();

    const button = document.createElement('button');
    button.textContent = 'Skip Intro';
    makeVisible(button);
    document.body.append(button);

    await vi.waitFor(() => expect(onCandidates).toHaveBeenCalled());
    expect(onCandidates.mock.lastCall?.[0][0].type).toBe('intro');
    observer.stop();
  });

  it('stops reacting after cleanup', async () => {
    const onCandidates = vi.fn();
    const observer = new SkipControlObserver({ debounceMs: 1, onCandidates });
    observer.start();
    observer.stop();
    onCandidates.mockClear();

    const button = document.createElement('button');
    button.textContent = 'Skip Intro';
    makeVisible(button);
    document.body.append(button);
    await new Promise((resolve) => globalThis.setTimeout(resolve, 5));

    expect(onCandidates).not.toHaveBeenCalled();
  });

  it('supports an adapter-provided candidate source', () => {
    const onCandidates = vi.fn();
    const activeVideo = document.createElement('video');
    const adapterCandidate = {
      element: document.createElement('button'),
      type: 'intro' as const,
      confidence: 0.96,
      detectionSource: 'platform-adapter' as const,
      evidence: []
    };
    const observer = new SkipControlObserver({
      onCandidates,
      findCandidates: (receivedVideo) => {
        expect(receivedVideo).toBe(activeVideo);
        return [adapterCandidate];
      }
    });

    observer.start(activeVideo);

    expect(onCandidates.mock.calls[0]?.[0]).toEqual([adapterCandidate]);
    observer.stop();
  });

  it('ignores unrelated attribute mutations', async () => {
    const onCandidates = vi.fn();
    const observer = new SkipControlObserver({ debounceMs: 1, onCandidates });
    observer.start();
    onCandidates.mockClear();

    document.body.setAttribute('id', 'unrelated');
    await new Promise((resolve) => globalThis.setTimeout(resolve, 5));

    expect(onCandidates).not.toHaveBeenCalled();
    observer.stop();
  });

  it('reacts to attributes used by candidate detection', async () => {
    const onCandidates = vi.fn();
    const observer = new SkipControlObserver({
      debounceMs: 1,
      findCandidates: () => {
        return document.querySelector('[data-skip-control]')
          ? [{
              element: document.querySelector('[data-skip-control]') as HTMLElement,
              type: 'intro' as const,
              confidence: 0.96,
              detectionSource: 'visible-text' as const,
              evidence: []
            }]
          : [];
      },
      onCandidates
    });
    observer.start();
    onCandidates.mockClear();

    const button = document.createElement('button');
    button.textContent = 'Skip Intro';
    button.setAttribute('data-skip-control', 'true');
    makeVisible(button);
    document.body.append(button);
    document.body.setAttribute('data-player-state', 'ready');
    await vi.waitFor(() => expect(onCandidates).toHaveBeenCalledTimes(1));

    observer.stop();
  });

  it('does not emit unchanged candidate state repeatedly', async () => {
    const onCandidates = vi.fn();
    const observer = new SkipControlObserver({ debounceMs: 1, onCandidates });
    observer.start();
    onCandidates.mockClear();

    const button = document.createElement('button');
    button.textContent = 'Skip Intro';
    makeVisible(button);
    document.body.append(button);
    await vi.waitFor(() => expect(onCandidates).toHaveBeenCalledTimes(1));

    document.body.setAttribute('data-player-state', 'ready');
    await new Promise((resolve) => globalThis.setTimeout(resolve, 10));

    expect(onCandidates).toHaveBeenCalledTimes(1);
    observer.stop();
  });

  it('emits when a replacement element has the same candidate fields', async () => {
    let button: HTMLButtonElement | null = null;
    const onCandidates = vi.fn();
    const observer = new SkipControlObserver({
      debounceMs: 1,
      findCandidates: () => {
        if (!button) {
          return [];
        }
        return [{
          element: button,
          type: 'intro' as const,
          confidence: 0.96,
          detectionSource: 'visible-text' as const,
          evidence: []
        }];
      },
      onCandidates
    });
    observer.start();
    onCandidates.mockClear();

    button = document.createElement('button');
    makeVisible(button);
    document.body.append(button);
    await vi.waitFor(() => expect(onCandidates).toHaveBeenCalledTimes(1));

    button.remove();
    const replacement = document.createElement('button');
    makeVisible(replacement);
    document.body.append(replacement);
    button = replacement;
    await vi.waitFor(() => expect(onCandidates).toHaveBeenCalledTimes(2));

    observer.stop();
  });
});
