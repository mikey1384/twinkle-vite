import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { appendUniqueById } from '../src/contexts/Content/idListHelpers';

const reducerPath = fileURLToPath(
  new URL('../src/contexts/Content/reducer.ts', import.meta.url)
);
const { default: ContentReducer } = loadTypeScriptModule(reducerPath);
const rewardCapacityPath = fileURLToPath(
  new URL(
    '../src/components/XPRewardInterface/rewardCapacity.ts',
    import.meta.url
  )
);
const { getRewardCapacity } = loadTypeScriptModule(rewardCapacityPath);

const firstReward = {
  id: 501,
  rewarderId: 12,
  rewardAmount: 3,
  rewardType: 'Twinkle',
  timeStamp: 1_784_786_325
};

test('repeated delivery of one canonical reward id is idempotent everywhere', () => {
  const rewards = appendUniqueById([firstReward], [{ ...firstReward }]);

  assert.deepEqual(rewards, [firstReward]);
});

test('legitimate rewards with distinct server ids remain distinct', () => {
  const secondReward = {
    ...firstReward,
    id: 502
  };
  const rewards = appendUniqueById([firstReward], [secondReward]);

  assert.deepEqual(
    rewards.map((reward) => reward.id),
    [501, 502]
  );
});

test('canonical comment rewards replace every rendered ownership shape', () => {
  const staleReward = { ...firstReward, id: 499 };
  const canonicalRewards = [
    firstReward,
    { ...firstReward, id: 502, rewarderId: 13, rewardAmount: 2 }
  ];
  const unrelatedRewards = [{ ...firstReward, id: 700 }];
  const state = {
    comment42: {
      contentId: 42,
      contentType: 'comment',
      rewards: [staleReward]
    },
    video7: {
      contentId: 7,
      contentType: 'video',
      rewards: unrelatedRewards,
      comments: [
        { id: 42, rewards: [staleReward], replies: [] },
        {
          id: 10,
          rewards: unrelatedRewards,
          replies: [
            {
              id: 20,
              rewards: unrelatedRewards,
              replies: [{ id: 42, rewards: [staleReward] }]
            }
          ]
        }
      ],
      subjects: [
        {
          id: 90,
          rewards: unrelatedRewards,
          comments: [
            {
              id: 30,
              rewards: unrelatedRewards,
              replies: [{ id: 42, rewards: [staleReward] }]
            }
          ]
        }
      ],
      targetObj: {
        comment: { id: 42, rewards: [staleReward] },
        subject: {
          id: 91,
          rewards: unrelatedRewards,
          comments: [{ id: 42, rewards: [staleReward] }]
        }
      }
    },
    comment99: {
      contentId: 99,
      contentType: 'comment',
      rewards: unrelatedRewards
    }
  };

  const nextState = ContentReducer(state, {
    type: 'SYNC_CONTENT_REWARDS',
    contentId: 42,
    contentType: 'comment',
    rewards: canonicalRewards
  });

  assert.strictEqual(nextState.comment42.rewards, canonicalRewards);
  assert.strictEqual(nextState.video7.comments[0].rewards, canonicalRewards);
  assert.strictEqual(
    nextState.video7.comments[1].replies[0].replies[0].rewards,
    canonicalRewards
  );
  assert.strictEqual(
    nextState.video7.subjects[0].comments[0].replies[0].rewards,
    canonicalRewards
  );
  assert.strictEqual(
    nextState.video7.targetObj.comment.rewards,
    canonicalRewards
  );
  assert.strictEqual(
    nextState.video7.targetObj.subject.comments[0].rewards,
    canonicalRewards
  );
  assert.strictEqual(nextState.video7.rewards, unrelatedRewards);
  assert.strictEqual(nextState.comment99, state.comment99);
});

test('canonical subject rewards replace direct, list, and target copies', () => {
  const staleReward = { ...firstReward, id: 499 };
  const canonicalRewards = [firstReward];
  const state = {
    subject8: {
      contentId: 8,
      contentType: 'subject',
      rewards: [staleReward]
    },
    video7: {
      contentId: 7,
      contentType: 'video',
      subjects: [{ id: 8, rewards: [staleReward], comments: [] }],
      targetObj: {
        subject: { id: 8, rewards: [staleReward], comments: [] }
      }
    }
  };

  const nextState = ContentReducer(state, {
    type: 'SYNC_CONTENT_REWARDS',
    contentId: 8,
    contentType: 'subject',
    rewards: canonicalRewards
  });

  assert.strictEqual(nextState.subject8.rewards, canonicalRewards);
  assert.strictEqual(nextState.video7.subjects[0].rewards, canonicalRewards);
  assert.strictEqual(
    nextState.video7.targetObj.subject.rewards,
    canonicalRewards
  );
});

test('ATTACH_REWARD stays idempotent across direct and nested reward sources', () => {
  const state = {
    comment42: {
      contentId: 42,
      contentType: 'comment',
      rewards: [firstReward]
    },
    video7: {
      contentId: 7,
      contentType: 'video',
      comments: [{ id: 10, replies: [{ id: 42, rewards: [firstReward] }] }]
    }
  };

  const duplicateState = ContentReducer(state, {
    type: 'ATTACH_REWARD',
    contentId: 42,
    contentType: 'comment',
    reward: { ...firstReward }
  });

  assert.strictEqual(duplicateState, state);
  assert.deepEqual(duplicateState.comment42.rewards, [firstReward]);
  assert.deepEqual(duplicateState.video7.comments[0].replies[0].rewards, [
    firstReward
  ]);
});

test('REVOKE_REWARD removes the server id from direct and nested sources', () => {
  const secondReward = { ...firstReward, id: 502 };
  const state = {
    comment42: {
      contentId: 42,
      contentType: 'comment',
      rewards: [firstReward, secondReward]
    },
    video7: {
      contentId: 7,
      contentType: 'video',
      comments: [
        {
          id: 10,
          replies: [{ id: 42, rewards: [firstReward, secondReward] }]
        }
      ]
    }
  };

  const nextState = ContentReducer(state, {
    type: 'REVOKE_REWARD',
    contentId: 42,
    contentType: 'comment',
    rewardId: firstReward.id
  });

  assert.deepEqual(nextState.comment42.rewards, [secondReward]);
  assert.deepEqual(nextState.video7.comments[0].replies[0].rewards, [
    secondReward
  ]);
});

test('reward submission uses its synchronous ref as a duplicate-request gate', () => {
  const source = readFileSync(
    new URL('../src/components/XPRewardInterface/index.tsx', import.meta.url),
    'utf8'
  );
  const submitHandler = source.match(
    /async function handleRewardSubmit\(\) \{[\s\S]*?function handleSetComment/
  );

  assert.ok(submitHandler);
  assert.match(
    submitHandler[0],
    /if \(rewardingRef\.current\) return;[\s\S]*?rewardingRef\.current = true;/
  );
  assert.match(
    submitHandler[0],
    /finally \{[\s\S]*?rewardingRef\.current = false;/
  );
});

test('cap rejection applies the canonical response without reloading content', () => {
  const source = readFileSync(
    new URL('../src/components/XPRewardInterface/index.tsx', import.meta.url),
    'utf8'
  );
  const rejectionBranch = source.match(
    /if \(alreadyRewarded\) \{[\s\S]*?return;[\s\S]*?\}/
  );

  assert.ok(rejectionBranch);
  assert.match(rejectionBranch[0], /onSyncContentRewards\(/);
  assert.match(
    rejectionBranch[0],
    /handleSetCapReached\(canonicalRewardables === 0\)/
  );
  assert.doesNotMatch(rejectionBranch[0], /handleSetCapReached\(true\)/);
  assert.doesNotMatch(rejectionBranch[0], /loadContent|location\.reload/);
});

test('canonical capacity preserves a smaller total-cap retry', () => {
  const capacity = getRewardCapacity({
    rewards: [
      { rewarderId: 12, rewardAmount: 2 },
      { rewarderId: 13, rewardAmount: 2 }
    ],
    rewardLevel: 0,
    userId: 14
  });

  assert.equal(capacity.rewardables, 1);
});

test('canonical capacity preserves a smaller per-user retry', () => {
  const capacity = getRewardCapacity({
    rewards: [{ rewarderId: 12, rewardAmount: 2 }],
    rewardLevel: 0,
    userId: 12
  });

  assert.equal(capacity.rewardables, 1);
});

test('canonical capacity reports exhaustion only when no reward fits', () => {
  const totalCapReached = getRewardCapacity({
    rewards: [
      { rewarderId: 12, rewardAmount: 3 },
      { rewarderId: 13, rewardAmount: 2 }
    ],
    rewardLevel: 0,
    userId: 14
  });
  const perUserCapReached = getRewardCapacity({
    rewards: [{ rewarderId: 12, rewardAmount: 3 }],
    rewardLevel: 0,
    userId: 12
  });

  assert.equal(totalCapReached.rewardables, 0);
  assert.equal(perUserCapReached.rewardables, 0);
});

test('positive canonical capacity clears a stale exhaustion notice', () => {
  const source = readFileSync(
    new URL('../src/components/XPRewardInterface/index.tsx', import.meta.url),
    'utf8'
  );
  const capacityEffect = source.match(
    /useEffect\(\(\) => \{[\s\S]*?Math\.min\(selectedAmount, rewardables\)[\s\S]*?\}, \[rewardables\]\);/
  );

  assert.ok(capacityEffect);
  assert.match(
    capacityEffect[0],
    /rewardables > 0 && capReachedRef\.current[\s\S]*?handleSetCapReached\(false\)/
  );
});

function loadTypeScriptModule(entryPoint: string) {
  const output = buildSync({
    bundle: true,
    define: {
      'import.meta.env': JSON.stringify({})
    },
    entryPoints: [entryPoint],
    format: 'cjs',
    platform: 'node',
    write: false
  }).outputFiles[0].text;
  const mod: { exports: any } = { exports: {} };
  const localRequire = createRequire(entryPoint);
  const compiled = new Function('require', 'module', 'exports', output);

  compiled(localRequire, mod, mod.exports);

  return mod.exports;
}
