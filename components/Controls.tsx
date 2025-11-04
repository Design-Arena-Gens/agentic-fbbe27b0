"use client";
import React from 'react';
import styles from '@/app/page.module.css';
import type { GlobalSettings } from '@/app/page';

export function Controls({ listening, onToggle, settings, onSettingsChange }: {
  listening: boolean;
  onToggle: () => void;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
}) {
  return (
    <div className={styles.row}>
      <button className={styles.button} onClick={onToggle}>
        {listening ? 'Stop' : 'Start'} Listening
      </button>
      <div className={styles.row}>
        <label className={styles.label}>Sign language</label>
        <select
          className={styles.select}
          value={settings.signLang}
          onChange={(e) => onSettingsChange({ ...settings, signLang: e.target.value as any })}
        >
          <option value="ASL">ASL</option>
          <option value="BSL">BSL</option>
          <option value="ISL">ISL</option>
        </select>
      </div>
      <div className={styles.row}>
        <label className={styles.label}>Safety</label>
        <select
          className={styles.select}
          value={settings.safetyMode ? 'on' : 'off'}
          onChange={(e) => onSettingsChange({ ...settings, safetyMode: e.target.value === 'on' })}
        >
          <option value="on">on</option>
          <option value="off">off</option>
        </select>
      </div>
    </div>
  );
}
