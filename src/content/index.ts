const log = (...args: unknown[]) => {
  console.info('[USI][content]', ...args);
};

const notifyReady = () => {
  chrome.runtime.sendMessage({ type: 'ping', url: window.location.href }, () => {
    log('ready on', window.location.href);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  log('DOMContentLoaded');
  notifyReady();
});

if (document.readyState !== 'loading') {
  notifyReady();
}
