import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHydrationPacer } from '../src/containers/Home/Stories/FeedCard/hydrationPacer';

function frames() {
  const queue: (() => void)[] = [];
  return {
    requestFrame: (callback: () => void) => queue.push(callback),
    next() {
      const callback = queue.shift();
      callback?.();
    },
    scheduled: () => queue.length
  };
}

test('replies that land together are applied two per frame, on-screen cards first', () => {
  const f = frames();
  const pacer = createHydrationPacer({
    perFrame: 2,
    requestFrame: f.requestFrame
  });
  const applied: string[] = [];
  for (const id of ['a', 'b', 'c']) pacer.enqueue(() => applied.push(id));
  pacer.enqueue(() => applied.push('visible-1'), true);
  pacer.enqueue(() => applied.push('visible-2'), true);
  // one frame request no matter how many replies arrive
  assert.equal(f.scheduled(), 1);
  f.next();
  assert.deepEqual(applied, ['visible-1', 'visible-2']);
  f.next();
  assert.deepEqual(applied, ['visible-1', 'visible-2', 'a', 'b']);
  f.next();
  assert.deepEqual(applied, ['visible-1', 'visible-2', 'a', 'b', 'c']);
  assert.equal(pacer.pending(), 0);
  assert.equal(f.scheduled(), 0);
});

test('one failing apply does not stop the rest', () => {
  const f = frames();
  const pacer = createHydrationPacer({
    perFrame: 2,
    requestFrame: f.requestFrame
  });
  const applied: string[] = [];
  const originalError = console.error;
  console.error = () => {};
  try {
    pacer.enqueue(() => {
      throw new Error('boom');
    });
    pacer.enqueue(() => applied.push('next'));
    f.next();
  } finally {
    console.error = originalError;
  }
  assert.deepEqual(applied, ['next']);
});

test('feed cards apply content through the pacer and stay marked in flight until applied', () => {
  const source = readFileSync(
    new URL(
      '../src/containers/Home/Stories/FeedCard/index.tsx',
      import.meta.url
    ),
    'utf8'
  );
  assert.match(
    source,
    /homeFeedHydrationPacer\.enqueue\(\(\) => \{\s*releaseHydration\(\);[\s\S]*?onInitContent\(/m
  );
  assert.match(source, /\}, \(\) => inViewRef\.current\);/);
});

test('urgency is read when the frame applies, not when the reply arrived', () => {
  const f = frames();
  const pacer = createHydrationPacer({
    perFrame: 1,
    requestFrame: f.requestFrame
  });
  const applied: string[] = [];
  let scrolledIntoView = false;
  pacer.enqueue(() => applied.push('off-screen'));
  pacer.enqueue(
    () => applied.push('scrolled-in'),
    () => scrolledIntoView
  );
  scrolledIntoView = true;
  f.next();
  assert.deepEqual(applied, ['scrolled-in']);
});

test('an urgency check that throws counts as not urgent and never stalls the queue', () => {
  const f = frames();
  const pacer = createHydrationPacer({
    perFrame: 1,
    requestFrame: f.requestFrame
  });
  const applied: string[] = [];
  pacer.enqueue(
    () => applied.push('broken'),
    () => {
      throw new Error('unmounted');
    }
  );
  pacer.enqueue(
    () => applied.push('visible'),
    () => true
  );
  f.next();
  f.next();
  assert.deepEqual(applied, ['visible', 'broken']);
  assert.equal(pacer.pending(), 0);
});
