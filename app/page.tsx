"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';
import { startSpeechRecognition, stopSpeechRecognition, type RecognitionEvent } from '@/lib/speech';
import { processUtteranceStream, type SignFrame } from '@/lib/pipeline';
import { SafetyGate, applySafetyMasking, type SafetyEvent } from '@/lib/safety';
import { AvatarCanvas, type AvatarCanvasHandle } from '@/components/AvatarCanvas';
import { Controls } from '@/components/Controls';
import { Captions } from '@/components/Captions';

export type GlobalSettings = {
  signLang: 'ASL' | 'BSL' | 'ISL';
  avatarStyle: 'anime';
  safetyMode: boolean;
  latency: 'low';
};

export default function HomePage() {
  const [listening, setListening] = useState(false);
  const [captions, setCaptions] = useState<string>('');
  const [frames, setFrames] = useState<SignFrame[]>([]);
  const [safetyEvents, setSafetyEvents] = useState<SafetyEvent[]>([]);
  const [uncertain, setUncertain] = useState(false);

  const [settings, setSettings] = useState<GlobalSettings>({
    signLang: 'ASL',
    avatarStyle: 'anime',
    safetyMode: true,
    latency: 'low',
  });

  const avatarRef = useRef<AvatarCanvasHandle>(null);
  const safetyGate = useMemo(() => new SafetyGate(), []);

  useEffect(() => {
    let stop: (() => void) | null = null;
    if (listening) {
      stop = startSpeechRecognition({
        onResult: (evt: RecognitionEvent) => {
          const original = evt.text;
          const masked = settings.safetyMode ? applySafetyMasking(original) : original;
          const gate = safetyGate.evaluate(masked);
          if (gate.events.length > 0) setSafetyEvents(gate.events);
          if (gate.block) {
            setCaptions('[blocked for safety]');
            setFrames([]);
            avatarRef.current?.clear();
            return;
          }

          setCaptions(masked);

          const { frames: nextFrames, uncertain: isUncertain } = processUtteranceStream(masked, {
            signLang: settings.signLang,
          });
          setUncertain(isUncertain);
          setFrames(nextFrames);
          avatarRef.current?.play(nextFrames, { uncertain: isUncertain });
        },
        onEnd: () => setListening(false),
        interim: true,
      });
    }
    return () => {
      if (stop) stop();
    };
  }, [listening, settings, safetyGate]);

  const onToggle = () => {
    if (listening) {
      stopSpeechRecognition();
      setListening(false);
    } else {
      setSafetyEvents([]);
      setCaptions('');
      setFrames([]);
      avatarRef.current?.clear();
      setListening(true);
    }
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Speech ? Sign Avatar</h1>
      <Controls
        listening={listening}
        onToggle={onToggle}
        settings={settings}
        onSettingsChange={setSettings}
      />
      <section className={styles.stage}>
        <AvatarCanvas ref={avatarRef} style={settings.avatarStyle} />
        <Captions text={captions} uncertain={uncertain} />
      </section>
      {settings.safetyMode && safetyEvents.length > 0 && (
        <section className={styles.safety}>
          <h3>Safety notices</h3>
          <ul>
            {safetyEvents.map((e, i) => (
              <li key={i}>{e.message}</li>
            ))}
          </ul>
        </section>
      )}
      <footer className={styles.footer}>
        <span>Sign language: {settings.signLang} ? Avatar: anime ? Safety: {settings.safetyMode ? 'on' : 'off'}</span>
      </footer>
    </main>
  );
}
