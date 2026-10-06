import test from 'node:test';
import assert from 'node:assert/strict';
import { shareInFlight } from '../src/containers/Chat/inFlightRequests';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

// The topic re-entry bug: an async body that finishes without awaiting used
// to leave its settled promise cached, so the next call with the same key
// returned it and did nothing (Chat/Main.tsx handleChannelEnter, 2.3.43).
test('a body that finishes without awaiting runs again on the next call', async () => {
  const map: Record<string, Promise<void> | undefined> = {};
  let runs = 0;
  const enter = () =>
    shareInFlight(map, 'topic:5998', async () => {
      runs++; // no await before returning, like a switch inside an open chat
    });
  await enter();
  await tick();
  assert.equal(map['topic:5998'], undefined);
  await enter();
  assert.equal(runs, 2);
});

test('a second call while the first is in flight shares it', async () => {
  const map: Record<string, Promise<number> | undefined> = {};
  let runs = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const start = () =>
    shareInFlight(map, 'k', async () => {
      runs++;
      await gate;
      return runs;
    });
  const a = start();
  const b = start();
  assert.equal(a, b);
  release();
  assert.equal(await a, 1);
  await tick();
  assert.equal(map.k, undefined);
});

test('a failed request is cleared too, and only the stored entry is removed', async () => {
  const map: Record<string, Promise<void> | undefined> = {};
  await assert.rejects(
    shareInFlight(map, 'k', async () => {
      throw new Error('boom');
    })
  );
  await tick();
  assert.equal(map.k, undefined);
  // A newer entry under the same key is not removed by an older one settling.
  let releaseOld!: () => void;
  const old = shareInFlight(map, 'k', () => new Promise<void>((r) => (releaseOld = r)));
  delete map.k;
  const newer = shareInFlight(map, 'k', () => new Promise<void>(() => {}));
  releaseOld();
  await old;
  await tick();
  assert.equal(map.k, newer);
});
