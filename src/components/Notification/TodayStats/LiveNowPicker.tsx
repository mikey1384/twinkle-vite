import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useOutsideClick } from '~/helpers/hooks';
import { lockBodyScroll } from '~/helpers/bodyScrollLock';
import {
  JOIN_VERB_LABELS,
  joinableBadge,
  primaryJoinAction,
  type JoinVerb,
  type PrimaryJoinAction
} from '~/helpers/socialWalkups';
import {
  LIVE_NOW_PICKER_TITLES,
  type LiveNowApp,
  type LiveNowMember
} from '~/helpers/liveNow';

// The picker's people as presence has them now: id -> member, or null once
// they are no longer in the app.
export type LiveNowPickerLiveMembers = Record<number, LiveNowMember | null>;

// "Who do you want to watch?": when two or more people in an app offer the
// row's verb, the row's button opens this list instead of picking for the
// member (Mikey, 11-25). A bottom sheet on phones, a popover next to the
// row's button elsewhere. Lines keep the order they opened with; each one
// follows that person's live state (its label and verb update, and it is
// disabled once they can no longer be joined), so nobody is walked up to
// from a stale line. The server still has the last word (useWalkUp).

export type LiveNowPickerDismiss =
  | 'escape'
  | 'outside'
  | 'close'
  // another row's picker took its place / the card went away while open
  | 'replaced'
  | 'unmount';

const EXIT_MS = 160;
const POPOVER_GAP = 8;
const VIEWPORT_MARGIN = 12;

const layerCls = css`
  position: fixed;
  inset: 0;
  z-index: 100000000;
  pointer-events: none;
  .live-picker-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.38);
    pointer-events: auto;
    animation: livePickerFade 0.2s ease-out;
  }
  &[data-closing] .live-picker-backdrop {
    opacity: 0;
    transition: opacity ${EXIT_MS}ms ease-in;
  }
  @keyframes livePickerFade {
    from {
      opacity: 0;
    }
  }
  @keyframes livePickerSheetIn {
    from {
      transform: translateY(100%);
    }
  }
  @keyframes livePickerPopIn {
    from {
      opacity: 0;
      transform: translateY(-0.4rem) scale(0.97);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .live-picker-backdrop,
    .live-picker-panel {
      animation: none !important;
      transition: none !important;
    }
  }
`;

const panelCls = css`
  position: absolute;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  background: #fff;
  color: ${Color.darkerGray()};
  outline: none;
  &[data-mode='popover'] {
    width: min(34rem, calc(100vw - ${VIEWPORT_MARGIN * 2}px));
    max-height: min(44rem, calc(100vh - ${VIEWPORT_MARGIN * 2}px));
    border: 1px solid var(--ui-border);
    border-radius: 1.4rem;
    box-shadow:
      0 24px 48px -22px rgba(15, 23, 42, 0.34),
      0 2px 6px rgba(15, 23, 42, 0.06);
    transform-origin: top right;
    animation: livePickerPopIn 0.18s ease-out;
    transition:
      opacity ${EXIT_MS}ms ease-in,
      transform ${EXIT_MS}ms ease-in;
  }
  &[data-mode='popover'][data-above] {
    transform-origin: bottom right;
  }
  &[data-mode='popover'][data-closing] {
    opacity: 0;
    transform: scale(0.97);
  }
  &[data-mode='sheet'] {
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 72vh;
    margin: 0 auto;
    max-width: 48rem;
    border-radius: 1.8rem 1.8rem 0 0;
    box-shadow: 0 -12px 40px -16px rgba(15, 23, 42, 0.35);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    animation: livePickerSheetIn 0.26s cubic-bezier(0.2, 0.8, 0.2, 1);
    transition: transform ${EXIT_MS}ms ease-in;
  }
  &[data-mode='sheet'][data-closing] {
    transform: translateY(100%);
  }
  .live-picker-grip {
    align-self: center;
    width: 3.6rem;
    height: 0.45rem;
    margin-top: 0.8rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.14);
  }
  .live-picker-head {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    padding: 1.2rem 1rem 0.6rem 1.6rem;
  }
  &[data-mode='sheet'] .live-picker-head {
    padding-top: 0.8rem;
  }
  .live-picker-titles {
    flex: 1 1 auto;
    min-width: 0;
  }
  .live-picker-title {
    margin: 0;
    font-size: 1.6rem;
    line-height: 1.3;
    font-weight: 800;
    color: ${Color.darkerGray()};
  }
  .live-picker-app {
    margin-top: 0.15rem;
    font-size: 1.2rem;
    font-weight: 600;
    color: ${Color.gray()};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .live-picker-close {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 3.2rem;
    height: 3.2rem;
    margin: -0.4rem 0 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: ${Color.gray()};
    font-size: 1.5rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .live-picker-close:hover {
    background: rgba(15, 23, 42, 0.06);
  }
  .live-picker-close:focus-visible {
    outline: 2px solid ${Color.logoBlue()};
    outline-offset: 1px;
  }
  .live-picker-list {
    margin: 0;
    padding: 0.2rem 0.6rem 0.8rem;
    list-style: none;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .live-picker-line {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-height: 5.4rem;
    padding: 0.6rem 0.8rem 0.6rem 1rem;
    border-radius: 1.1rem;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      opacity 0.2s ease;
  }
  .live-picker-line:hover {
    background: rgba(65, 140, 235, 0.07);
  }
  .live-picker-line[data-gone] {
    cursor: default;
    opacity: 0.55;
  }
  .live-picker-line[data-gone]:hover {
    background: transparent;
  }
  .live-picker-face {
    position: relative;
    flex: 0 0 auto;
    width: 3.8rem;
    height: 3.8rem;
  }
  .live-picker-face::after {
    content: '';
    position: absolute;
    right: -0.05rem;
    bottom: -0.05rem;
    width: 1.05rem;
    height: 1.05rem;
    border-radius: 50%;
    background: #2fbf71;
    box-shadow: 0 0 0 2px #fff;
  }
  .live-picker-face[data-state='busy-watchable']::after {
    background: #e8a33d;
  }
  .live-picker-line[data-gone] .live-picker-face::after {
    background: #b8c0cc;
  }
  .live-picker-who {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .live-picker-name {
    font-size: 1.45rem;
    line-height: 1.3;
    font-weight: 700;
    color: ${Color.darkerGray()};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .live-picker-label {
    font-size: 1.2rem;
    line-height: 1.35;
    font-weight: 600;
    color: #1f6a44;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .live-picker-label[data-state='busy-watchable'] {
    color: #7a5312;
  }
  .live-picker-line[data-gone] .live-picker-label {
    color: ${Color.gray()};
  }
  .live-picker-line > button {
    flex: 0 0 auto;
    min-width: 6.4rem;
  }
  @media (max-width: 359px) {
    .live-picker-line {
      gap: 0.8rem;
      padding-left: 0.6rem;
      padding-right: 0.4rem;
    }
    .live-picker-face {
      width: 3.4rem;
      height: 3.4rem;
    }
    .live-picker-line > button {
      min-width: 5.6rem;
      padding-left: 0.8rem;
      padding-right: 0.8rem;
    }
  }
`;

function isPhone() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(`(max-width: ${mobileMaxWidth})`).matches
  );
}

function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * A line's live state: the member as they are now and what they can be
 * joined for, or null once they can't (left, blocked, nothing to tap). Read
 * from their own presence, so the 10-person cap never marks anyone gone.
 */
export function liveChoiceFor(
  member: LiveNowMember,
  liveMembers: LiveNowPickerLiveMembers
): { member: LiveNowMember; action: PrimaryJoinAction } | null {
  const live = liveMembers[member.id];
  const action = live ? primaryJoinAction(live.joinable) : null;
  return live && action ? { member: live, action } : null;
}

export default function LiveNowPicker({
  app,
  verb,
  members,
  liveMembers,
  anchor,
  insideRefs,
  buttonColor,
  onChoose,
  onDismiss,
  onClosed
}: {
  app: LiveNowApp;
  verb: JoinVerb;
  // the lines, in the order they opened with
  members: LiveNowMember[];
  // the listed people as they are right now
  liveMembers: LiveNowPickerLiveMembers;
  // the row's button: the popover sits next to it
  anchor: HTMLElement | null;
  // taps here are not "outside" (the row, which toggles the picker itself)
  insideRefs: React.RefObject<HTMLElement | null>[];
  buttonColor: string;
  onChoose: (
    member: LiveNowMember,
    action: PrimaryJoinAction,
    position: number
  ) => void;
  // the member dismissed it (counted now) ...
  onDismiss: (how: LiveNowPickerDismiss) => void;
  // ... and its exit animation has finished
  onClosed: () => void;
}) {
  const titleId = useId();
  const [mode] = useState<'sheet' | 'popover'>(() =>
    isPhone() ? 'sheet' : 'popover'
  );
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    above: boolean;
  } | null>(null);
  const [portalTarget] = useState<HTMLElement | null>(() =>
    typeof document === 'undefined'
      ? null
      : document.getElementById('outer-layer') || document.body
  );

  const exitTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(exitTimer.current), []);
  const dismiss = useCallback(
    (how: LiveNowPickerDismiss) => {
      if (closing) return;
      if (how !== 'outside') anchor?.focus?.({ preventScroll: true });
      onDismiss(how);
      if (reducedMotion()) return onClosed();
      setClosing(true);
      exitTimer.current = window.setTimeout(onClosed, EXIT_MS);
    },
    [anchor, closing, onClosed, onDismiss]
  );

  // Phone sheet: the page behind it does not scroll. The body lock is the
  // one Modal uses; iPhone Safari can still pan the page on a touch drag, so
  // drags are stopped too, except inside the list while it can scroll.
  const layerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (mode !== 'sheet' || typeof document === 'undefined') return;
    const release = lockBodyScroll(document.body);
    const layer = layerRef.current;
    function handleTouchMove(event: TouchEvent) {
      const list = (event.target as Element | null)?.closest?.(
        '.live-picker-list'
      ) as HTMLElement | null;
      if (list && list.scrollHeight > list.clientHeight) return;
      event.preventDefault();
    }
    layer?.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      layer?.removeEventListener('touchmove', handleTouchMove);
      release();
    };
  }, [mode]);

  // Popover: next to the row's button, below it when there is room, and
  // following it if the page scrolls.
  const place = useCallback(() => {
    if (mode !== 'popover' || !anchor || !panelRef.current) return;
    const rect = anchor.getBoundingClientRect();
    const width = panelRef.current.offsetWidth;
    const height = panelRef.current.offsetHeight;
    const roomBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const above = roomBelow < height + POPOVER_GAP && rect.top > roomBelow;
    const top = above
      ? Math.max(VIEWPORT_MARGIN, rect.top - POPOVER_GAP - height)
      : Math.min(
          rect.bottom + POPOVER_GAP,
          window.innerHeight - VIEWPORT_MARGIN - height
        );
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.right - width),
      window.innerWidth - VIEWPORT_MARGIN - width
    );
    setPosition((previous) =>
      previous &&
      previous.top === top &&
      previous.left === left &&
      previous.above === above
        ? previous
        : { top, left, above }
    );
  }, [anchor, mode]);
  useLayoutEffect(place, [place, members.length]);
  useEffect(() => {
    if (mode !== 'popover') return;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [mode, place]);

  // The sheet has its own backdrop (a tap there closes it without reaching
  // what lies under it); the popover closes on a tap anywhere else.
  const [outsideRefs] = useState(() => [panelRef, ...insideRefs]);
  useOutsideClick(outsideRefs, () => dismiss('outside'), {
    enabled: mode === 'popover' && !closing
  });

  // Focus goes into the list (the first line that can be chosen), so the
  // keyboard and screen readers land where the choice is. A popover waits
  // until it is placed (it is hidden until then, and hidden can't focus).
  const focusedRef = useRef(false);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || focusedRef.current) return;
    if (mode === 'popover' && !position) return;
    focusedRef.current = true;
    const first = panel.querySelector<HTMLButtonElement>(
      '.live-picker-line > button:not([disabled])'
    );
    (first || panel).focus({ preventScroll: true });
  }, [mode, position]);

  if (!portalTarget) return null;

  const lines = members.map((member) => ({
    member,
    live: liveChoiceFor(member, liveMembers)
  }));

  return createPortal(
    <div
      ref={layerRef}
      className={layerCls}
      data-closing={closing || undefined}
      // Clicks here must not reach the Live now row (React bubbles through
      // portals), which would walk up or toggle the picker again. Pointer
      // events still bubble, so the card stays frozen after a touch here.
      onClick={(event) => event.stopPropagation()}
    >
      {mode === 'sheet' ? (
        <div
          className="live-picker-backdrop"
          aria-hidden
          onClick={() => dismiss('outside')}
        />
      ) : null}
      <div
        ref={panelRef}
        className={`${panelCls} live-picker-panel`}
        data-mode={mode}
        data-above={position?.above || undefined}
        data-closing={closing || undefined}
        data-live-now-picker
        role="dialog"
        aria-modal={mode === 'sheet' ? true : undefined}
        aria-labelledby={titleId}
        tabIndex={-1}
        style={
          mode === 'popover'
            ? {
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                visibility: position ? undefined : 'hidden'
              }
            : undefined
        }
        onKeyDown={handleKeyDown}
      >
        {mode === 'sheet' ? (
          <span className="live-picker-grip" aria-hidden />
        ) : null}
        <div className="live-picker-head">
          <div className="live-picker-titles">
            <h2 id={titleId} className="live-picker-title">
              {LIVE_NOW_PICKER_TITLES[verb]}
            </h2>
            <div className="live-picker-app">{app.title}</div>
          </div>
          <button
            type="button"
            className="live-picker-close"
            aria-label="Close"
            onClick={() => dismiss('close')}
          >
            <Icon icon="times" />
          </button>
        </div>
        <ul className="live-picker-list">
          {lines.map(({ member, live }, index) => {
            const shown = live?.member || member;
            const label = live ? JOIN_VERB_LABELS[live.action.verb] : null;
            return (
              <li
                key={member.id}
                className="live-picker-line"
                data-gone={live ? undefined : true}
                onClick={() => choose(index)}
              >
                <span
                  className="live-picker-face"
                  data-state={shown.joinable?.state}
                  aria-hidden
                >
                  <ProfilePic
                    userId={member.id}
                    profilePicUrl={shown.profilePicUrl}
                    activityBadgeShown={false}
                    style={{ width: '100%', height: '100%' }}
                  />
                </span>
                <span className="live-picker-who">
                  <span className="live-picker-name">{shown.username}</span>
                  <span
                    className="live-picker-label"
                    data-state={shown.joinable?.state}
                  >
                    {live && shown.joinable
                      ? joinableBadge(shown.joinable)
                      : 'Not available right now'}
                  </span>
                </span>
                <Button
                  color={buttonColor}
                  variant="soft"
                  tone="raised"
                  size="sm"
                  uppercase={false}
                  disabled={!live}
                  // the whole line is already faded
                  disabledOpacity={1}
                  aria-label={
                    label ? `${label}: ${shown.username}` : `${shown.username}: not available`
                  }
                  onClick={(event: React.MouseEvent) => {
                    event?.stopPropagation?.();
                    choose(index);
                  }}
                >
                  {label || JOIN_VERB_LABELS[verb]}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    portalTarget
  );

  function choose(index: number) {
    if (closing) return;
    const live = lines[index]?.live;
    // A line whose person can no longer be joined does nothing.
    if (!live) return;
    onChoose(live.member, live.action, index + 1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      dismiss('escape');
      return;
    }
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLButtonElement>('button:not([disabled])')
    );
    if (!focusable.length) return;
    const at = focusable.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'Tab') {
      // Focus stays in the picker while it is open.
      event.preventDefault();
      const step = event.shiftKey ? -1 : 1;
      const next =
        at < 0
          ? event.shiftKey
            ? focusable.length - 1
            : 0
          : (at + step + focusable.length) % focusable.length;
      focusable[next].focus();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const actions = Array.from(
        panel.querySelectorAll<HTMLButtonElement>(
          '.live-picker-line > button:not([disabled])'
        )
      );
      if (!actions.length) return;
      event.preventDefault();
      const current = actions.indexOf(
        document.activeElement as HTMLButtonElement
      );
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const next =
        current < 0
          ? step > 0
            ? 0
            : actions.length - 1
          : Math.min(actions.length - 1, Math.max(0, current + step));
      actions[next].focus();
    }
  }
}
