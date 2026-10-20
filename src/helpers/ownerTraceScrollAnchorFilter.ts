// The owner trace keeps only scroll-restore outcomes worth a look; the step
// events (taps, each restore attempt, saves) were 600+ a day of routine noise
// (10-20). The local capture (setScrollDiagnosticsLoggingEnabled) still keeps
// every step.
const OWNER_TRACE_SCROLL_ANCHOR_TYPES = new Set([
  'restore-cancelled',
  'cancel',
  'cancel-suppressed',
  'anchor-missing-fallback-scrolltop',
  'restore-teardown',
  'top-reset',
  'top-repin'
]);

export function shouldOwnerTraceScrollDiagnostic(event: {
  type: string;
  scrollTop?: unknown;
  computedScrollTop?: unknown;
}) {
  if (OWNER_TRACE_SCROLL_ANCHOR_TYPES.has(event.type)) return true;
  // a restore that settled away from where it computed it should be
  if (event.type === 'settle-final') {
    if (typeof event.computedScrollTop !== 'number') return false;
    if (typeof event.scrollTop !== 'number') return false;
    return Math.abs(event.scrollTop - event.computedScrollTop) > 2;
  }
  return false;
}
