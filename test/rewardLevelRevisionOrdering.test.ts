import assert from 'node:assert/strict';
import test from 'node:test';
import ContentActions from '../src/contexts/Content/actions';
import {
  getCanonicalRewardLevelSnapshot,
  getDisplayedSubjectRewardLevel,
  resolveCanonicalRewardLevelSnapshot,
  shouldApplyRewardLevelRevision
} from '../src/helpers/rewardLevelRevision';

test('only a level paired with a durable revision is a canonical mutation result', () => {
  assert.equal(getCanonicalRewardLevelSnapshot({ rewardLevel: 10 }), undefined);
  assert.equal(
    getCanonicalRewardLevelSnapshot({ rewardLevelRevision: 2 }),
    undefined
  );
  assert.deepEqual(
    getCanonicalRewardLevelSnapshot({
      rewardLevel: 10,
      rewardLevelRevision: 2
    }),
    { rewardLevel: 10, rewardLevelRevision: 2 }
  );
});

test('a legacy mutation response waits for a canonical fallback instead of using the requested level', async () => {
  let fallbackCalls = 0;
  const confirmed = await resolveCanonicalRewardLevelSnapshot({
    response: { success: true },
    loadCanonicalSnapshot: async () => {
      fallbackCalls += 1;
      return { rewardLevel: 10, rewardLevelRevision: 2 };
    }
  });

  assert.equal(fallbackCalls, 1);
  assert.deepEqual(confirmed, { rewardLevel: 10, rewardLevelRevision: 2 });
  assert.equal(
    await resolveCanonicalRewardLevelSnapshot({
      response: { success: true },
      loadCanonicalSnapshot: async () => ({})
    }),
    undefined
  );

  fallbackCalls = 0;
  assert.deepEqual(
    await resolveCanonicalRewardLevelSnapshot({
      response: { rewardLevel: 5, rewardLevelRevision: 1 },
      loadCanonicalSnapshot: async () => {
        fallbackCalls += 1;
        return { rewardLevel: 10, rewardLevelRevision: 2 };
      }
    }),
    { rewardLevel: 5, rewardLevelRevision: 1 }
  );
  assert.equal(fallbackCalls, 0);
});

test('a mounted subject card renders the canonical Content level over its list snapshot', () => {
  assert.equal(
    getDisplayedSubjectRewardLevel({
      contentType: 'subject',
      snapshotRewardLevel: 5,
      canonicalRewardLevel: 10
    }),
    10
  );
  assert.equal(
    getDisplayedSubjectRewardLevel({
      contentType: 'video',
      snapshotRewardLevel: 5,
      canonicalRewardLevel: 10
    }),
    5
  );
});

test('a delayed reward-level event cannot replace a newer canonical revision', () => {
  const revisions = new Map<string, number>();
  const dispatched: any[] = [];
  const actions = ContentActions(
    ((action: any) => dispatched.push(action)) as any,
    ({ contentId, contentType, rewardLevelRevision }) =>
      shouldApplyRewardLevelRevision({
        revisions,
        contentId,
        contentType,
        rewardLevelRevision
      })
  );

  assert.equal(
    actions.onEditContent({
      contentType: 'subject',
      contentId: 41,
      data: { rewardLevel: 1, rewardLevelRevision: 1 }
    }),
    true
  );
  assert.equal(
    actions.onEditContent({
      contentType: 'subject',
      contentId: 41,
      data: { rewardLevel: 2, rewardLevelRevision: 2 }
    }),
    true
  );
  assert.equal(
    actions.onEditContent({
      contentType: 'subject',
      contentId: 41,
      data: { rewardLevel: 1, rewardLevelRevision: 1 }
    }),
    false
  );
  assert.equal(
    actions.onSetRewardLevel({
      contentType: 'subject',
      contentId: 41,
      rewardLevel: 1,
      rewardLevelRevision: 1
    }),
    false
  );

  assert.deepEqual(
    dispatched.map((action) => action.data?.rewardLevel ?? action.rewardLevel),
    [1, 2]
  );
  assert.equal(revisions.get('subject:41'), 2);
});

test('an initial legacy response is accepted but cannot replace a known revision', () => {
  const revisions = new Map<string, number>();

  assert.equal(
    shouldApplyRewardLevelRevision({
      revisions,
      contentType: 'subject',
      contentId: 41
    }),
    true
  );
  assert.equal(
    shouldApplyRewardLevelRevision({
      revisions,
      contentType: 'subject',
      contentId: 41,
      rewardLevelRevision: 3
    }),
    true
  );
  assert.equal(
    shouldApplyRewardLevelRevision({
      revisions,
      contentType: 'subject',
      contentId: 41,
      rewardLevelRevision: 2
    }),
    false
  );
  assert.equal(
    shouldApplyRewardLevelRevision({
      revisions,
      contentType: 'subject',
      contentId: 41
    }),
    false
  );
});

test('a delayed hydration keeps the canonical revision for direct and embedded subjects', () => {
  const revisions = new Map<string, number>();
  const dispatched: any[] = [];
  const canonicalSubject = {
    rewardLevel: 10,
    rewardLevelRevision: 2
  };
  const actions = ContentActions(
    ((action: any) => dispatched.push(action)) as any,
    ({ contentId, contentType, rewardLevelRevision }) =>
      shouldApplyRewardLevelRevision({
        revisions,
        contentId,
        contentType,
        rewardLevelRevision
      }),
    (contentId) => (contentId === 41 ? canonicalSubject : undefined)
  );

  actions.onInitContent({
    contentId: 41,
    contentType: 'subject',
    title: 'Current',
    rewardLevel: 10,
    rewardLevelRevision: 2
  });
  actions.onInitContent({
    contentId: 41,
    contentType: 'subject',
    title: 'Delayed',
    rewardLevel: 5,
    rewardLevelRevision: 1
  });
  actions.onInitContent({
    contentId: 8,
    contentType: 'comment',
    rootType: 'subject',
    rootId: 41,
    rootObj: { id: 41, rewardLevel: 5, rewardLevelRevision: 1 },
    targetObj: {
      subject: { id: 41, rewardLevel: 5, rewardLevelRevision: 1 }
    },
    subjects: [{ id: 41, rewardLevel: 5, rewardLevelRevision: 1 }]
  });

  const directHydration = dispatched[1].data;
  const embeddedHydration = dispatched[2].data;
  assert.equal(directHydration.rewardLevel, 10);
  assert.equal(directHydration.rewardLevelRevision, 2);
  assert.equal(embeddedHydration.rootObj.rewardLevel, 10);
  assert.equal(embeddedHydration.rootObj.rewardLevelRevision, 2);
  assert.equal(embeddedHydration.targetObj.subject.rewardLevel, 10);
  assert.equal(embeddedHydration.targetObj.subject.rewardLevelRevision, 2);
  assert.equal(embeddedHydration.subjects[0].rewardLevel, 10);
  assert.equal(embeddedHydration.subjects[0].rewardLevelRevision, 2);
});

test('a delayed video hydration keeps the newer socket reward level', () => {
  const revisions = new Map<string, number>();
  const dispatched: any[] = [];
  const canonicalVideo = {
    rewardLevel: 10,
    rewardLevelRevision: 2
  };
  const actions = ContentActions(
    ((action: any) => dispatched.push(action)) as any,
    ({ contentId, contentType, rewardLevelRevision }) =>
      shouldApplyRewardLevelRevision({
        revisions,
        contentId,
        contentType,
        rewardLevelRevision
      }),
    (contentId, contentType) =>
      contentId === 8 && contentType === 'video' ? canonicalVideo : undefined
  );

  actions.onEditContent({
    contentId: 8,
    contentType: 'video',
    data: canonicalVideo
  });
  actions.onInitContent({
    contentId: 8,
    contentType: 'video',
    title: 'Delayed page response',
    rewardLevel: 5,
    rewardLevelRevision: 1
  });

  const hydration = dispatched[1].data;
  assert.equal(hydration.title, 'Delayed page response');
  assert.equal(hydration.rewardLevel, 10);
  assert.equal(hydration.rewardLevelRevision, 2);
});

test('subject-list hydration preserves newer socket state for initial and paged results', () => {
  const revisions = new Map<string, number>();
  const dispatched: any[] = [];
  const canonicalSubject = {
    rewardLevel: 10,
    rewardLevelRevision: 2
  };
  const actions = ContentActions(
    ((action: any) => dispatched.push(action)) as any,
    ({ contentId, contentType, rewardLevelRevision }) =>
      shouldApplyRewardLevelRevision({
        revisions,
        contentId,
        contentType,
        rewardLevelRevision
      }),
    (contentId) => (contentId === 41 ? canonicalSubject : undefined)
  );

  actions.onEditContent({
    contentType: 'subject',
    contentId: 41,
    data: canonicalSubject
  });
  actions.onLoadSubjects({
    contentId: 8,
    contentType: 'video',
    loadMoreButton: true,
    subjects: [
      {
        id: 41,
        title: 'Delayed initial row',
        rewardLevel: 5,
        rewardLevelRevision: 1
      }
    ]
  });
  actions.onLoadMoreSubjects({
    contentId: 8,
    contentType: 'video',
    loadMoreButton: false,
    results: [
      {
        id: 41,
        title: 'Delayed paged row',
        rewardLevel: 5,
        rewardLevelRevision: 1
      }
    ]
  });

  const initialRow = dispatched[1].subjects[0];
  const pagedRow = dispatched[2].results[0];
  assert.equal(initialRow.rewardLevel, 10);
  assert.equal(initialRow.rewardLevelRevision, 2);
  assert.equal(pagedRow.rewardLevel, 10);
  assert.equal(pagedRow.rewardLevelRevision, 2);
});

test('fresh subject-list rows advance the revision watermark', () => {
  const revisions = new Map<string, number>();
  const dispatched: any[] = [];
  const actions = ContentActions(
    ((action: any) => dispatched.push(action)) as any,
    ({ contentId, contentType, rewardLevelRevision }) =>
      shouldApplyRewardLevelRevision({
        revisions,
        contentId,
        contentType,
        rewardLevelRevision
      })
  );

  actions.onLoadSubjects({
    contentId: 8,
    contentType: 'video',
    loadMoreButton: true,
    subjects: [{ id: 42, rewardLevel: 10, rewardLevelRevision: 3 }]
  });
  actions.onLoadMoreSubjects({
    contentId: 8,
    contentType: 'video',
    loadMoreButton: false,
    results: [{ id: 43, rewardLevel: 5, rewardLevelRevision: 4 }]
  });

  assert.equal(revisions.get('subject:42'), 3);
  assert.equal(revisions.get('subject:43'), 4);
  assert.equal(dispatched[0].subjects[0].rewardLevel, 10);
  assert.equal(dispatched[1].results[0].rewardLevel, 5);
});
