import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  dailyPictureJobs,
  type DailyPictureResult,
  type PictureDayState
} from '../src/helpers/dailyPictureJobs';

const PATH_A = 'daily-reflection/aaaa-1111.png';
const PATH_B = 'daily-reflection/bbbb-2222.png';

function pictureState(
  paths: Array<{ path: string; requestId?: string }>,
  overrides: Partial<PictureDayState> = {}
): PictureDayState {
  return {
    prompt: 'a fox',
    style: 'Watercolor',
    chosenPath: '',
    freeAvailable: paths.length === 0,
    candidates: paths.map(({ path, requestId }) => ({
      path,
      prompt: 'a fox',
      style: 'Watercolor',
      quality: 'high',
      paidBy: 'site',
      ...(requestId ? { requestId } : {})
    })),
    ...overrides
  };
}

test('reconcileServerState refreshes cached picture on failed jobs so deleted images are never resurrected', async () => {
  const userId = 9001;
  const questionId = 42;
  dailyPictureJobs.activate(userId);

  // Job 1 succeeds with PATH_A
  await dailyPictureJobs.start({
    userId,
    questionId,
    prompt: 'a fox',
    style: 'Watercolor',
    quality: 'high',
    generate: async ({ requestId }) => ({
      questionId,
      requestId,
      isToday: true,
      path: PATH_A,
      picture: pictureState([{ path: PATH_A, requestId }])
    }),
    load: async () => {
      throw new Error('not needed');
    }
  });

  // Job 2 fails after loading current server state that still includes PATH_A
  await dailyPictureJobs.start({
    userId,
    questionId,
    prompt: 'a fox in snow',
    style: 'Ink',
    quality: 'high',
    generate: async () => {
      const error: any = new Error('Busy, try again');
      error.status = 500;
      throw error;
    },
    load: async () => ({
      questionId,
      isToday: true,
      picture: pictureState([{ path: PATH_A }])
    })
  });

  const before = dailyPictureJobs.getSnapshot().jobs.filter((j) => j.questionId === questionId);
  assert.equal(before.length, 2);
  assert.equal(before[0].status, 'failed');
  assert.deepEqual(before[0].picture?.candidates.map((c) => c.path), [PATH_A]);
  assert.equal(before[1].status, 'ready');

  // PATH_A is deleted in another tab; fresh server snapshot has no candidates
  const emptyPicture = pictureState([], { freeAvailable: false });
  dailyPictureJobs.reconcileServerState({
    questionId,
    picture: emptyPicture,
    fetchedAt: Date.now() + 1000
  });

  const after = dailyPictureJobs.getSnapshot().jobs.filter((j) => j.questionId === questionId);
  assert.equal(after.length, 1);
  assert.equal(after[0].status, 'failed');
  assert.equal(after[0].error, 'Busy, try again');
  assert.deepEqual(after[0].picture?.candidates, []);
});

test('reconcileServerState refreshes cached picture on checking/unconfirmed jobs and ignores stale snapshots', async () => {
  const userId = 9002;
  const questionId = 43;
  dailyPictureJobs.activate(userId);

  // Transport failure leaves the job in 'checking'
  await dailyPictureJobs.start({
    userId,
    questionId,
    prompt: 'a castle',
    style: 'Clay',
    quality: 'high',
    generate: async () => {
      const error: any = new Error('network lost');
      error.isTransportError = true;
      throw error;
    },
    load: async () => {
      throw new Error('offline');
    }
  });

  // Recovery caches picture containing PATH_A while still checking
  await dailyPictureJobs.recover(async (): Promise<DailyPictureResult> => ({
    questionId,
    isToday: true,
    picture: pictureState([{ path: PATH_A }])
  }));

  const checkingJob = dailyPictureJobs
    .getSnapshot()
    .jobs.find((j) => j.questionId === questionId);
  assert.ok(checkingJob);
  assert.equal(checkingJob.status, 'checking');
  assert.deepEqual(checkingJob.picture?.candidates.map((c) => c.path), [PATH_A]);

  // Older server snapshot (fetchedAt before the job's cached picture) must not overwrite it
  dailyPictureJobs.reconcileServerState({
    questionId,
    picture: pictureState([], { freeAvailable: false }),
    fetchedAt: (checkingJob.pictureUpdatedAt ?? checkingJob.startedAt) - 10
  });
  const afterStale = dailyPictureJobs
    .getSnapshot()
    .jobs.find((j) => j.questionId === questionId);
  assert.deepEqual(afterStale?.picture?.candidates.map((c) => c.path), [PATH_A]);

  // Fresher server snapshot refreshes the cached picture without dropping the pending job
  dailyPictureJobs.reconcileServerState({
    questionId,
    picture: pictureState([{ path: PATH_B }], { freeAvailable: false }),
    fetchedAt: Date.now() + 1000
  });
  const afterFresh = dailyPictureJobs
    .getSnapshot()
    .jobs.find((j) => j.questionId === questionId);
  assert.equal(afterFresh?.status, 'checking');
  assert.deepEqual(afterFresh?.picture?.candidates.map((c) => c.path), [PATH_B]);
});

test('ContentListItem resolves dailyReflection picturePath from ContentContext state', () => {
  const source = readFileSync(
    new URL('../src/components/ContentListItem/index.tsx', import.meta.url),
    'utf8'
  );
  assert.match(
    source,
    /const\s+resolvedPicturePath\s*=\s*contentType\s*===\s*'dailyReflection'\s*&&\s*typeof\s+contentState\?\.picturePath\s*===\s*'string'\s*\?\s*contentState\.picturePath\s*:\s*picturePath;/
  );
  assert.match(
    source,
    /contentType\s*===\s*'dailyReflection'\s*&&\s*resolvedPicturePath\s*\?\s*`\$\{cloudFrontURL\}\/\$\{resolvedPicturePath\}`/
  );
});
