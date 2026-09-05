import { DEFAULT_SETTINGS, SETTINGS_KEY, type ExtensionSettings } from '../shared/settings';
import { StatisticsService } from '../storage/statistics-service';

const readSettings = (): Promise<ExtensionSettings> =>
  new Promise((resolve) => {
    chrome.storage.local.get(SETTINGS_KEY, (result) => {
      const settings = result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined;
      resolve({ ...DEFAULT_SETTINGS, ...settings });
    });
  });

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await readSettings();
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  console.info('[USI] Background service worker ready');
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ping') {
    sendResponse({ ok: true, status: 'ready' });
    return false;
  }

  if (message.type === 'get-settings') {
    readSettings().then((settings) => sendResponse({ settings })).catch(() => {
      sendResponse({ settings: DEFAULT_SETTINGS });
    });
    return true;
  }

  if (message.type === 'record-skip') {
    new StatisticsService()
      .recordSkip()
      .then((statistics) => sendResponse({ statistics }))
      .catch((error: unknown) => sendResponse({ error: error instanceof Error ? error.message : 'Unable to record skip' }));
    return true;
  }

  return false;
});
