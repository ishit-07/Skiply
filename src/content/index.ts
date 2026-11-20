import { ActiveVideoDetector } from './active-video-detector';
import { createDefaultAdapterRegistry } from '../adapters/adapter-registry';
import { ManualTimestampSession } from './manual-timestamp-session';
import { LocalTimestampRepository } from '../storage/timestamp-repository';
import type { ContentCommandMessage, ContentResponse } from '../shared/runtime-messages';
import type { FrameStatusReport } from '../shared/runtime-messages';
import { SETTINGS_KEY } from '../shared/settings';
import { inspectControlSurface, type ControlSurfaceReport } from './generic-skip-control-detector';
import { SkipController } from './skip-controller';
import { SkipControlObserver } from './skip-control-observer';
import { VideoLifecycleManager } from './video-lifecycle-manager';

let readyNotified = false;
let latestVideoScore: number | null = null;
let latestCandidates = {
  count: 0,
  type: null as string | null,
  confidence: null as number | null
};
let lastReportedFrameStatus = '';
let lifecycleManager: VideoLifecycleManager | undefined;
let debugMode = false;
let controlSurface: ControlSurfaceReport | undefined;

const log = (...args: unknown[]) => {
  if (debugMode) {
    console.info('[USI][content]', ...args);
  }
};

const safeSendMessage = (message: object, callback?: (response: unknown) => void): void => {
  try {
    if (callback) {
      chrome.runtime.sendMessage(message, callback);
    } else {
      const result = chrome.runtime.sendMessage(message);
      void result?.catch(() => undefined);
    }
  } catch {
    // The extension context may be invalidated after a reload.
  }
};

const frameStatus = (): FrameStatusReport => ({
  isTopFrame: window.top === window.self,
  frameUrl: window.location.href,
  videoPresent: Boolean(lifecycleManager?.getActiveVideo()),
  videoScore: latestVideoScore,
  candidateCount: latestCandidates.count,
  bestCandidateType: latestCandidates.type,
  bestCandidateConfidence: latestCandidates.confidence,
  ...(debugMode && controlSurface ? { controlDiagnostics: controlSurface } : {})
});

const reportFrameStatus = () => {
  const status = frameStatus();
  const serialized = JSON.stringify(status);
  if (serialized === lastReportedFrameStatus) {
    return;
  }
  lastReportedFrameStatus = serialized;
  safeSendMessage({ type: 'frame-status', status });
};

const notifyReady = () => {
  if (readyNotified) {
    return;
  }
  readyNotified = true;
  safeSendMessage({ type: 'ping', url: window.location.href }, () => {
    log('ready on', window.location.href);
  });
};

const adapterSelection = createDefaultAdapterRegistry().select(new URL(window.location.href));
log('adapter selected', {
  id: adapterSelection.adapter.id,
  matchedSpecificAdapter: adapterSelection.matchedSpecificAdapter,
  metadata: adapterSelection.adapter.getEpisodeMetadata()
});

const timestampSession = new ManualTimestampSession(new LocalTimestampRepository());

chrome.storage.local.get(SETTINGS_KEY, (result) => {
  const settings = result[SETTINGS_KEY] as { debugMode?: boolean } | undefined;
  debugMode = settings?.debugMode === true;
  if (debugMode) {
    controlSurface = inspectControlSurface();
    reportFrameStatus();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes[SETTINGS_KEY]) {
    return;
  }
  const settings = changes[SETTINGS_KEY].newValue as { debugMode?: boolean } | undefined;
  debugMode = settings?.debugMode === true;
  if (debugMode) {
    controlSurface = inspectControlSurface();
  } else {
    controlSurface = undefined;
  }
  reportFrameStatus();
});

const getContentStatus = () => ({
  adapterId: adapterSelection.adapter.id,
  activeVideo: Boolean(adapterSelection.adapter.getActiveVideo()),
  currentTime: adapterSelection.adapter.getActiveVideo()?.currentTime ?? null,
  metadataAvailable: Boolean(adapterSelection.adapter.getEpisodeMetadata()),
  timestampStart: timestampSession.getStart(),
  frame: frameStatus()
});

chrome.runtime.onMessage.addListener((message: ContentCommandMessage, _sender, sendResponse) => {
  if (message.type !== 'content-command') {
    return false;
  }

  const video = adapterSelection.adapter.getActiveVideo();
  if (message.command === 'get-status') {
    sendResponse({ ok: true, status: getContentStatus() } satisfies ContentResponse);
    return false;
  }
  if (!video) {
    sendResponse({ ok: false, message: 'No active video detected.' } satisfies ContentResponse);
    return false;
  }
  if (message.command === 'mark-start') {
    try {
      timestampSession.markStart(video.currentTime);
      sendResponse({ ok: true, status: getContentStatus() } satisfies ContentResponse);
    } catch (error: unknown) {
      sendResponse({ ok: false, message: error instanceof Error ? error.message : 'Unable to mark start.' } satisfies ContentResponse);
    }
    return false;
  }
  void timestampSession
    .markEnd(video.currentTime, adapterSelection.adapter.getEpisodeMetadata() ?? {})
    .then(() => sendResponse({ ok: true, status: getContentStatus() } satisfies ContentResponse))
    .catch((error: unknown) =>
      sendResponse({ ok: false, message: error instanceof Error ? error.message : 'Unable to mark end.' } satisfies ContentResponse)
    );
  return true;
});

const skipController = new SkipController({
  onSkipped: (candidate) => {
    safeSendMessage({ type: 'record-skip' });
    log('skip action accepted', {
      type: candidate.type,
      confidence: candidate.confidence,
      detectionSource: candidate.detectionSource
    });
  }
});

const controlObserver = new SkipControlObserver({
  findCandidates: (activeVideo) => adapterSelection.adapter.findSkipControls(activeVideo),
  onCandidates: (candidates) => {
    if (debugMode) {
      controlSurface = inspectControlSurface();
    }
    const bestCandidate = candidates[0];
    latestCandidates = {
      count: candidates.length,
      type: bestCandidate?.type ?? null,
      confidence: bestCandidate?.confidence ?? null
    };
    reportFrameStatus();
    log('skip control candidates', candidates.map(({ type, confidence, detectionSource }) => ({
      type,
      confidence,
      detectionSource
    })));
    const result = skipController.processCandidates(candidates);
    if (result && !result.accepted) {
      log('skip action rejected', result);
    }
  }
});

lifecycleManager = new VideoLifecycleManager({
  detector: new ActiveVideoDetector(),
  getActiveVideo: () => adapterSelection.adapter.getActiveVideo(),
  onActiveVideoChanged: (detection) => {
    skipController.setActiveVideo(detection?.video ?? null);
    controlObserver.setActiveVideo(detection?.video ?? null);
    latestVideoScore = detection?.score ?? null;
    if (detection) {
      log('active video detected', {
        score: detection.score,
        reasons: detection.reasons
      });
    } else {
      log('active video unavailable');
    }
    reportFrameStatus();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  log('DOMContentLoaded');
  notifyReady();
  lifecycleManager?.start();
  controlObserver.start(lifecycleManager?.getActiveVideo() ?? null);
  reportFrameStatus();
});

if (document.readyState !== 'loading') {
  notifyReady();
  lifecycleManager?.start();
  controlObserver.start(lifecycleManager?.getActiveVideo() ?? null);
  reportFrameStatus();
}

window.addEventListener('pagehide', () => {
  safeSendMessage({ type: 'frame-disposed' });
});
