import { DEFAULT_SETTINGS, SETTINGS_KEY, type ExtensionSettings } from '../shared/settings';
import { StatisticsService } from '../storage/statistics-service';
import type { FrameDiagnostic, FrameStatusMessage, GetFrameDiagnosticsMessage } from '../shared/runtime-messages';

const frameDiagnostics = new Map<number, Map<number, FrameDiagnostic>>();

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ping') {
    sendResponse({ ok: true, status: 'ready' });
    return false;
  }

  if (message.type === 'frame-status') {
    const frameMessage = message as FrameStatusMessage;
    const tabId = sender.tab?.id;
    const frameId = sender.frameId;
    if (tabId === undefined || frameId === undefined) {
      return false;
    }

    const tabFrames = frameDiagnostics.get(tabId) ?? new Map<number, FrameDiagnostic>();
    tabFrames.set(frameId, {
      ...frameMessage.status,
      tabId,
      frameId,
      frameUrl: sender.url ?? frameMessage.status.frameUrl
    });
    frameDiagnostics.set(tabId, tabFrames);
    return false;
  }

  if (message.type === 'get-frame-diagnostics') {
    const tabId = (message as GetFrameDiagnosticsMessage).tabId;
    sendResponse({
      diagnostics:
        tabId === undefined ? [] : Array.from(frameDiagnostics.get(tabId)?.values() ?? []).sort((left, right) => left.frameId - right.frameId)
    });
    return false;
  }

  if (message.type === 'frame-disposed') {
    const tabId = sender.tab?.id;
    const frameId = sender.frameId;
    if (tabId !== undefined && frameId !== undefined) {
      frameDiagnostics.get(tabId)?.delete(frameId);
    }
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

chrome.tabs.onRemoved.addListener((tabId) => {
  frameDiagnostics.delete(tabId);
});
