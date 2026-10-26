import {
  APP_SHELL_HEADER_SELECTOR,
  APP_SHELL_KEYBOARD_INSET_VAR
} from '~/constants/appShell';

// Five baseline reads per load/return, including healthy wakes for comparison.
// Mobile activity adds at most four debounced changes and one first-touch pair.
// No polling, layout writes, screenshots or automatic geometry correction.
export const OWNER_VIEWPORT_SAMPLE_DELAYS = [250, 1000, 3000, 20_000];
export const OWNER_VIEWPORT_CHANGE_LIMIT = 4;
const CHANGE_SETTLE_MS = 300;

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
    },
    layout: readLayoutContext(doc, win, nav, box)
  };
}

function readLayoutContext(
  doc: Document,
  win: Window,
  nav: HTMLElement | null,
  box: (element: Element | null | undefined) => {
    top: number | null; bottom: number | null; height: number | null;
  } | null
) {
  const ancestors: { depth: number; effects: string[] }[] = [];
  let element = nav?.parentElement;
  let depth = 0;
  let omitted = 0;
  // Only bounded CSS flags, never DOM ids/classes, CSS URLs or page content.
  for (; element && depth < 8; element = element.parentElement, depth++) {
    const style = win.getComputedStyle(element);
    const effects = [
      style.transform && style.transform !== 'none' ? 'transform' : '',
      style.perspective && style.perspective !== 'none' ? 'perspective' : '',
      style.filter && style.filter !== 'none' ? 'filter' : '',
      style.backdropFilter && style.backdropFilter !== 'none' ? 'backdrop-filter' : '',
      /\b(layout|paint|strict|content)\b/.test(style.contain) ? 'contain' : '',
      /\b(transform|perspective|filter)\b/.test(style.willChange) ? 'will-change' : '',
      style.contentVisibility === 'auto' ? 'content-visibility' : ''
    ].filter(Boolean);
    if (effects.length) {
      if (ancestors.length < 3) ancestors.push({ depth, effects });
      else omitted++;
    }
  }
  const bodyStyle = doc.body ? win.getComputedStyle(doc.body) : null;
  return {
    v: 2,
    root: box(doc.documentElement),
    body: box(doc.body),
    bodyPosition: bodyStyle?.position,
    bodyZoom: String(bodyStyle?.zoom || '').slice(0, 12),
    navPadding: nav ? round(parseFloat(win.getComputedStyle(nav).paddingBottom) || 0) : null,
    orientation: win.screen?.orientation?.angle ?? null,
    ancestors, ancestorLimit: Boolean(element) || omitted > 0
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
  let disposed = false;
  let changeTimer: number | null = null;
  let touchTimer: number | null = null;
  let changeSamples = 0;
  let skippedEvents = 0;
  let firstTouch = false;
  let changeCounts: Record<string, number> = {};

  function cancel() {
    timers.forEach((timer) => win.clearTimeout(timer));
    timers = [];
    if (changeTimer !== null) win.clearTimeout(changeTimer);
    if (touchTimer !== null) win.clearTimeout(touchTimer);
    changeTimer = touchTimer = null;
  }

  function sample(
    phase: 'start' | 'settle' | 'background' | 'change' | 'interaction',
    scheduledMs: number,
    signals?: Record<string, number>
  ) {
    if (disposed || !isActive()) { cancel(); return; }
    if (phase !== 'background' && doc.visibilityState !== 'visible') return;
    const at = now();
    try {
      const geometry = read();
      const data: Record<string, unknown> = {
        v: 1, version, cycle, triggers: [...triggers], phase,
        scheduledMs, elapsedMs: Math.round(at - startedAt), persisted,
        visibility: doc.visibilityState, ...geometry, readMs: round(now() - at),
        signals,
        activity: {
          changes: changeSamples, limit: OWNER_VIEWPORT_CHANGE_LIMIT,
          skippedEvents, pendingEvents: Object.values(changeCounts).reduce((a, b) => a + b, 0),
          firstTouch
        }
      };
      // The API caps event data at 2,000 characters. Preserve the original
      // geometry if optional detail would exceed it; report the omission.
      if (JSON.stringify(data).length > 1900) data.layout = { v: 2, omitted: 'payload-budget' };
      record(data);
    } catch {
      // Missing measurements must not look like a healthy wake in the report.
      record({ v: 1, version, cycle, phase, error: 'geometry-unavailable' });
    }
  }

  function start(trigger: string, restored?: boolean) {
    if (disposed || !isActive() || doc.visibilityState !== 'visible') return;
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
    changeSamples = skippedEvents = 0;
    firstTouch = false;
    changeCounts = {};
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

  function canReadActivity() {
    return !disposed && isActive() && cycle > 0 && !backgroundRecorded &&
      doc.visibilityState === 'visible' && win.innerWidth <= 767;
  }

  function change(signal: string) {
    if (!canReadActivity()) return;
    if (changeSamples >= OWNER_VIEWPORT_CHANGE_LIMIT) {
      skippedEvents = Math.min(999999, skippedEvents + 1);
      return;
    }
    changeCounts[signal] = Math.min(999999, (changeCounts[signal] || 0) + 1);
    // Event handlers do no DOM reads. One timer observes the settled burst;
    // continued scrolling postpones it rather than forcing layout each frame.
    if (changeTimer !== null) win.clearTimeout(changeTimer);
    const scheduledMs = Math.round(now() - startedAt) + CHANGE_SETTLE_MS;
    changeTimer = win.setTimeout(() => {
      changeTimer = null;
      if (!canReadActivity()) return;
      const signals = changeCounts;
      changeCounts = {};
      changeSamples++;
      sample('change', scheduledMs, signals);
    }, CHANGE_SETTLE_MS);
  }

  function touch(event: PointerEvent) {
    if (!canReadActivity() || firstTouch || !event.isTrusted || event.pointerType !== 'touch') return;
    firstTouch = true;
    sample('interaction', Math.round(now() - startedAt), { 'first-touch': 1 });
    const scheduledMs = Math.round(now() - startedAt) + CHANGE_SETTLE_MS;
    touchTimer = win.setTimeout(() => {
      touchTimer = null;
      sample('interaction', scheduledMs, { 'after-first-touch': 1 });
    }, CHANGE_SETTLE_MS);
  }

  const activityListeners: [EventTarget, string, EventListener][] = [
    [win, 'resize', () => change('window-resize')],
    [win, 'orientationchange', () => change('orientation')],
    [doc, 'scroll', () => change('document-scroll')],
    [doc, 'pointerdown', touch as EventListener]
  ];
  if (win.visualViewport) activityListeners.push(
    [win.visualViewport, 'resize', () => change('visual-resize')],
    [win.visualViewport, 'scroll', () => change('visual-scroll')]
  );
  activityListeners.forEach(([target, type, listener]) =>
    target.addEventListener(type, listener, { capture: true, passive: true })
  );
  doc.addEventListener('visibilitychange', visibility);
  win.addEventListener('pageshow', pageshow);
  win.addEventListener('pagehide', background);
  // Activation happens while the recorder is creating its session header.
  // Defer the first record to avoid recursion; install background listeners
  // now so their last sample precedes the existing pagehide/hidden flush.
  timers.push(win.setTimeout(() => start('load'), 0));
  return () => {
    disposed = true;
    cancel();
    activityListeners.forEach(([target, type, listener]) =>
      target.removeEventListener(type, listener, true)
    );
    doc.removeEventListener('visibilitychange', visibility);
    win.removeEventListener('pageshow', pageshow);
    win.removeEventListener('pagehide', background);
  };
}
