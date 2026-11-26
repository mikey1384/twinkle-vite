import { useEffect, useState } from 'react';
import { useAppContext } from '~/contexts';
import type { DomainProgressView } from './checkout/model';

// One shared poller per app for the purchase progress tracker: the address
// chip, the Build header notice and the order screen read the same record
// (no duplicate requests). It asks while something is moving and backs off:
// every 10 s while setting up (×1.5 each time, up to a minute), every 5
// minutes while only the email confirmation is left, and stops once every
// step is done, refunded, or there is no order. A failed read waits longer
// each time (up to 5 minutes). The server checks Name.com at most every 5
// minutes per order on these reads.
type Loader = (input: { buildId: number }) => Promise<{ progress: DomainProgressView | null }>;
interface Entry {
  progress: DomainProgressView | null;
  loaded: boolean;
  listeners: Set<() => void>;
  timer: number;
  delay: number;
  failures: number;
  running: boolean;
  load: Loader | null;
}
const entries = new Map<number, Entry>();

function entryFor(buildId: number) {
  let entry = entries.get(buildId);
  if (!entry) {
    entry = { progress: null, loaded: false, listeners: new Set(), timer: 0, delay: 10_000, failures: 0, running: false, load: null };
    entries.set(buildId, entry);
  }
  return entry;
}

function nextDelay(entry: Entry) {
  const stage = entry.progress?.stage;
  if (stage === 'setting_up' || stage === 'refunding') {
    const delay = entry.delay;
    entry.delay = Math.min(60_000, Math.round(entry.delay * 1.5));
    return delay;
  }
  if (stage === 'one_step_left' || stage === 'support') return 5 * 60_000;
  return 0;
}

async function poll(buildId: number) {
  const entry = entryFor(buildId);
  window.clearTimeout(entry.timer);
  entry.timer = 0;
  if (!entry.load || !entry.listeners.size || entry.running) return;
  entry.running = true;
  let wait = 0;
  try {
    const data = await entry.load({ buildId });
    entry.progress = data?.progress || null;
    entry.loaded = true;
    entry.failures = 0;
    wait = nextDelay(entry);
  } catch {
    entry.failures += 1;
    wait = Math.min(5 * 60_000, 15_000 * 2 ** (entry.failures - 1));
  } finally {
    entry.running = false;
  }
  entry.listeners.forEach((listener) => listener());
  if (wait && entry.listeners.size) entry.timer = window.setTimeout(() => void poll(buildId), wait);
}

// Read again now (after Resend, or when the order screen sees a change).
export function refreshDomainProgress(buildId: number) {
  const entry = entryFor(buildId);
  entry.delay = 10_000;
  void poll(buildId);
}

export function useDomainProgress(buildId: number, enabled: boolean) {
  const loadDomainProgress = useAppContext((v) => v.requestHelpers.loadDomainProgress);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!enabled || !buildId) return;
    const entry = entryFor(buildId);
    entry.load = loadDomainProgress;
    const listener = () => setTick((value) => value + 1);
    entry.listeners.add(listener);
    if (!entry.loaded && !entry.running) void poll(buildId);
    else if (!entry.timer && !entry.running && entry.progress && nextDelay(entry)) void poll(buildId);
    return () => {
      entry.listeners.delete(listener);
      if (!entry.listeners.size) {
        window.clearTimeout(entry.timer);
        entry.timer = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, enabled]);
  if (!enabled || !buildId) return null;
  return entries.get(buildId)?.progress || null;
}
