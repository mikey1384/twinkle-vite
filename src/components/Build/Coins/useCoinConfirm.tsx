import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { coinConfirmText, type CoinConfirmRequest } from './coinConfirmText';
import {
  COIN_CONFIRM_ARM_MS,
  createCoinConfirmArming,
  type CoinConfirmArming,
  type CoinConfirmState
} from './coinConfirmArming';

// The website's Coins confirmation (Twinkle.coins). It lives outside the app
// frame, so app code can neither draw, skip nor press it. While it is open:
// - the app frame is inert (no clicks, keys or focus reach it) and any
//   fullscreen or pointer lock the app took is ended, so the box is seen; if
//   the app takes fullscreen back, the box counts as Cancel (round-2 N5);
// - Buy turns on only after the box has really been visible for a moment
//   and, with a mouse, after the website itself saw the mouse move over the
//   box (never while a game frame holds pointer lock: N4);
// - then a click or tap that starts on Buy, Enter on Buy (Space never), or an
//   assistive-technology press on a focused Buy confirms. Anything before Buy
//   turns on does nothing and costs nothing (round-3 P1/P2); the box opens
//   with focus on Cancel (N9).
// The rules live in coinConfirmArming.ts. Buy stays focusable and announced
// while it waits (aria-disabled, not disabled), so Tab and screen readers
// reach it (round-3 P1/P7); its click handler ignores every press the rules
// refuse. The hint keeps the space of its longest text, so Buy never moves
// when it turns on (round-3 P3). Visibility hit-tests a wrapper around Buy
// (round-2 N1).
export { COIN_CONFIRM_ARM_MS };
const TICK_MS = 100;
// An app that keeps the page fullscreen this long after the box opened
// (exit refused) gets Cancel instead of a box nobody can see.
const FULLSCREEN_GIVE_UP_MS = 2000;

const linesClass = css`
  display: grid;
  gap: 1rem;
  text-align: left;
  width: 100%;
  font-size: 1.6rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
  strong {
    font-weight: 700;
  }
`;
const appNoteClass = css`
  margin: 0;
  font-size: 1.3rem;
  color: ${Color.gray()};
  overflow-wrap: anywhere;
`;
// The builders a purchase pays, one line each (review-r2 L6). A long list
// scrolls inside its own short box, so the price and Buy stay in view and
// the box opens at its top.
const builderListClass = css`
  display: grid;
  gap: 0.5rem;
  > p {
    margin: 0;
  }
  ul {
    margin: 0;
    padding: 0.6rem 0.8rem 0.6rem 2.2rem;
    font-size: 1.4rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
    border: 1px solid ${Color.borderGray()};
    border-radius: 8px;
  }
  ul.long {
    max-height: 12rem;
    overflow-y: auto;
  }
`;
const LONG_BUILDER_LIST = 5;
// Every hint text sits in the same grid cell; the hidden ones only hold the
// space, so the box keeps one height whatever the hint says (P3).
const hintBoxClass = css`
  display: grid;
  > * {
    grid-area: 1 / 1;
    margin: 0;
    font-size: 1.3rem;
    color: ${Color.gray()};
  }
`;
const hintSizerClass = css`
  visibility: hidden;
`;
const paleClass = css`
  opacity: 0.5;
  cursor: default;
`;
const HINTS = {
  hidden: 'Buy turns on once this box is fully on screen.',
  move: 'Move your mouse over this box to turn on Buy.',
  wait: 'Buy turns on in a moment.',
  click: 'Click Buy to confirm.',
  tap: 'Tap Buy to confirm.',
  keyWait: 'Buy turns on in a moment. Then press Enter on it.',
  keyReach: 'Press Tab to reach Buy, then Enter.',
  keyEnter: 'Press Enter to buy. Space does not buy.'
} as const;
type HintKey = keyof typeof HINTS;
function hintFor(state: CoinConfirmState): HintKey {
  if (!state.visible) return 'hidden';
  if (state.mode === 'keyboard')
    return !state.armed ? 'keyWait' : state.buyFocused ? 'keyEnter' : 'keyReach';
  if (state.mode === 'touch') return state.armed ? 'tap' : 'wait';
  if (state.armed) return 'click';
  return state.moved ? 'wait' : 'move';
}
// Never loses pointer events, so it can be hit-tested while Buy is disabled.
const buyWrapClass = css`
  display: inline-flex;
`;

let nextSessionId = 0;

function touchPrimaryDevice() {
  try {
    return Boolean(
      window.matchMedia?.('(pointer: coarse)').matches &&
        !window.matchMedia?.('(hover: hover)').matches
    );
  } catch {
    return false;
  }
}

export default function useCoinConfirm({
  frameRootRef
}: {
  // The element holding the app's iframe; inert while the box is open.
  frameRootRef?: React.RefObject<HTMLElement | null>;
} = {}) {
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);
  const [session, setSession] = useState<{
    id: number;
    request: CoinConfirmRequest;
  } | null>(null);
  const [armed, setArmed] = useState(false);
  const [hintKey, setHintKey] = useState<HintKey>('wait');
  const hintId = useId();
  const buyRef = useRef<HTMLButtonElement | null>(null);
  const buyWrapRef = useRef<HTMLSpanElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const armingRef = useRef<CoinConfirmArming | null>(null);
  const cancelSessionRef = useRef<() => void>(() => undefined);
  const { colorKey: doneColorKey } = useRoleColor('done', { fallback: 'blue' });
  const confirmColor = doneColorKey && doneColorKey in Color ? doneColorKey : 'blue';
  cancelSessionRef.current = () => resolve(false);

  useLayoutEffect(() => {
    if (!session) return;
    const doc = document;
    const arming = createCoinConfirmArming({ touchPrimary: touchPrimaryDevice() });
    armingRef.current = arming;
    setArmed(false);
    setHintKey(hintFor(arming.state()));
    const openedAt = performance.now();
    leaveFullscreenAndPointerLock(doc);
    const releaseFrame = makeInert(frameRootRef?.current || null);
    let focusedCancel = false;
    let lastPoint: { x: number; y: number } | null = null;
    const now = () => performance.now();
    const buyRect = () => buyWrapRef.current?.getBoundingClientRect() || null;
    const insideRect = (rect: DOMRect | null, x: number, y: number, pad = 0) =>
      Boolean(rect && x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad);
    const boxRect = () => buyWrapRef.current?.closest('[role="dialog"]')?.getBoundingClientRect() || null;
    const sync = () => {
      const state = arming.state();
      setArmed(state.armed);
      setHintKey(hintFor(state));
    };
    const tick = () => {
      if (isFullscreen(doc) && now() - openedAt > FULLSCREEN_GIVE_UP_MS) {
        cancelSessionRef.current();
        return;
      }
      arming.tick(boxVisible(doc, buyWrapRef.current), now());
      // Start on Cancel, never on Buy (N9); once, after the box mounts.
      if (!focusedCancel && cancelRef.current) {
        focusedCancel = true;
        cancelRef.current.focus({ preventScroll: true });
      }
      sync();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!event.isTrusted || event.pointerType !== 'mouse') return;
      const { clientX: x, clientY: y } = event;
      // Real movement only: a hover update under a resting cursor repeats
      // the same point with no movement.
      const moved =
        Boolean(event.movementX || event.movementY) ||
        Boolean(lastPoint && (lastPoint.x !== x || lastPoint.y !== y));
      lastPoint = { x, y };
      // Visibility first (between timer ticks, e.g. right after something
      // stopped covering Buy), so this movement counts once the box is seen.
      arming.tick(boxVisible(doc, buyWrapRef.current), now());
      arming.mouseMove({ moved, overBox: insideRect(boxRect(), x, y) }, now());
      sync();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!event.isTrusted) return;
      const input = event.pointerType === 'mouse' ? 'mouse' : 'touch';
      arming.press(input, insideRect(buyRect(), event.clientX, event.clientY), now());
      sync();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.isTrusted) return;
      const onBuy = doc.activeElement === buyRef.current;
      const { block } = arming.keyDown(event.key, { onBuy, repeat: event.repeat }, now());
      if (block) event.preventDefault();
      // Tab moves between the box's own buttons here, in every browser
      // (Safari's Tab otherwise skips buttons), and never restarts the wait.
      if (!block && event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        const buttons = dialogButtons(buyWrapRef.current);
        if (buttons.length) {
          event.preventDefault();
          const at = buttons.indexOf(doc.activeElement as HTMLElement);
          const next =
            at < 0
              ? event.shiftKey
                ? buttons.length - 1
                : 0
              : (at + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
          buttons[next].focus();
        }
      }
      sync();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (!event.isTrusted) return;
      const { block } = arming.keyUp(event.key, doc.activeElement === buyRef.current, now());
      if (block) event.preventDefault();
    };
    const onFocusIn = (event: FocusEvent) => {
      arming.buyFocus(event.target === buyRef.current);
      sync();
    };
    const onWindowBlur = () => arming.resetKeys();
    const onFullscreenChange = () => {
      // The app took fullscreen back while the box was open: Cancel (N5).
      if (isFullscreen(doc)) {
        cancelSessionRef.current();
        return;
      }
      tick();
    };
    doc.addEventListener('pointermove', onPointerMove, true);
    doc.addEventListener('pointerdown', onPointerDown, true);
    doc.addEventListener('keydown', onKeyDown, true);
    doc.addEventListener('keyup', onKeyUp, true);
    doc.addEventListener('focusin', onFocusIn, true);
    window.addEventListener('blur', onWindowBlur);
    doc.addEventListener('visibilitychange', tick);
    doc.addEventListener('fullscreenchange', onFullscreenChange);
    doc.addEventListener('webkitfullscreenchange', onFullscreenChange);
    const timer = window.setInterval(tick, TICK_MS);
    tick();
    return () => {
      window.clearInterval(timer);
      doc.removeEventListener('pointermove', onPointerMove, true);
      doc.removeEventListener('pointerdown', onPointerDown, true);
      doc.removeEventListener('keydown', onKeyDown, true);
      doc.removeEventListener('keyup', onKeyUp, true);
      doc.removeEventListener('focusin', onFocusIn, true);
      window.removeEventListener('blur', onWindowBlur);
      doc.removeEventListener('visibilitychange', tick);
      doc.removeEventListener('fullscreenchange', onFullscreenChange);
      doc.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      releaseFrame();
      if (armingRef.current === arming) armingRef.current = null;
    };
  }, [session, frameRootRef]);
  useEffect(
    () => () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    },
    []
  );

  function requestCoinConfirm(next: CoinConfirmRequest) {
    resolverRef.current?.(false);
    // A new box never inherits the last one's armed state (L5).
    setArmed(false);
    armingRef.current = null;
    setSession({ id: ++nextSessionId, request: next });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }
  function resolve(confirmed: boolean) {
    const done = resolverRef.current;
    resolverRef.current = null;
    setArmed(false);
    armingRef.current = null;
    setSession(null);
    done?.(confirmed);
  }
  function handleBuy(event?: React.MouseEvent) {
    // Every press the arming rules refuse (Buy not on yet, a resting
    // cursor, a held or early key, Space, a script's click) does nothing.
    if (!event) return;
    const trusted = event.nativeEvent?.isTrusted !== false;
    if (!armingRef.current?.canConfirm({ detail: event.detail, trusted }, performance.now())) return;
    resolve(true);
  }

  const text = session ? coinConfirmText(session.request) : null;
  const builderList = text && 'builderList' in text ? text.builderList : null;
  const coinConfirmModal =
    session && text ? (
      <Modal
        key={session.id}
        modalKey="CoinConfirmModal"
        isOpen
        onClose={() => resolve(false)}
        hasHeader
        title={text.title}
        size="md"
        modalLevel={2}
        priority
        closeOnBackdropClick
        footer={
          <>
            <Button
              buttonRef={cancelRef}
              variant="ghost"
              style={{ marginRight: '0.7rem' }}
              onClick={() => resolve(false)}
            >
              Cancel
            </Button>
            <span ref={buyWrapRef} className={buyWrapClass}>
              <Button
                buttonRef={buyRef}
                aria-disabled={!armed}
                aria-describedby={hintId}
                className={armed ? undefined : paleClass}
                color={confirmColor}
                onClick={handleBuy}
              >
                {text.confirmLabel}
              </Button>
            </span>
          </>
        }
      >
        <div
          style={{
            fontSize: '1.6rem',
            minHeight: '15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className={linesClass}>
            {text.lines.map((line, index) => (
              <React.Fragment key={index}>
                <p style={{ margin: 0 }}>
                  {index === 0 ? <strong>{line}</strong> : line}
                </p>
                {/* The app's own text, apart and marked as the app's (N8). */}
                {index === 0 && text.appNote ? (
                  <p className={appNoteClass}>{text.appNote}</p>
                ) : null}
              </React.Fragment>
            ))}
            {builderList ? (
              <div className={builderListClass}>
                <p>{builderList.heading}</p>
                <ul
                  className={builderList.rows.length > LONG_BUILDER_LIST ? 'long' : undefined}
                  tabIndex={builderList.rows.length > LONG_BUILDER_LIST ? 0 : undefined}
                  aria-label={builderList.heading}
                >
                  {builderList.rows.map((row, index) => (
                    <li key={index}>{row}</li>
                  ))}
                </ul>
                <p className={appNoteClass}>{builderList.note}</p>
              </div>
            ) : null}
            <div className={hintBoxClass}>
              {(Object.keys(HINTS) as HintKey[]).map((key) => (
                <span key={key} className={hintSizerClass} aria-hidden="true">
                  {HINTS[key]}
                </span>
              ))}
              <p id={hintId} aria-live="polite">
                {HINTS[hintKey]}
              </p>
            </div>
          </div>
        </div>
      </Modal>
    ) : null;

  return { coinConfirmModal, requestCoinConfirm };
}

// The box's own buttons in page order (close, Cancel, Buy).
function dialogButtons(buyWrap: HTMLElement | null) {
  const dialog = buyWrap?.closest('[role="dialog"]');
  if (!dialog) return [];
  return Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled])')).filter(
    (button) => button.getAttribute('aria-hidden') !== 'true' && (button.offsetWidth > 0 || button.offsetHeight > 0)
  );
}

function isFullscreen(doc: Document) {
  return Boolean(doc.fullscreenElement || (doc as any).webkitFullscreenElement);
}

// The box counts as seen only while the page is visible, nothing is
// fullscreen or pointer-locked, and Buy is on screen and not covered. The
// hit test checks Buy's wrapper (see above), which a disabled Buy sits in.
function boxVisible(doc: Document, buyWrap: HTMLElement | null) {
  if (!buyWrap || doc.visibilityState !== 'visible') return false;
  if (isFullscreen(doc)) return false;
  if (doc.pointerLockElement) return false;
  const rect = buyWrap.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const view = doc.defaultView;
  if (!view || rect.bottom <= 0 || rect.right <= 0 || rect.top >= view.innerHeight || rect.left >= view.innerWidth)
    return false;
  const x = Math.min(Math.max(rect.left + rect.width / 2, 0), view.innerWidth - 1);
  const y = Math.min(Math.max(rect.top + rect.height / 2, 0), view.innerHeight - 1);
  const top = doc.elementFromPoint(x, y);
  return Boolean(top && (top === buyWrap || buyWrap.contains(top)));
}

function leaveFullscreenAndPointerLock(doc: Document) {
  try {
    if (doc.fullscreenElement) void doc.exitFullscreen?.().catch(() => undefined);
    else if ((doc as any).webkitFullscreenElement) (doc as any).webkitExitFullscreen?.();
  } catch {
    // The box stays unarmed while anything is fullscreen.
  }
  try {
    doc.exitPointerLock?.();
  } catch {
    // Same: no armed Buy while the pointer is locked.
  }
  // Move focus out of the app frame (a frame that loses focus loses its
  // pointer lock); the box takes focus when it mounts.
  const active = doc.activeElement as HTMLElement | null;
  if (active?.tagName === 'IFRAME') active.blur();
}

function makeInert(root: HTMLElement | null) {
  if (!root) return () => undefined;
  const hadInert = root.hasAttribute('inert');
  const pointerEvents = root.style.pointerEvents;
  root.setAttribute('inert', '');
  root.style.pointerEvents = 'none';
  return () => {
    if (!hadInert) root.removeAttribute('inert');
    root.style.pointerEvents = pointerEvents;
  };
}
