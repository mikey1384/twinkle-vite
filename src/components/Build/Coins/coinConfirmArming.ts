// When the website's Coins box may accept a confirmation (review H1, round-2
// N4/N9, round-3 P1/P2/P7/P8, 11-07). An app could otherwise hide the box
// (fullscreen, pointer lock), keep the player clicking or pressing keys, or
// put its own button where Buy appears, so a click or key press meant for the
// game lands on Buy. The rules, kept free of the DOM so they can be tested:
// - Buy turns on only after the box has really been visible for
//   COIN_CONFIRM_ARM_MS (page visible, nothing fullscreen or pointer-locked,
//   Buy on screen and on top). Losing visibility starts everything over.
// - mouse: Buy also needs real mouse movement the website itself received
//   over the box. While a game frame holds pointer lock, or the cursor rests,
//   the website gets none, so the box cannot turn on behind the player's
//   back (N4). A click counts when its press started on Buy while Buy was on.
// - touch (phones, tablets, a touch on a touch screen): no hover and no
//   pointer lock exist, and every touch lands where the player sees it, so
//   the visible wait is enough; the tap that confirms must start on Buy while
//   Buy is on and come at least COIN_CONFIRM_TAP_GAP_MS after the previous
//   tap, so a player who never stops tapping one spot cannot buy.
// - keyboard: Enter on Buy, pressed (not auto-repeated, not held from before)
//   while Buy is on. Space never confirms (a game's jump key); the box opens
//   with focus on Cancel (N9).
// - assistive technology (VoiceOver, NVDA, Switch Control): a click with no
//   pointer press and no key behind it counts like the keyboard, when Buy is
//   on and has focus (P7).
// Nothing a player does before Buy turns on is held against them: a click,
// tap or key on the pale Buy does nothing, and the next one once Buy is on
// works (round-3 P1/P2). Moving focus (Tab, Shift+Tab) never restarts the
// wait.
export const COIN_CONFIRM_ARM_MS = 1000;
export const COIN_CONFIRM_TAP_GAP_MS = 400;
// A click this soon after a key event was made by that key (the browser
// presses a focused button on Enter keydown or Space keyup).
export const COIN_CONFIRM_KEY_CLICK_MS = 500;
// A pointer press this old no longer explains a click.
const PRESS_STALE_MS = 10000;

export type CoinConfirmInput = 'mouse' | 'touch' | 'keyboard';
const MODIFIER_KEYS = new Set(['Shift', 'Alt', 'Control', 'Meta', 'OS', 'AltGraph', 'CapsLock']);
const SPACE_KEYS = new Set([' ', 'Spacebar']);

export interface CoinConfirmMouseMove {
  // The website saw real movement (coordinates changed), not a resting or
  // synthetic hover update.
  moved: boolean;
  // Inside the box (the dialog).
  overBox: boolean;
}

// What the player sees and what the hint must say.
export interface CoinConfirmState {
  visible: boolean;
  armed: boolean;
  mode: CoinConfirmInput;
  // Mouse mode: the website has seen the mouse move over the box.
  moved: boolean;
  buyFocused: boolean;
}

export interface CoinConfirmArming {
  // Called on a timer and on visibility changes.
  tick(visible: boolean, now: number): void;
  // A mouse pointermove the website itself received.
  mouseMove(move: CoinConfirmMouseMove, now: number): void;
  // A mouse press or a touch/pen landing; onBuy when it is on Buy.
  press(input: 'mouse' | 'touch', onBuy: boolean, now: number): void;
  // A key going down anywhere; onBuy when Buy has focus. block: the caller
  // must preventDefault, so the browser does not press a button itself
  // (Space on Buy, Enter on a Buy that is not on, a held key).
  keyDown(key: string, info: { onBuy: boolean; repeat: boolean }, now: number): { block: boolean };
  keyUp(key: string, onBuy: boolean, now: number): { block: boolean };
  // Buy gained or lost focus.
  buyFocus(focused: boolean): void;
  // The window lost focus: key-ups may never arrive, so forget held keys.
  resetKeys(): void;
  armedFor(input: CoinConfirmInput, now: number): boolean;
  state(now?: number): CoinConfirmState;
  // Whether Buy shows as on, for the input in use.
  readonly armed: boolean;
  readonly mode: CoinConfirmInput;
  // The Buy click is accepted only when this says so.
  canConfirm(click: { detail: number; trusted: boolean }, now: number): boolean;
}

export function createCoinConfirmArming({
  armMs = COIN_CONFIRM_ARM_MS,
  tapGapMs = COIN_CONFIRM_TAP_GAP_MS,
  touchPrimary = false
}: { armMs?: number; tapGapMs?: number; touchPrimary?: boolean } = {}): CoinConfirmArming {
  let visibleSince: number | null = null;
  // First real mouse movement over the box while it was visible.
  let movedAt: number | null = null;
  let mode: CoinConfirmInput = touchPrimary ? 'touch' : 'mouse';
  let lastPress: { input: 'mouse' | 'touch'; accepted: boolean; at: number; open: boolean } | null = null;
  let lastTouchAt = -Infinity;
  let lastKey: { key: string; type: 'down' | 'up'; accepted: boolean; at: number } | null = null;
  // Keys this page saw go down and not yet up: another keydown for one of
  // them is a repeat even if the browser did not mark it.
  const keysDown = new Set<string>();
  let buyFocused = false;
  let lastNow = 0;

  function armedFor(input: CoinConfirmInput, now: number) {
    if (visibleSince === null || now - visibleSince < armMs) return false;
    if (input === 'mouse') return movedAt !== null;
    return true;
  }
  function state(now = lastNow): CoinConfirmState {
    return { visible: visibleSince !== null, armed: armedFor(mode, now), mode, moved: movedAt !== null, buyFocused };
  }
  return {
    tick(visible, now) {
      lastNow = now;
      if (!visible) {
        visibleSince = null;
        movedAt = null;
        lastPress = null;
        lastKey = null;
        keysDown.clear();
        return;
      }
      if (visibleSince === null) visibleSince = now;
    },
    mouseMove({ moved, overBox }, now) {
      lastNow = now;
      if (visibleSince === null || !moved || !overBox) return;
      // Only movement over the box switches to mouse mode, and that movement
      // also counts as moved: an iPad trackpad never turns an on Buy off (P8).
      mode = 'mouse';
      if (movedAt === null) movedAt = now;
    },
    press(input, onBuy, now) {
      lastNow = now;
      if (input === 'touch') mode = 'touch';
      const accepted =
        onBuy && armedFor(input, now) && (input !== 'touch' || now - lastTouchAt >= tapGapMs);
      if (input === 'touch') lastTouchAt = now;
      lastPress = { input, accepted, at: now, open: true };
    },
    keyDown(key, { onBuy, repeat }, now) {
      lastNow = now;
      if (MODIFIER_KEYS.has(key)) return { block: false };
      const held = repeat || keysDown.has(key);
      if (!held) keysDown.add(key);
      if (key === 'Tab' || key === 'Enter') mode = 'keyboard';
      // Only a fresh Enter pressed while Buy is on and focused: never an
      // auto-repeat, never a key held down from the game before the box.
      const accepted = key === 'Enter' && onBuy && !held && armedFor('keyboard', now);
      lastKey = { key, type: 'down', accepted, at: now };
      const space = SPACE_KEYS.has(key);
      return {
        block: (onBuy && (space || (key === 'Enter' && !accepted))) || (held && (space || key === 'Enter'))
      };
    },
    keyUp(key, onBuy, now) {
      lastNow = now;
      keysDown.delete(key);
      if (MODIFIER_KEYS.has(key)) return { block: false };
      lastKey = { key, type: 'up', accepted: false, at: now };
      return { block: onBuy && SPACE_KEYS.has(key) };
    },
    buyFocus(focused) {
      buyFocused = focused;
    },
    resetKeys() {
      keysDown.clear();
    },
    armedFor,
    state,
    get armed() {
      return armedFor(mode, lastNow);
    },
    get mode() {
      return mode;
    },
    canConfirm({ detail, trusted }, now) {
      if (!trusted) return false;
      const key = lastKey && now - lastKey.at <= COIN_CONFIRM_KEY_CLICK_MS ? lastKey : null;
      // The browser pressed Buy for a key: only the accepted Enter counts
      // (Space activates on keyup, which is never accepted).
      if (detail === 0 && key) return key.type === 'down' && key.accepted;
      const press = lastPress && lastPress.open && now - lastPress.at <= PRESS_STALE_MS ? lastPress : null;
      if (lastPress) lastPress.open = false;
      if (press) return press.accepted;
      if (key) return key.type === 'down' && key.accepted;
      // No pointer press and no key behind this click: assistive technology
      // pressed Buy. Same rule as the keyboard: Buy on and focused.
      return armedFor('keyboard', now) && buyFocused;
    }
  };
}
