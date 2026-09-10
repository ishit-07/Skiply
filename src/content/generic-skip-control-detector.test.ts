// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  GenericSkipControlDetector,
  inspectControlSurface,
  normalizeControlText
} from './generic-skip-control-detector';

const setVisible = (element: HTMLElement): void => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      top: 0,
      left: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => ({})
    })
  });
  Object.defineProperty(element, 'getClientRects', {
    configurable: true,
    value: () => [{ width: 100, height: 40 }]
  });
};

describe('GenericSkipControlDetector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('normalizes accessible text and class-like data attributes', () => {
    expect(normalizeControlText('  Skip_Intro… ')).toBe('skip intro');
  });

  it('detects intro, recap, and credits controls from semantic signals', () => {
    const intro = document.createElement('button');
    intro.textContent = 'Skip Intro';
    const recap = document.createElement('div');
    recap.setAttribute('role', 'button');
    recap.setAttribute('aria-label', 'Skip Recap');
    const credits = document.createElement('button');
    credits.setAttribute('data-testid', 'skip-end-credits');
    document.body.append(intro, recap, credits);
    [intro, recap, credits].forEach(setVisible);

    const candidates = new GenericSkipControlDetector().findCandidates();

    expect(candidates.map(({ type }) => type).sort()).toEqual(['credits', 'intro', 'recap']);
    expect(candidates.find(({ element }) => element === recap)?.detectionSource).toBe('aria-label');
  });

  it('supports aria-labelledby and ignores unsafe skip controls', () => {
    const label = document.createElement('span');
    label.id = 'skip-label';
    label.textContent = 'Skip Intro';
    const labelled = document.createElement('button');
    labelled.setAttribute('aria-labelledby', 'skip-label');
    const ad = document.createElement('button');
    ad.textContent = 'Skip Ad';
    const next = document.createElement('button');
    next.textContent = 'Next Episode';
    document.body.append(label, labelled, ad, next);
    [labelled, ad, next].forEach(setVisible);

    const candidates = new GenericSkipControlDetector().findCandidates();

    expect(candidates).toHaveLength(1);
    expect(candidates[0].detectionSource).toBe('aria-labelledby');
  });

  it('excludes hidden and disabled controls and supports custom phrases', () => {
    const hidden = document.createElement('button');
    hidden.textContent = 'Skip Intro';
    hidden.style.display = 'none';
    const disabled = document.createElement('button');
    disabled.textContent = 'Skip Intro';
    disabled.disabled = true;
    const localized = document.createElement('button');
    localized.textContent = 'Omitir apertura';
    document.body.append(hidden, disabled, localized);
    setVisible(disabled);
    setVisible(localized);

    const candidates = new GenericSkipControlDetector({
      phrases: { intro: ['omitir apertura'] },
      minimumConfidence: 0.8
    }).findCandidates();

    expect(candidates).toHaveLength(1);
    expect(candidates[0].type).toBe('intro');
    expect(candidates[0].confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('reports compact diagnostic stages without changing detection behavior', () => {
    const visible = document.createElement('button');
    visible.textContent = 'Play';
    const skip = document.createElement('div');
    skip.setAttribute('role', 'button');
    skip.setAttribute('aria-label', 'Skip Intro');
    const hidden = document.createElement('button');
    hidden.textContent = 'Skip Intro';
    hidden.style.display = 'none';
    const disabled = document.createElement('button');
    disabled.textContent = 'Skip Intro';
    disabled.disabled = true;
    document.body.append(visible, skip, hidden, disabled);
    [visible, skip, disabled].forEach(setVisible);

    const report = inspectControlSurface();

    expect(report.controls.map(({ stage }) => stage)).toEqual(['not-matched', 'matched', 'hidden', 'disabled']);
    expect(report.controls[1]?.matchedPhrase).toBe('skip intro');
    expect(report.nestedIframes).toBe(0);
    expect(report.canvasElements).toBe(0);
  });
});
