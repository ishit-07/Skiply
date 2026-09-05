/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { DEFAULT_SETTINGS, SETTINGS_KEY, type ExtensionSettings } from '../shared/settings';
import { STATISTICS_KEY, DEFAULT_STATISTICS, type SkipStatistics } from '../shared/statistics';
import type { ContentCommand, ContentResponse } from '../shared/runtime-messages';

const readSettings = (): Promise<ExtensionSettings> =>
  new Promise((resolve) => {
    chrome.storage.local.get(SETTINGS_KEY, (result) => {
      const settings = result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined;
      resolve({ ...DEFAULT_SETTINGS, ...settings });
    });
  });

const App = () => {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [site, setSite] = useState('Unknown');
  const [playerState] = useState('Idle');
  const [statistics, setStatistics] = useState<SkipStatistics>(DEFAULT_STATISTICS);
  const [timestampStart, setTimestampStart] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    void readSettings().then((resolved) => {
      setSettings(resolved);
    });
    chrome.storage.local.get(STATISTICS_KEY, (result) => {
      setStatistics({ ...DEFAULT_STATISTICS, ...(result[STATISTICS_KEY] as Partial<SkipStatistics> | undefined) });
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.url) {
        try {
          const url = new URL(activeTab.url);
          setSite(url.hostname || 'Unknown');
        } catch {
          setSite('Unknown');
        }
      }
    });
  }, []);

  const sendContentCommand = (command: ContentCommand) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId === undefined) {
        setNotice('No active tab.');
        return;
      }
      chrome.tabs.sendMessage(tabId, { type: 'content-command', command }, (response: ContentResponse | undefined) => {
        if (chrome.runtime.lastError || !response) {
          setNotice('This page is not available to the extension.');
          return;
        }
        if (!response.ok) {
          setNotice(response.message ?? 'Command was not accepted.');
          return;
        }
        setTimestampStart(response.status?.timestampStart ?? null);
        setNotice(command === 'mark-start' ? 'Intro start marked.' : 'Intro timestamp saved.');
      });
    });
  };

  const actionsSummary = useMemo(
    () =>
      [
        settings.skipIntro ? 'Intro' : null,
        settings.skipRecap ? 'Recap' : null,
        settings.skipCredits ? 'Credits' : null
      ].filter(Boolean),
    [settings.skipIntro, settings.skipRecap, settings.skipCredits]
  );

  const updateSettings = (nextSettings: ExtensionSettings) => {
    setSettings(nextSettings);
    chrome.storage.local.set({ [SETTINGS_KEY]: nextSettings });
  };

  const toggleEnabled = () => {
    updateSettings({ ...settings, enabled: !settings.enabled });
  };

  return (
    <main className="popup-shell">
      <header className="popup-header">
        <div>
          <p className="eyebrow">Universal Skip Intro</p>
          <h1>Skiply</h1>
        </div>
        <button
          type="button"
          className={`toggle ${settings.enabled ? 'enabled' : 'disabled'}`}
          aria-label="Toggle extension"
          onClick={toggleEnabled}
        >
          {settings.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </header>

      <section className="status-grid">
        <div className="status-card">
          <span>Current site</span>
          <strong>{site}</strong>
        </div>
        <div className="status-card">
          <span>Player</span>
          <strong>{playerState}</strong>
        </div>
      </section>

      <div className="panel-row">
        <span>Automatic Skip</span>
        <strong>{settings.enabled ? 'ON' : 'OFF'}</strong>
      </div>

      <div className="panel-row">
        <span>Detection</span>
        <strong>{actionsSummary.length > 0 ? actionsSummary.join(', ') : 'Idle'}</strong>
      </div>

      <div className="panel-row">
        <span>Confidence</span>
        <strong>{Math.round(settings.confidenceThreshold * 100)}%</strong>
      </div>

      <div className="panel-row">
        <span>Skipped locally</span>
        <strong>{statistics.skippedCount}</strong>
      </div>

      <div className="manual-actions">
        <button type="button" onClick={() => sendContentCommand('mark-start')}>
          Mark Intro Start
        </button>
        <button type="button" disabled={timestampStart === null} onClick={() => sendContentCommand('mark-end')}>
          Mark Intro End
        </button>
      </div>
      {notice && <p className="notice">{notice}</p>}

      <div className="actions">
        <button type="button" onClick={() => chrome.runtime.openOptionsPage()}>
          Settings
        </button>
      </div>
    </main>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
