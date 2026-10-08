import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// The AI Story success screen showed the level's full reward (x2 for
// listening) while the pass could pay a smaller share. It now shows the XP
// and Coins the API stored as paid (GET /content/game/story/clear).

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}
const modalSource = readSource('src/containers/Home/AIStoriesModal/index.tsx');
const successSource = readSource(
  'src/containers/Home/AIStoriesModal/SuccessModal/index.tsx'
);

test('the success screen shows the paid amounts and never recomputes a reward', () => {
  for (const source of [modalSource, successSource]) {
    assert.doesNotMatch(source, /rewardTable/);
    assert.doesNotMatch(source, /isListening \? 2 : 1/);
  }
  assert.match(successSource, /addCommasToNumber\(xpRewardAmount\)/);
  assert.match(successSource, /addCommasToNumber\(coinRewardAmount\)\} coins/);
  // nothing paid (or an API without the fields): no "You earned" line at all
  assert.match(
    successSource,
    /\{\(xpRewardAmount > 0 \|\| coinRewardAmount > 0\) && \(\s*<div[\s\S]*?You earned/
  );
});

test('the paid amounts come from the cleared story the API serves', () => {
  assert.match(modalSource, /xpRewardAmount: Number\(story\.xpRewardAmount \|\| 0\)/);
  assert.match(modalSource, /coinRewardAmount: Number\(story\.coinRewardAmount \|\| 0\)/);
  assert.match(modalSource, /xpRewardAmount=\{successModalStory\.xpRewardAmount\}/);
  assert.match(modalSource, /coinRewardAmount=\{successModalStory\.coinRewardAmount\}/);
});
