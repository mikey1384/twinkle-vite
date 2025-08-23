export type EventTargetLike = Window | Document | HTMLElement | null;
type Listener = ((evt: Event) => void) | { handleEvent: (evt: Event) => void };
interface AddEvtOptions {
  passive?: boolean;
  capture?: boolean;
  once?: boolean;
}
type Opts = boolean | AddEvtOptions | undefined;

const PASSIVE_DEFAULT = new Set(['scroll', 'touchstart', 'touchmove', 'wheel']);

let _supportsPassive: boolean | null = null;
function supportsPassive(): boolean {
  if (_supportsPassive != null) return _supportsPassive;
  let supported = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        supported = true;
      }
    });
    window.addEventListener('test-passive', () => {}, opts as any);
    window.removeEventListener('test-passive', () => {}, opts as any);
  } catch {}
  _supportsPassive = supported;
  return supported;
}

function normalizeAddOptions(
  type: string,
  opts: Opts
): boolean | AddEvtOptions {
  const defPassive = PASSIVE_DEFAULT.has(type);
  if (!supportsPassive()) {
    // Old browsers only accept boolean "capture"
    if (typeof opts === 'boolean') return opts;
    return !!opts?.capture;
  }
  if (opts == null) return { passive: defPassive };
  if (typeof opts === 'boolean') return opts;
  return {
    passive: opts.passive ?? defPassive,
    capture: !!opts.capture,
    once: !!opts.once
  };
}

function normalizeRemoveOptions(opts: Opts): boolean {
  // removeEventListener only cares about capture matching
  if (typeof opts === 'boolean') return opts;
  return !!opts?.capture;
}

export function addEvent(
  elem: EventTargetLike,
  type: string,
  handler: Listener,
  opts?: Opts
): void {
  if (!elem) return;
  const opt = normalizeAddOptions(type, opts);
  elem.addEventListener(type, handler as any, opt as any);
}

export function removeEvent(
  elem: EventTargetLike,
  type: string,
  handler: Listener,
  opts?: Opts
): void {
  if (!elem) return;
  const capture = normalizeRemoveOptions(opts);
  elem.removeEventListener(type, handler as any, capture);
}

// Optional convenience that returns a disposer:
export function on(
  elem: EventTargetLike,
  type: string,
  handler: Listener,
  opts?: Opts
) {
  addEvent(elem, type, handler, opts);
  return () => removeEvent(elem, type, handler, opts);
}
