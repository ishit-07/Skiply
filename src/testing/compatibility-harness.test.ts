// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  compatibilityScenarios,
  runCompatibilityHarness,
  runCompatibilityScenario
} from './compatibility-harness';

describe('compatibility harness', () => {
  it('recognizes accessible generic controls and rejects unsafe controls', () => {
    const results = runCompatibilityHarness();
    const byId = new Map(results.map((result) => [result.scenario.id, result]));

    expect(byId.get('visible-text')?.candidates[0].type).toBe('intro');
    expect(byId.get('aria-label')?.candidates[0].detectionSource).toBe('aria-label');
    expect(byId.get('role-button')?.candidates[0].type).toBe('intro');
    expect(byId.get('data-attribute')?.candidates[0].type).toBe('intro');
    expect(byId.get('advertisement')?.candidates).toHaveLength(0);
    expect(byId.get('next-episode')?.candidates).toHaveLength(0);
  });

  it('executes only the supported high-confidence intro scenario', () => {
    const results = runCompatibilityHarness();
    const actionResults = results.map(({ scenario, action }) => [scenario.id, action?.accepted] as const);

    expect(actionResults.find(([id]) => id === 'visible-text')?.[1]).toBe(true);
    expect(actionResults.filter(([, accepted]) => accepted)).toHaveLength(4);
  });

  it('covers the documented local scenario catalog', () => {
    expect(compatibilityScenarios.map(({ id }) => id)).toEqual([
      'visible-text',
      'aria-label',
      'role-button',
      'data-attribute',
      'advertisement',
      'next-episode'
    ]);
  });

  it('fails closed when a candidate is removed before execution', () => {
    const result = runCompatibilityScenario({
      id: 'removed-before-click',
      description: 'candidate removed between detection and execution',
      setup: () => {
        const button = document.createElement('button');
        button.textContent = 'Skip Intro';
        button.addEventListener('click', () => button.remove());
        Object.defineProperty(button, 'getBoundingClientRect', {
          configurable: true,
          value: () => ({ top: 0, left: 0, right: 100, bottom: 40, width: 100, height: 40 })
        });
        Object.defineProperty(button, 'getClientRects', {
          configurable: true,
          value: () => [{ width: 100, height: 40 }]
        });
        document.body.append(button);
        button.remove();
      }
    });

    expect(result.candidates).toHaveLength(0);
    expect(result.action).toBeNull();
  });
});
