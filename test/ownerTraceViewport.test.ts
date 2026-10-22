import assert from 'node:assert/strict';
import test from 'node:test';
import { installOwnerViewportTrace, readOwnerViewportGeometry } from '../src/helpers/ownerTraceViewport';

function geometry() {
  const style = { position: 'fixed', bottom: '0px', display: 'flex', visibility: 'visible', transform: 'none', getPropertyValue: () => '0px' };
  const box = (top: number, bottom: number) => ({ top, bottom, height: bottom - top });
  const root = { clientHeight: 800, scrollTop: 120, scrollHeight: 2400 };
  const shell = { getBoundingClientRect: () => box(-120, 680) };
  const app = { parentElement: shell, scrollTop: 0, scrollHeight: 2400, getBoundingClientRect: () => box(-120, 680) };
  const nav = { getBoundingClientRect: () => box(510, 565) };
  const doc = {
    documentElement: root, scrollingElement: root,
    getElementById: () => app, querySelector: () => nav,
    activeElement: { tagName: 'INPUT', type: 'text', readOnly: false, isContentEditable: false, value: 'private text', id: 'private-id' }
  } as unknown as Document;
  const win = {
    innerWidth: 390, innerHeight: 800, scrollY: 120,
    visualViewport: { width: 390, height: 800, offsetTop: 0, offsetLeft: 0, pageTop: 120, scale: 1 },
    getComputedStyle: () => style
  } as unknown as Window;
  return readOwnerViewportGeometry(doc, win);
}

function harness({ active = true, failRead = false } = {}) {
  let clock = 0;
  let timerId = 0;
  let reads = 0;
  const timers = new Map<number, { callback: () => void; at: number }>();
  const records: Record<string, any>[] = [];
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const win = Object.assign(new EventTarget(), {
    setTimeout(callback: () => void, ms: number) { timers.set(++timerId, { callback, at: clock + ms }); return timerId; },
    clearTimeout(id: number) { timers.delete(id); }
  });
  const cleanup = installOwnerViewportTrace({
    isActive: () => active, record: data => records.push(data), version: 'test',
    doc: doc as unknown as Document, win: win as unknown as Window, now: () => clock,
    read: () => { reads++; if (failRead) throw new Error('DOM unavailable'); return geometry(); }
  });
  return {
    records, timers, cleanup, readCount: () => reads,
    signOut() { active = false; },
    advance(ms: number) {
      clock += ms;
      for (const [id, timer] of [...timers]) {
        if (timer.at <= clock) { timers.delete(id); timer.callback(); }
      }
    },
    visibility(state: string) { doc.visibilityState = state; doc.dispatchEvent(new Event('visibilitychange')); },
    page(type: string, persisted = false) { win.dispatchEvent(Object.assign(new Event(type), { persisted })); }
  };
}

test('geometry includes the competing boundaries without control content and fits the API budget', () => {
  const data = geometry();
  assert.equal(data.root.height - data.nav!.bottom!, 235);
  assert.equal(data.visual!.pageTop, 120);
  assert.equal(data.shell!.top, -120);
  assert.equal(data.focus.tag, 'input');
  assert.doesNotMatch(JSON.stringify(data), /private/);
  assert.ok(JSON.stringify({ ...data, v: 1, version: '2.3.999', cycle: 999, triggers: ['visible', 'pageshow'], phase: 'settle', scheduledMs: 20000, elapsedMs: 999999, visibility: 'visible', readMs: 1 }).length < 2000);
});

test('activation defers recording until the session exists and bounds a healthy wake to five samples', () => {
  const h = harness();
  assert.equal(h.records.length, 0);
  h.advance(0);
  for (const ms of [250, 750, 2000, 17000]) h.advance(ms);
  assert.deepEqual(h.records.map(r => r.scheduledMs), [0, 250, 1000, 3000, 20000]);
  assert.equal(h.readCount(), 5);
  assert.equal(h.timers.size, 0);
  h.advance(60000);
  assert.equal(h.records.length, 5);
  h.cleanup();
});

test('background captures once, cancels pending work, and coalesces two notifications of the same return', () => {
  const h = harness(); h.advance(0);
  h.visibility('hidden'); h.page('pagehide', true);
  assert.equal(h.timers.size, 0);
  assert.equal(h.records.filter(r => r.phase === 'background').length, 1);
  h.advance(60000); h.visibility('visible'); h.page('pageshow', true);
  assert.equal(h.records.filter(r => r.phase === 'start').length, 2);
  h.advance(250);
  assert.deepEqual(h.records.at(-1)!.triggers, ['visible', 'pageshow']);
  assert.equal(h.records.at(-1)!.persisted, true);
  assert.equal(h.records.at(-1)!.cycle, 2);
  h.cleanup(); assert.equal(h.timers.size, 0);
  h.visibility('hidden'); h.visibility('visible');
  assert.equal(h.timers.size, 0);
});

test('a persisted pageshow resumes capture even without visibilitychange', () => {
  const h = harness(); h.advance(0); h.page('pagehide', true);
  h.advance(60000); h.page('pageshow', true);
  assert.equal(h.records.at(-1)!.cycle, 2);
  assert.deepEqual(h.records.at(-1)!.triggers, ['pageshow']);
  assert.equal(h.records.at(-1)!.persisted, true);
  h.cleanup();
});

test('non-owners and signed-out callbacks do not read geometry or schedule further work', () => {
  const inactive = harness({ active: false });
  inactive.visibility('visible'); inactive.page('pageshow');
  assert.equal(inactive.timers.size, 0); assert.equal(inactive.readCount(), 0);
  const h = harness(); h.advance(0); h.signOut(); h.advance(250);
  assert.equal(h.readCount(), 1); assert.equal(h.timers.size, 0);
  h.visibility('hidden'); h.visibility('visible');
  assert.equal(h.records.length, 1); h.cleanup();
});

test('delayed callbacks record actual elapsed time and measurement failures remain explicit', () => {
  const h = harness(); h.advance(0); h.advance(2000);
  assert.equal(h.records[1].scheduledMs, 250);
  assert.equal(h.records[1].elapsedMs, 2000); h.cleanup();
  const failed = harness({ failRead: true }); failed.advance(0);
  assert.equal(failed.records[0].error, 'geometry-unavailable'); failed.cleanup();
});
