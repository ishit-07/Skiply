import { ActiveVideoDetector } from './active-video-detector';
import { VideoLifecycleManager } from './video-lifecycle-manager';

const log = (...args: unknown[]) => {
  console.info('[USI][content]', ...args);
};

const notifyReady = () => {
  chrome.runtime.sendMessage({ type: 'ping', url: window.location.href }, () => {
    log('ready on', window.location.href);
  });
};

const lifecycleManager = new VideoLifecycleManager({
  detector: new ActiveVideoDetector(),
  onActiveVideoChanged: (detection) => {
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
});

if (document.readyState !== 'loading') {
  notifyReady();
  lifecycleManager.start();
}
