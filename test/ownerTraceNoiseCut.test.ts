import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shouldOwnerTraceScrollDiagnostic } from '../src/helpers/ownerTraceScrollAnchorFilter';

test('the owner trace keeps scroll-restore outcomes, not every step', () => {
  for (const type of [
    'nav-pointerdown',
    'nav-click',
    'restore-start',
    'restore-to-anchor',
    'initial-scroll',
    'save'
  ]) {
    assert.equal(shouldOwnerTraceScrollDiagnostic({ type }), false, type);
  }
  for (const type of [
    'restore-cancelled',
    'cancel',
    'anchor-missing-fallback-scrolltop',
    'top-repin'
  ]) {
    assert.equal(shouldOwnerTraceScrollDiagnostic({ type }), true, type);
  }
  // a settle is kept only when it landed away from its computed position
  assert.equal(
    shouldOwnerTraceScrollDiagnostic({
      type: 'settle-final',
      scrollTop: 208,
      computedScrollTop: 208
    }),
    false
  );
  assert.equal(
    shouldOwnerTraceScrollDiagnostic({
      type: 'settle-final',
      scrollTop: 150,
      computedScrollTop: 208
    }),
    true
  );
  assert.equal(
    shouldOwnerTraceScrollDiagnostic({
      type: 'settle-final',
      scrollTop: 150,
      computedScrollTop: ''
    }),
    false
  );
});

const ownerTrace = readFileSync(
  new URL('../src/helpers/ownerTrace.ts', import.meta.url),
  'utf8'
);

test('smooth scroll samples and fast taps stay out of the owner trace', () => {
  assert.match(
    ownerTrace,
    /Number\(data\.over50\) === 0 && Number\(data\.maxFrameMs\) < 50/
  );
  assert.match(ownerTrace, /smoothBefore: smoothScrollSamples/);
  assert.match(
    ownerTrace,
    /type === 'nav-timing' &&\s*Number\(data\?\.total\) < NAV_TIMING_MIN_TOTAL_MS/m
  );
});

test('every request, load and return feeds the wake window', () => {
  assert.match(ownerTrace, /wakeProfiler\.noteRequest\(/);
  assert.match(ownerTrace, /wakeProfiler\.start\(\{\s*kind: 'load'/m);
  assert.match(ownerTrace, /wakeProfiler\.start\(\{\s*kind: 'resume'/m);
  assert.match(ownerTrace, /wakeProfiler\.stop\('hidden'\)/);
});
