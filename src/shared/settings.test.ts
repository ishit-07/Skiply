import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, getDefaultSettings } from './settings';

describe('Extension settings defaults', () => {
  it('provides a safe default configuration', () => {
    expect(DEFAULT_SETTINGS.enabled).toBe(true);
    expect(DEFAULT_SETTINGS.skipIntro).toBe(true);
    expect(DEFAULT_SETTINGS.skipRecap).toBe(true);
    expect(DEFAULT_SETTINGS.confidenceThreshold).toBeGreaterThanOrEqual(0.5);
  });

  it('returns a copy of the default settings instead of shared state', () => {
    const settings = getDefaultSettings();
    settings.enabled = false;
    expect(DEFAULT_SETTINGS.enabled).toBe(true);
  });
});
