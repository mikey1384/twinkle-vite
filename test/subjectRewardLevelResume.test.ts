import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  chunkSubjectIds,
  collectObservedSubjectIds,
  getMountedSubjectIds,
  observeMountedSubject,
  refreshSubjectRewardLevelBatches
} from '../src/helpers/subjectRewardLevelSync';

test('resume refresh includes direct, embedded, and comment-linked subjects', () => {
  const subjectIds = collectObservedSubjectIds({
    subject11: {
      contentId: 11,
      contentType: 'subject'
    },
    video12: {
      contentId: 12,
      contentType: 'video',
      comments: [
        {
          id: 31,
          subjectId: 13,
          replies: [{ id: 32, subjectId: 14, replies: [] }]
        }
      ],
      subjects: [
        {
          id: 15,
          comments: [{ id: 33, subjectId: 16, replies: [] }]
        }
      ],
      targetObj: {
        subject: { id: 17 },
        comment: { id: 34, subjectId: 18, replies: [] }
      }
    },
    comment35: {
      contentId: 35,
      contentType: 'comment',
      rootId: 19,
      rootType: 'subject'
    }
  });

  assert.deepEqual(
    subjectIds.sort((a, b) => a - b),
    [11, 13, 14, 15, 16, 17, 18, 19]
  );
});

test('resume refresh includes mounted subject cards outside Content state', () => {
  const stopObservingFirstCard = observeMountedSubject(41);
  const stopObservingDuplicateCard = observeMountedSubject(41);
  const stopObservingSecondCard = observeMountedSubject(42);

  assert.deepEqual(
    collectObservedSubjectIds({}, getMountedSubjectIds()).sort((a, b) => a - b),
    [41, 42]
  );

  stopObservingFirstCard();
  assert.deepEqual(getMountedSubjectIds(), [41, 42]);
  stopObservingDuplicateCard();
  stopObservingSecondCard();
  assert.deepEqual(getMountedSubjectIds(), []);
});

test('resume refresh batches every observed subject and continues after one batch fails', async () => {
  const subjectIds = Array.from({ length: 401 }, (_, index) => index + 1);
  const batches = chunkSubjectIds(subjectIds);
  const requestedBatches: number[][] = [];
  const refreshedSubjectIds: number[] = [];
  const errors: unknown[] = [];

  await refreshSubjectRewardLevelBatches({
    subjectIds,
    loadSubjectRewardLevels: async (subjectIdBatch) => {
      requestedBatches.push(subjectIdBatch);
      if (subjectIdBatch[0] === 1) throw new Error('temporary failure');
      return subjectIdBatch.map((id) => ({
        id,
        rewardLevel: 10,
        rewardLevelRevision: 2
      }));
    },
    shouldContinue: () => true,
    onSubject: ({ contentId }) => refreshedSubjectIds.push(contentId),
    onBatchError: (error) => errors.push(error)
  });

  assert.deepEqual(
    batches.map((batch) => batch.length),
    [200, 200, 1]
  );
  assert.deepEqual(
    requestedBatches.map((batch) => batch.length),
    [200, 200, 1]
  );
  assert.equal(errors.length, 1);
  assert.deepEqual(refreshedSubjectIds, subjectIds.slice(200));
});

test('resume refresh runs after reconnect and a sleeping tab becomes visible', () => {
  const socketHook = readFileSync(
    new URL(
      '../src/containers/App/Header/hooks/useAPISocket/useNotiSocket.ts',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(socketHook, /refreshSubjectRewardLevelBatches\(/);
  assert.match(
    socketHook,
    /socket\.on\('connect', refreshObservedSubjectRewardLevels\)/
  );
  assert.match(
    socketHook,
    /document\.addEventListener\('visibilitychange', handleVisibilityChange\)/
  );
  assert.match(
    socketHook,
    /window\.addEventListener\('pageshow', refreshObservedSubjectRewardLevels\)/
  );
});
