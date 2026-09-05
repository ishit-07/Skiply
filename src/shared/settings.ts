export type SkipType = 'intro' | 'recap' | 'credits';

export interface ExtensionSettings {
  enabled: boolean;
  skipIntro: boolean;
  skipRecap: boolean;
  skipCredits: boolean;
  askBeforeSkipping: boolean;
  confidenceThreshold: number;
  debugMode: boolean;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  skipIntro: true,
  skipRecap: true,
  skipCredits: false,
  askBeforeSkipping: false,
  confidenceThreshold: 0.9,
  debugMode: false
};

export const SETTINGS_KEY = 'universal-skip-intro-settings';

export const getDefaultSettings = (): ExtensionSettings => ({ ...DEFAULT_SETTINGS });
