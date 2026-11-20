import { DEFAULT_SETTINGS, SETTINGS_KEY, type ExtensionSettings } from '../shared/settings';
import { StatisticsService } from '../storage/statistics-service';
import type { FrameDiagnostic, FrameStatusMessage, GetFrameDiagnosticsMessage } from '../shared/runtime-messages';

const frameDiagnostics = new Map<number, Map<number, FrameDiagnostic>>();
const FRAME_DIAGNOSTICS_KEY_PREFIX = 'skiply-frame-diagnostics:';
const getFrameDiagnosticsKey = (tabId: number): string => `${FRAME_DIAGNOSTICS_KEY_PREFIX}${tabId}`;

const persistFrameDiagnostics = (tabId: number, tabFrames: Map<number, FrameDiagnostic>): void => {
  const diagnostics = Array.from(tabFrames.values()).sort((left, right) => left.frameId - right.frameId);
  void chrome.storage.session.set({
    [getFrameDiagnosticsKey(tabId)]: diagnostics
  });
};

const clearPersistedFrameDiagnostics = (tabId: number): void => {
  frameDiagnostics.delete(tabId);
  void chrome.storage.session.remove(getFrameDiagnosticsKey(tabId));
};

const readPersistedFrameDiagnostics = (tabId: number): Promise<FrameDiagnostic[]> =>
  new Promise((resolve) => {
    chrome.storage.session.get(getFrameDiagnosticsKey(tabId), (result) => {
      resolve((result[getFrameDiagnosticsKey(tabId)] as FrameDiagnostic[] | undefined) ?? []);
    });
  });

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
    persistFrameDiagnostics(tabId, tabFrames);
    return false;
  }

  if (message.type === 'get-frame-diagnostics') {
    const tabId = (message as GetFrameDiagnosticsMessage).tabId;
    if (tabId === undefined) {
      sendResponse({ diagnostics: [] });
      return false;
    }

    const tabFrames = frameDiagnostics.get(tabId);
    if (tabFrames) {
      sendResponse({
        diagnostics: Array.from(tabFrames.values()).sort((left, right) => left.frameId - right.frameId)
      });
      return false;
    }

    readPersistedFrameDiagnostics(tabId).then((diagnostics) => {
      sendResponse({ diagnostics });
      frameDiagnostics.set(tabId, new Map(diagnostics.map((frame) => [frame.frameId, frame])));
    });
    return true;
  }

  if (message.type === 'frame-disposed') {
    const tabId = sender.tab?.id;
    const frameId = sender.frameId;
    if (tabId !== undefined && frameId !== undefined) {
      const tabFrames = frameDiagnostics.get(tabId);
      tabFrames?.delete(frameId);
      if (tabFrames) {
        persistFrameDiagnostics(tabId, tabFrames);
      } else {
        void chrome.storage.session.remove(getFrameDiagnosticsKey(tabId));
      }
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
  clearPersistedFrameDiagnostics(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading' || changeInfo.url !== undefined) {
    clearPersistedFrameDiagnostics(tabId);
  }
});
