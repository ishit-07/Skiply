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
    const adapterCandidate = {
      element: document.createElement('button'),
      type: 'intro' as const,
      confidence: 0.96,
      detectionSource: 'platform-adapter' as const,
      evidence: []
    };
    const observer = new SkipControlObserver({
      onCandidates,
      findCandidates: () => [adapterCandidate]
    });

    observer.start();

    expect(onCandidates.mock.calls[0]?.[0]).toEqual([adapterCandidate]);
    observer.stop();
  });
});
