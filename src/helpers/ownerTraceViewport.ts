import {
  APP_SHELL_HEADER_SELECTOR,
  APP_SHELL_KEYBOARD_INSET_VAR
} from '~/constants/appShell';

// Five reads per load/return, including healthy wakes for comparison. No
// polling, scroll handlers, layout writes or automatic geometry correction.
export const OWNER_VIEWPORT_SAMPLE_DELAYS = [250, 1000, 3000, 20_000];

export function readOwnerViewportGeometry(doc: Document, win: Window) {
  const root = doc.documentElement;
  const app = doc.getElementById('App');
  const shell = app?.parentElement;
  const nav = doc.querySelector<HTMLElement>(APP_SHELL_HEADER_SELECTOR);
  const viewport = win.visualViewport;
  const active = doc.activeElement as HTMLElement | null;
  const control = active as HTMLInputElement | HTMLTextAreaElement | null;
  const navStyle = nav ? win.getComputedStyle(nav) : null;
  const box = (element: Element | null | undefined) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { top: round(rect.top), bottom: round(rect.bottom), height: round(rect.height) };
  };
  return {
    window: { width: win.innerWidth, height: win.innerHeight, scrollY: round(win.scrollY) },
    root: {
      height: root.clientHeight,
      scrollTop: round(doc.scrollingElement?.scrollTop || 0),
      scrollHeight: doc.scrollingElement?.scrollHeight ?? root.scrollHeight
    },
    visual: viewport ? {
      width: round(viewport.width), height: round(viewport.height),
      offsetTop: round(viewport.offsetTop), offsetLeft: round(viewport.offsetLeft),
      pageTop: round(viewport.pageTop), scale: round(viewport.scale, 1000)
    } : null,
    nav: nav ? {
      ...box(nav), position: navStyle?.position, bottomStyle: navStyle?.bottom,
      display: navStyle?.display, visibility: navStyle?.visibility,
      transform: navStyle?.transform
    } : null,
    shell: box(shell),
    app: app ? { ...box(app), scrollTop: round(app.scrollTop), scrollHeight: app.scrollHeight } : null,
    inset: round(parseFloat(win.getComputedStyle(root).getPropertyValue(APP_SHELL_KEYBOARD_INSET_VAR)) || 0),
    // Deliberately no value, id, name, placeholder or text from the control.
    focus: {
      tag: active?.tagName.toLowerCase() || '',
      type: active?.tagName === 'INPUT' ? (active as HTMLInputElement).type : '',
      readOnly: Boolean(control?.readOnly), editable: Boolean(active?.isContentEditable)
    }
  };
}

function round(value: number, precision = 10) {
  return Number.isFinite(value) ? Math.round(value * precision) / precision : null;
}

export function installOwnerViewportTrace({
  isActive,
  record,
  version,
  doc = document,
  win = window,
  now = () => performance.now(),
  read = () => readOwnerViewportGeometry(doc, win)
}: {
  isActive: () => boolean;
  record: (data: Record<string, unknown>) => void;
  version: string;
  doc?: Document;
  win?: Window;
  now?: () => number;
  read?: () => ReturnType<typeof readOwnerViewportGeometry>;
}) {
  if (!isActive()) return () => {};
  let timers: number[] = [];
  let cycle = 0;
  let startedAt = 0;
  let backgroundRecorded = true;
  let triggers: string[] = [];
  let persisted: boolean | undefined;

  function cancel() {
    timers.forEach((timer) => win.clearTimeout(timer));
    timers = [];
  }

  function sample(phase: 'start' | 'settle' | 'background', scheduledMs: number) {
    if (!isActive()) { cancel(); return; }
    if (phase !== 'background' && doc.visibilityState !== 'visible') return;
    const at = now();
    try {
      const geometry = read();
      record({
        v: 1, version, cycle, triggers: [...triggers], phase,
        scheduledMs, elapsedMs: Math.round(at - startedAt), persisted,
        visibility: doc.visibilityState, ...geometry, readMs: round(now() - at)
      });
    } catch {
      // Missing measurements must not look like a healthy wake in the report.
      record({ v: 1, version, cycle, phase, error: 'geometry-unavailable' });
    }
  }

  function start(trigger: string, restored?: boolean) {
    if (!isActive() || doc.visibilityState !== 'visible') return;
    // pageshow and visibilitychange often describe the same return. Keep the
    // original samples, merge the triggers, and never restart a second burst.
    if (!backgroundRecorded && now() - startedAt < 500) {
      if (!triggers.includes(trigger)) triggers.push(trigger);
      if (restored !== undefined) persisted = restored;
      return;
    }
    cancel();
    cycle += 1;
    startedAt = now();
    backgroundRecorded = false;
    triggers = [trigger];
    persisted = restored;
    sample('start', 0);
    timers = OWNER_VIEWPORT_SAMPLE_DELAYS.map((delay) =>
      win.setTimeout(() => sample('settle', delay), delay)
    );
  }

  function background() {
    cancel();
    if (backgroundRecorded) return;
    backgroundRecorded = true;
    sample('background', 0);
  }

  function visibility() {
    if (doc.visibilityState === 'visible') start('visible');
    else background();
  }

  function pageshow(event: PageTransitionEvent) {
    start('pageshow', event.persisted);
  }

  doc.addEventListener('visibilitychange', visibility);
  win.addEventListener('pageshow', pageshow);
  win.addEventListener('pagehide', background);
  // Activation happens while the recorder is creating its session header.
  // Defer the first record to avoid recursion; install background listeners
  // now so their last sample precedes the existing pagehide/hidden flush.
  timers.push(win.setTimeout(() => start('load'), 0));
  return () => {
    cancel();
    doc.removeEventListener('visibilitychange', visibility);
    win.removeEventListener('pageshow', pageshow);
    win.removeEventListener('pagehide', background);
  };
}
