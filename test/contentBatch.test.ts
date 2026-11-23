import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createContentBatcher,
  type ContentBatchItem
} from '../src/helpers/contentBatch';

function setup({
  batch = async (items: ContentBatchItem[]) =>
    items.map((item) => ({ id: item.contentId, via: 'batch' })) as unknown[]
}: { batch?: (items: ContentBatchItem[]) => Promise<unknown[]> } = {}) {
  const batches: ContentBatchItem[][] = [];
  const singles: ContentBatchItem[] = [];
  const timers: { callback: () => void; cleared: boolean }[] = [];
  let clock = 0;
  const batcher = createContentBatcher<any>({
    sendBatch: (items) => {
      batches.push(items);
      return batch(items);
    },
    loadSingle: async (item) => {
      singles.push(item);
      return { id: item.contentId, via: 'single' };
    },
    isRouteMissing: (error: any) => error?.status === 404,
    now: () => clock,
    setTimer: (callback) => {
      const timer = { callback, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (handle) => {
      (handle as { cleared: boolean }).cleared = true;
    }
  });
  const fire = () => {
    for (const timer of timers.splice(0)) if (!timer.cleared) timer.callback();
  };
  return {
    batcher,
    batches,
    singles,
    fire,
    timers,
    tick: (ms: number) => {
      clock += ms;
    }
  };
}
const card = (contentId: number, contentType = 'comment'): ContentBatchItem => ({
  contentId,
  contentType,
  rootType: 'subject'
});

test('cards that ask within one window share one request, answered in order', async () => {
  const { batcher, batches, singles, fire, timers } = setup();
  const loads = [card(1), card(2), card(3, 'subject')].map(batcher.load);
  assert.equal(timers.length, 1, 'one window timer, not one per card');
  fire();
  assert.deepEqual(await Promise.all(loads), [
    { id: 1, via: 'batch' },
    { id: 2, via: 'batch' },
    { id: 3, via: 'batch' }
  ]);
  assert.equal(batches.length, 1);
  assert.equal(singles.length, 0);
});

test('a lone card uses the ordinary request', async () => {
  const { batcher, batches, singles, fire } = setup();
  const load = batcher.load(card(7));
  fire();
  assert.deepEqual(await load, { id: 7, via: 'single' });
  assert.equal(batches.length, 0);
  assert.equal(singles.length, 1);
});

test('two cards asking for the same content share one item', async () => {
  const { batcher, batches, fire } = setup();
  const loads = [card(1), card(1), card(2)].map(batcher.load);
  fire();
  const [a, b] = await Promise.all(loads);
  assert.equal(batches[0].length, 2);
  assert.deepEqual(a, b);
});

test('a full batch leaves at once and the next card starts a new one', async () => {
  const { batcher, batches, fire } = setup();
  const loads = Array.from({ length: 31 }, (_, index) =>
    batcher.load(card(index + 1))
  );
  assert.equal(batches.length, 1, 'thirty items do not wait for the window');
  assert.equal(batches[0].length, 30);
  fire();
  const results = await Promise.all(loads);
  assert.equal(results[30].via, 'single');
});

test('an API without the route: this page falls back, then stops asking for a while', async () => {
  const { batcher, batches, singles, fire, tick } = setup({
    batch: async () => {
      throw { status: 404 };
    }
  });
  const first = [card(1), card(2)].map(batcher.load);
  fire();
  assert.deepEqual(
    (await Promise.all(first)).map((result) => result.via),
    ['single', 'single']
  );
  assert.equal(batches.length, 1);
  const second = [card(3), card(4)].map(batcher.load);
  await Promise.all(second);
  assert.equal(batches.length, 1, 'no second attempt while marked missing');
  assert.equal(singles.length, 4);
  tick(10 * 60 * 1000);
  const third = [card(5), card(6)].map(batcher.load);
  fire();
  await Promise.all(third);
  assert.equal(batches.length, 2, 'asks again after the API may have shipped');
});

test('a failed batch that is not a missing route is retried per card and batching continues', async () => {
  let fail = true;
  const { batcher, batches, singles, fire } = setup({
    batch: async (items) => {
      if (fail) throw { status: 502 };
      return items.map((item) => ({ id: item.contentId, via: 'batch' }));
    }
  });
  const first = [card(1), card(2)].map(batcher.load);
  fire();
  await Promise.all(first);
  assert.equal(singles.length, 2);
  fail = false;
  const second = [card(3), card(4)].map(batcher.load);
  fire();
  assert.equal((await Promise.all(second))[0].via, 'batch');
  assert.equal(batches.length, 2);
});

test('one item the server could not read is asked for again alone; the rest arrive', async () => {
  const { batcher, singles, fire } = setup({
    batch: async (items) =>
      items.map((item) =>
        item.contentId === 2 ? { error: true } : { id: item.contentId, via: 'batch' }
      )
  });
  const loads = [card(1), card(2), card(3)].map(batcher.load);
  fire();
  assert.deepEqual(
    (await Promise.all(loads)).map((result) => result.via),
    ['batch', 'single', 'batch']
  );
  assert.deepEqual(
    singles.map((item) => item.contentId),
    [2]
  );
});

test('an answer of the wrong length is never matched to cards by position', async () => {
  const { batcher, singles, fire } = setup({ batch: async () => [{ id: 99 }] });
  const loads = [card(1), card(2)].map(batcher.load);
  fire();
  assert.deepEqual(
    (await Promise.all(loads)).map((result) => result.id),
    [1, 2]
  );
  assert.equal(singles.length, 2);
});

test('not found and empty answers pass through as the per-card request returns them', async () => {
  const { batcher, fire } = setup({
    batch: async () => [{ notFound: true }, null]
  });
  const loads = [card(1), card(2)].map(batcher.load);
  fire();
  assert.deepEqual(await Promise.all(loads), [{ notFound: true }, null]);
});
