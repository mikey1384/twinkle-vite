import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { appendUniqueById } from '../src/contexts/Content/idListHelpers';

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

test('ATTACH_REWARD reconciles every rendered content shape by server id', () => {
  const source = readFileSync(
    new URL('../src/contexts/Content/reducer.ts', import.meta.url),
    'utf8'
  );
  const attachCase = source.match(
    /case 'ATTACH_REWARD': \{[\s\S]*?case 'CLEAR_COMMENT_FILE_UPLOAD_PROGRESS'/
  );

  assert.ok(attachCase);
  assert.doesNotMatch(attachCase[0], /\.concat\(action\.reward\)/);
  assert.equal(
    attachCase[0].match(/appendUniqueById\(/g)?.length,
    8,
    'Every direct, nested, subject, and target reward list must reconcile by id'
  );
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
