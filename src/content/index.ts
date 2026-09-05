import { ActiveVideoDetector } from './active-video-detector';
import { SkipController } from './skip-controller';
import { SkipControlObserver } from './skip-control-observer';
import { VideoLifecycleManager } from './video-lifecycle-manager';

const log = (...args: unknown[]) => {
  console.info('[USI][content]', ...args);
};

const notifyReady = () => {
  chrome.runtime.sendMessage({ type: 'ping', url: window.location.href }, () => {
    log('ready on', window.location.href);
  });
};

const skipController = new SkipController({
  onSkipped: (candidate) => {
    log('skip action accepted', {
      type: candidate.type,
      confidence: candidate.confidence,
      detectionSource: candidate.detectionSource
    });
  }
});

const controlObserver = new SkipControlObserver({
  onCandidates: (candidates) => {
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

const lifecycleManager = new VideoLifecycleManager({
  detector: new ActiveVideoDetector(),
  onActiveVideoChanged: (detection) => {
    skipController.setActiveVideo(detection?.video ?? null);
    controlObserver.setActiveVideo(detection?.video ?? null);
    if (detection) {
      log('active video detected', {
        score: detection.score,
        reasons: detection.reasons
      });
    } else {
      log('active video unavailable');
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  log('DOMContentLoaded');
  notifyReady();
  lifecycleManager.start();
  controlObserver.start(lifecycleManager.getActiveVideo());
});

if (document.readyState !== 'loading') {
  notifyReady();
  lifecycleManager.start();
  controlObserver.start(lifecycleManager.getActiveVideo());
}
