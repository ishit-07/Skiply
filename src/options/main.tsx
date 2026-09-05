/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { DEFAULT_SETTINGS, SETTINGS_KEY, type ExtensionSettings } from '../shared/settings';
import { DEFAULT_STATISTICS, STATISTICS_KEY, type SkipStatistics } from '../shared/statistics';

const readSettings = (): Promise<ExtensionSettings> =>
  new Promise((resolve) => {
    chrome.storage.local.get(SETTINGS_KEY, (result) => {
      const settings = result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined;
      resolve({ ...DEFAULT_SETTINGS, ...settings });
    });
  });

const App = () => {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [statistics, setStatistics] = useState<SkipStatistics>(DEFAULT_STATISTICS);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    void readSettings().then(setSettings);
    chrome.storage.local.get(STATISTICS_KEY, (result) => {
      setStatistics({ ...DEFAULT_STATISTICS, ...(result[STATISTICS_KEY] as Partial<SkipStatistics> | undefined) });
    });
  }, []);

  const updateSettings = (next: ExtensionSettings) => {
    setSettings(next);
    chrome.storage.local.set({ [SETTINGS_KEY]: next });
  };

  const clearLocalData = () => {
    chrome.storage.local.remove([SETTINGS_KEY, STATISTICS_KEY, 'universal-skip-intro-timestamps'], () => {
      setSettings(DEFAULT_SETTINGS);
      setStatistics(DEFAULT_STATISTICS);
      setNotice('Local settings, statistics, and timestamps cleared.');
    });
  };

  return (
    <main className="options-shell">
      <h1>Universal Skip Intro</h1>
      <p className="subtle">Local-first controls for safer skip detection.</p>

      <section className="settings-section">
        <label className="toggle-row">
          <span>Enable extension</span>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(event) => updateSettings({ ...settings, enabled: event.target.checked })}
          />
        </label>
        <label className="toggle-row">
          <span>Skip Intro</span>
          <input
            type="checkbox"
            checked={settings.skipIntro}
            onChange={(event) => updateSettings({ ...settings, skipIntro: event.target.checked })}
          />
        </label>
        <label className="toggle-row">
          <span>Skip Recap</span>
          <input
            type="checkbox"
            checked={settings.skipRecap}
            onChange={(event) => updateSettings({ ...settings, skipRecap: event.target.checked })}
          />
        </label>
        <label className="toggle-row">
          <span>Skip Credits</span>
          <input
            type="checkbox"
            checked={settings.skipCredits}
            onChange={(event) => updateSettings({ ...settings, skipCredits: event.target.checked })}
          />
        </label>
        <label className="toggle-row">
          <span>Ask before skipping</span>
          <input
            type="checkbox"
            checked={settings.askBeforeSkipping}
            onChange={(event) => updateSettings({ ...settings, askBeforeSkipping: event.target.checked })}
          />
        </label>
        <label className="toggle-row">
          <span>Debug mode</span>
          <input
            type="checkbox"
            checked={settings.debugMode}
            onChange={(event) => updateSettings({ ...settings, debugMode: event.target.checked })}
          />
        </label>

        <label className="slider-row">
          <span>Confidence threshold</span>
          <div className="inline-control">
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.01"
              value={settings.confidenceThreshold}
              onChange={(event) =>
                updateSettings({ ...settings, confidenceThreshold: Number(event.target.value) })
              }
            />
            <strong>{settings.confidenceThreshold.toFixed(2)}</strong>
          </div>
        </label>
      </section>

      <section className="data-section">
        <h2>Local data</h2>
        <p className="subtle">Skips recorded on this browser: {statistics.skippedCount}</p>
        <button type="button" className="danger-button" onClick={clearLocalData}>
          Clear local data
        </button>
        {notice && <p className="subtle">{notice}</p>}
      </section>
    </main>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
