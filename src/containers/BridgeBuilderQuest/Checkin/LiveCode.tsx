import React, { useEffect, useRef, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';
import {
  soundRunning,
  soundSupported,
  startChirping,
  unlockSound
} from './soundCode';

export interface LiveCodeData {
  token: string;
  url: string;
  expiresAt: number;
  refreshIn: number;
  // the short code this phone chirps for the sound check (soundCode.ts)
  sound?: string;
}

const drain = keyframes`
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
`;

// A check-in QR code that swaps itself for a fresh one every few seconds
// (the server's own timing), so a screenshot sent elsewhere is soon stale.
// `load` asks the server for the next code: a member's, a teacher's grown-up
// code, or a parent's (no account). While the code is up the phone also
// chirps its sound code, so a friend's phone with no shared Wi-Fi can still
// show they are in one room (the proximity ladder's sound rung).
export const SOUND_LABELS_EN = {
  on: 'Sound check on · keep your volume up',
  tap: 'Tap to turn on the sound check',
  off: 'Turn off'
};

export default function LiveCode({
  load,
  onLoaded,
  size = 220,
  chirp = true,
  soundLabels = SOUND_LABELS_EN
}: {
  load: () => Promise<LiveCodeData>;
  onLoaded?: (data: any) => void;
  size?: number;
  chirp?: boolean;
  // the parent page is Korean first
  soundLabels?: { on: string; tap: string; off: string };
}) {
  const [code, setCode] = useState<LiveCodeData | null>(null);
  const [error, setError] = useState('');
  const soundRef = useRef('');
  soundRef.current = code?.sound || '';
  const canChirp = chirp && soundSupported();
  const [soundOn, setSoundOn] = useState(() => canChirp && soundRunning());

  useEffect(() => {
    if (!canChirp || !soundOn) return;
    // quiet while the tab is hidden (no code is shown then either)
    let stop: (() => void) | null = null;
    const sync = () => {
      if (document.hidden) {
        stop?.();
        stop = null;
      } else if (!stop) {
        stop = startChirping(() => soundRef.current);
      }
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      stop?.();
    };
  }, [canChirp, soundOn]);
  const loadRef = useRef(load);
  loadRef.current = load;
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    let timer = 0;
    let stopped = false;
    // a hidden tab asks for no codes; showing it again gets a fresh one
    let paused = false;
    document.addEventListener('visibilitychange', handleVisibility);
    next();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };

    function handleVisibility() {
      if (document.hidden || !paused) return;
      paused = false;
      next();
    }

    async function next() {
      if (document.hidden) {
        paused = true;
        return;
      }
      try {
        const data = await loadRef.current();
        if (stopped) return;
        setCode(data);
        setError('');
        onLoadedRef.current?.(data);
        timer = window.setTimeout(
          next,
          Math.max(5, Number(data.refreshIn) || 15) * 1000
        );
      } catch (err: any) {
        if (stopped) return;
        setError(err?.message || 'Could not make a code. Trying again…');
        timer = window.setTimeout(next, 5000);
      }
    }
  }, []);

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.8rem;
      `}
    >
      <div
        className={css`
          padding: 1.4rem;
          border-radius: 1.6rem;
          background: #fff;
          border: 1px solid var(--ui-border);
          box-shadow: 0 0.4rem 1.6rem rgba(0, 0, 0, 0.08);
          width: calc(${size + 28} * var(--px));
          height: calc(${size + 28} * var(--px));
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        {code ? (
          <QRCodeSVG
            value={code.url}
            size={size}
            level="M"
            // drawn in design pixels: bigger on big screens (styles.css --px)
            style={{
              width: `calc(${size} * var(--px))`,
              height: `calc(${size} * var(--px))`
            }}
          />
        ) : (
          <Loading />
        )}
      </div>
      {code && (
        <div
          aria-hidden
          className={css`
            width: calc(${size} * var(--px));
            height: 0.4rem;
            border-radius: 1rem;
            background: ${Color.logoBlue(0.15)};
            overflow: hidden;
          `}
        >
          <div
            key={code.token}
            className={css`
              width: 100%;
              height: 100%;
              background: ${Color.logoBlue()};
              transform-origin: left center;
              animation: ${drain} ${Math.max(5, Number(code.refreshIn) || 15)}s
                linear forwards;
            `}
          />
        </div>
      )}
      {error && (
        <div style={{ fontSize: '1.2rem', color: Color.darkGray() }}>
          {error}
        </div>
      )}
      {canChirp &&
        code &&
        (soundOn ? (
          <div
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.6rem;
              font-size: 1.25rem;
              color: ${Color.darkGray()};
            `}
          >
            <Icon icon="volume-high" style={{ color: Color.logoBlue() }} />
            {soundLabels.on}
            <button
              type="button"
              onClick={() => setSoundOn(false)}
              className={css`
                min-height: 4.4rem;
                padding: 0 0.8rem;
                border: 0;
                background: none;
                font-size: 1.25rem;
                font-weight: bold;
                color: ${Color.logoBlue()};
                cursor: pointer;
              `}
            >
              {soundLabels.off}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              unlockSound();
              setSoundOn(true);
            }}
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.6rem;
              min-height: 4.4rem;
              padding: 0 1.4rem;
              border-radius: 2.2rem;
              border: 1px solid ${Color.logoBlue(0.4)};
              background: ${Color.logoBlue(0.08)};
              color: ${Color.logoBlue()};
              font-size: 1.35rem;
              font-weight: bold;
              cursor: pointer;
            `}
          >
            <Icon icon="volume-high" />
            {soundLabels.tap}
          </button>
        ))}
    </div>
  );
}
