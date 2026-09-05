// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CandidateControl } from './generic-skip-control-detector';
import { SkipController } from './skip-controller';

const makeCandidate = (type: CandidateControl['type'] = 'intro'): CandidateControl => {
  const element = document.createElement('button');
  element.textContent = type === 'intro' ? 'Skip Intro' : 'Skip Recap';
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ top: 0, left: 0, right: 100, bottom: 40, width: 100, height: 40 })
  });
  Object.defineProperty(element, 'getClientRects', {
    configurable: true,
    value: () => [{ width: 100, height: 40 }]
  });
  document.body.append(element);

  return {
    element,
    type,
    confidence: 0.96,
    detectionSource: 'visible-text',
    evidence: [{ kind: 'visible-text', weight: 0.58 }]
  };
};

const makeVideo = (): HTMLVideoElement => {
  const video = document.createElement('video');
  document.body.append(video);
  return video;
};

describe('SkipController', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('clicks a high-confidence intro candidate exactly once', () => {
    const candidate = makeCandidate();
    const click = vi.spyOn(candidate.element, 'click');
    const onSkipped = vi.fn();
    const controller = new SkipController({ onSkipped });
    controller.setActiveVideo(makeVideo());

    expect(controller.processCandidate(candidate)).toEqual({ accepted: true, reason: 'skipped' });
    expect(controller.processCandidate(candidate)).toEqual({
      accepted: false,
      reason: 'already-processed'
    });
    expect(click).toHaveBeenCalledTimes(1);
    expect(onSkipped).toHaveBeenCalledWith(candidate);
  });

  it('does nothing when the active video is missing or confidence is low', () => {
    const candidate = makeCandidate();
    const click = vi.spyOn(candidate.element, 'click');
    const controller = new SkipController();

    expect(controller.processCandidate(candidate).reason).toBe('no-active-video');
    controller.setActiveVideo(makeVideo());
    expect(controller.processCandidate({ ...candidate, confidence: 0.89 }).reason).toBe('low-confidence');
    expect(click).not.toHaveBeenCalled();
  });

  it('rejects stale, hidden, disabled, and credits candidates by default', () => {
    const controller = new SkipController();
    controller.setActiveVideo(makeVideo());

    const stale = makeCandidate();
    stale.element.remove();
    expect(controller.processCandidate(stale).reason).toBe('stale-element');

    const hidden = makeCandidate();
    hidden.element.style.display = 'none';
    expect(controller.processCandidate(hidden).reason).toBe('hidden-element');

    const disabled = makeCandidate();
    disabled.element.setAttribute('disabled', '');
    expect(controller.processCandidate(disabled).reason).toBe('disabled-element');

    const credits = makeCandidate('credits');
    expect(controller.processCandidate(credits).reason).toBe('unsupported-type');
  });
});
