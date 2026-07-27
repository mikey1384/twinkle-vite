import { useCallback, useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useViewContext } from '~/contexts';
import { APP_SHELL_HEADER_OFFSET_STYLE } from '~/constants/appShell';
import { CinemaLevel, storeCinemaLevel } from '~/constants/cinema';

export type { CinemaLevel };

/*
 * Shared "cinema / theater mode" for video players.
 *
 * Cinema mode is NOT browser fullscreen: it stays inside the browser tab so
 * surrounding chrome (and e.g. a Zoom screen-share toolbar) remains reachable.
 * It works by restyling the existing player wrapper in place — the player node
 * (YouTube iframe / <video>) is never moved or remounted, so playback and any
 * watch/XP tracking continue uninterrupted.
 *
 * Two tiers, mirroring the Build runtime's header collapse ladder:
 *   1 (stage)  the player fills everything BELOW the global nav; the nav stays
 *              visible and usable.
 *   2 (full)   the global nav is hidden too and the player owns the whole tab.
 * Escape always drops straight back to 0.
 *
 * Tier 1 exists so the viewer can keep navigating, so a watch surface passes
 * `remember` and that tier lives in the View context (mirrored to localStorage):
 * leaving the page and coming back — or reloading — lands in the same layout.
 * Tier 2 is deliberately NOT remembered; it hides the global nav, so it dies
 * with the mount and a return lands at tier 1.
 * Casual embeds (chat, comments, feed) keep the tier component-local instead.
 *
 * The toggle buttons live in the Twinkle VideoControls bar (file video) or on
 * the YouTube overlay; surfaces own the level (to restyle their own wrapper)
 * and pass it plus the setter down to the player.
 *
 * Usage in a surface:
 *   const { cinemaLevel, isCinema, setCinemaLevel } = useCinemaMode({
 *     remember: true,
 *     enabled: canCinema
 *   });
 *   <div className={cx(yourBoxClass, isCinema && cinemaBoxClass)}>
 *     <VideoPlayer
 *       showCinema
 *       cinemaLevel={cinemaLevel}
 *       onSetCinemaLevel={setCinemaLevel}
 *       ...
 *     />
 *   </div>
 */

const CINEMA_Z = 100_000_000;
// How far down the stage starts. Set on the root element by the hook (instead
// of swapping the wrapper's class) so moving between tiers animates the same
// element rather than restarting its entry animation.
const CINEMA_STAGE_TOP_VAR = '--cinema-stage-top';

export function useCinemaMode({
  remember = false,
  enabled = true
}: {
  // keep the chosen tier in shared state so it outlives this component
  remember?: boolean;
  // false while this surface can't host the stage (mini player, video not
  // started yet). The remembered tier is NOT forgotten — the player just
  // renders inline until the surface can host it again.
  enabled?: boolean;
} = {}) {
  const rememberedLevel = useViewContext((v) => v.state.videoCinemaLevel);
  const onSetVideoCinemaLevel = useViewContext(
    (v) => v.actions.onSetVideoCinemaLevel
  );
  const [localLevel, setLocalLevel] = useState<CinemaLevel>(0);
  // Only the navigable tier is remembered. Tier 2 hides the global nav, so it
  // stays local to this mount: leaving the page (or reloading) always lands
  // back at tier 1 at most, never in a chrome-less player nobody asked for.
  const [fullScreen, setFullScreen] = useState(false);
  const chosenLevel: CinemaLevel = remember
    ? fullScreen
      ? 2
      : rememberedLevel
    : localLevel;
  const cinemaLevel: CinemaLevel = enabled ? chosenLevel : 0;
  const isCinema = cinemaLevel > 0;

  // memoized because it is a prop of the memoized VideoPlayer — a fresh
  // identity every render would re-render the whole player subtree
  const setCinemaLevel = useCallback(
    (level: CinemaLevel) => {
      if (remember) {
        setFullScreen(level === 2);
        // tier 2 sits on top of tier 1, so that is what gets remembered.
        // localStorage is the source of truth across reloads; write it first,
        // then update shared state from the same value.
        const levelToRemember = level === 0 ? 0 : 1;
        storeCinemaLevel(levelToRemember);
        onSetVideoCinemaLevel(levelToRemember);
      } else {
        setLocalLevel(level);
      }
    },
    // onSetVideoCinemaLevel is a stable context action — excluded per repo rule
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [remember]
  );

  useEffect(() => {
    if (!cinemaLevel) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // Capture-phase + stop propagation so Escape exits theater mode without
        // also reaching (and closing) a modal that contains the player.
        event.preventDefault();
        event.stopImmediatePropagation();
        setCinemaLevel(0);
      }
    }
    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root.style.setProperty(
      CINEMA_STAGE_TOP_VAR,
      cinemaLevel === 2 ? '0px' : APP_SHELL_HEADER_OFFSET_STYLE
    );
    if (cinemaLevel === 2) {
      document.body.classList.add('cinema-mode-full');
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      root.style.removeProperty(CINEMA_STAGE_TOP_VAR);
      document.body.classList.remove('cinema-mode-full');
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [cinemaLevel, setCinemaLevel]);

  return { cinemaLevel, isCinema, setCinemaLevel };
}

// The buttons offered at each tier, so the YouTube overlay and the custom
// control bar present the same ladder without duplicating the conditionals.
export function getCinemaToggles(level: CinemaLevel): {
  key: string;
  icon: string;
  label: string;
  title: string;
  nextLevel: CinemaLevel;
}[] {
  if (level === 0) {
    return [
      {
        key: 'enter',
        icon: 'film',
        label: 'Theater mode',
        title: 'Theater mode',
        nextLevel: 1
      }
    ];
  }
  const exitToggle = {
    key: 'exit',
    icon: 'compress',
    label: 'Exit theater mode',
    title: 'Exit theater mode (Esc)',
    nextLevel: 0 as CinemaLevel
  };
  return level === 1
    ? [
        {
          key: 'grow',
          icon: 'angles-up',
          label: 'Hide the top bar too',
          title: 'Hide the top bar too (full screen)',
          nextLevel: 2 as CinemaLevel
        },
        exitToggle
      ]
    : [
        {
          key: 'shrink',
          icon: 'angles-down',
          label: 'Show the top bar',
          title: 'Show the top bar',
          nextLevel: 1 as CinemaLevel
        },
        exitToggle
      ];
}

// Promotes the existing wrapper into a theater stage. Tier 1 stops below the
// app-shell header; tier 2 hides that header via the `cinema-mode-full` body
// class (it sits in a higher stacking context than the player, so hiding it is
// how we cover the whole tab without a portal — a portal would remount/reload
// the iframe). !important is required to override the inline
// padding/position the surfaces set.
export const cinemaBoxClass = css`
  position: fixed !important;
  top: var(${CINEMA_STAGE_TOP_VAR}, 0px) !important;
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
  transition: top 0.18s ease;
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
