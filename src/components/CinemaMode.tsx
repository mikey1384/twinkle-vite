import { useCallback, useEffect, useState } from 'react';
import { css } from '@emotion/css';

/*
 * Shared "cinema / theater mode" for video players.
 *
 * Cinema mode is NOT browser fullscreen: it stays inside the browser tab so
 * surrounding chrome (and e.g. a Zoom screen-share toolbar) remains reachable.
 * It works by restyling the existing player wrapper in place — the player node
 * (YouTube iframe / <video>) is never moved or remounted, so playback and any
 * watch/XP tracking continue uninterrupted.
 *
 * The toggle button itself lives in the Twinkle VideoControls bar; surfaces own
 * the `isCinema` state (to restyle their own wrapper) and pass toggle handlers
 * down to the player.
 *
 * Usage in a surface:
 *   const { isCinema, toggleCinema } = useCinemaMode();
 *   <div className={cx(yourBoxClass, isCinema && cinemaBoxClass)}>
 *     <VideoPlayer showCinema isCinema={isCinema} onToggleCinema={toggleCinema} ... />
 *   </div>
 */

const CINEMA_Z = 100_000_000;

export function useCinemaMode() {
  const [isCinema, setIsCinema] = useState(false);

  const toggleCinema = useCallback(() => setIsCinema((v) => !v), []);
  const exitCinema = useCallback(() => setIsCinema(false), []);

  useEffect(() => {
    if (!isCinema) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // Capture-phase + stop propagation so Escape exits theater mode without
        // also reaching (and closing) a modal that contains the player.
        event.preventDefault();
        event.stopImmediatePropagation();
        setIsCinema(false);
      }
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('cinema-mode-active');
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('cinema-mode-active');
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isCinema]);

  return { isCinema, toggleCinema, exitCinema };
}

// Promotes the existing wrapper into a full-viewport theater stage. The
// app-shell header is hidden via the `cinema-mode-active` body class (it sits in
// a higher stacking context than the player, so hiding it is how we cover the
// whole tab without a portal — a portal would remount/reload the iframe).
// !important is required to override the inline padding/position the surfaces set.
export const cinemaBoxClass = css`
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: auto !important;
  height: auto !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 !important;
  transform: none !important;
  border-radius: 0 !important;
  overflow: hidden;
  background: #000;
  z-index: ${CINEMA_Z + 1} !important;
  animation: cinemaPop 0.18s ease;
  @keyframes cinemaPop {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;
