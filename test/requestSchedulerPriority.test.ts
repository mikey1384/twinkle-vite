import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { RequestPriorityLimiters } from '../src/contexts/requestHelpers/axiosInstance/requestPriorityLimiters';

test('a high-priority Chat bootstrap does not wait behind the ordinary GET queue', async () => {
  const started: string[] = [];
  let releaseFirst!: () => void;
  const firstGate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  const limiters = new RequestPriorityLimiters(1);
  const run = (label: string, priority?: 'high') =>
    limiters.run({
      priority,
      task: async () => {
        started.push(label);
        if (label === 'ordinary-1') await firstGate;
        return label;
      }
    });

  const ordinaryOne = run('ordinary-1');
  await Promise.resolve();
  const ordinaryTwo = run('ordinary-2');
  const critical = run('/chat?channelId=2', 'high');

  await critical;
  assert.deepEqual(started, ['ordinary-1', '/chat?channelId=2']);

  releaseFirst();
  await Promise.all([ordinaryOne, ordinaryTwo]);
  assert.deepEqual(started, [
    'ordinary-1',
    '/chat?channelId=2',
    'ordinary-2'
  ]);
});

test('the high-priority lane remains bounded', async () => {
  const limiters = new RequestPriorityLimiters(6);
  let active = 0;
  let maxActive = 0;
  let release!: () => void;
  let confirmTwoStarted!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const twoStarted = new Promise<void>((resolve) => {
    confirmTwoStarted = resolve;
  });
  const tasks = Array.from({ length: 4 }, () =>
    limiters.run({
      priority: 'high',
      task: async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        if (active === 2) confirmTwoStarted();
        await gate;
        active -= 1;
      }
    })
  );

  await twoStarted;
  assert.equal(maxActive, 2);
  release();
  await Promise.all(tasks);
});

test('the scheduler records queue and HTTP/parse phases around the selected lane', () => {
  const schedulerSource = readFileSync(
    new URL(
      '../src/contexts/requestHelpers/axiosInstance/requestScheduler.ts',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(schedulerSource, /this\.limiters\.run\(\{/);
  assert.match(schedulerSource, /priority: config\.meta\?\.priority/);
  assert.match(schedulerSource, /preQueueDelayMs = queuedAt - attemptStartedAt/);
  assert.match(schedulerSource, /queueWaitMs = httpStartTime - queuedAt/);
  assert.match(schedulerSource, /httpAndParseMs: Date\.now\(\) - httpStartTime/);
  assert.match(schedulerSource, /notifyAttemptTiming\(config\.meta\?\.onAttemptTiming/);
});

test('every full Chat bootstrap uses the high-priority lane', () => {
  const requestSource = readFileSync(
    new URL('../src/contexts/requestHelpers/chat.ts', import.meta.url),
    'utf8'
  );
  const fullBootstrapSource = requestSource.slice(
    requestSource.indexOf('async loadChat({'),
    requestSource.indexOf('async loadChatChannel({')
  );

  assert.match(fullBootstrapSource, /priority: 'high'/);
  assert.doesNotMatch(
    fullBootstrapSource,
    /priority: compactGeneralTopics \? 'high'/
  );
});
