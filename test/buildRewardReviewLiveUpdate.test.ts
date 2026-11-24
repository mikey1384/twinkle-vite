import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

// A reward review decided on the Management page (or closed by a newer save)
// must refresh the chat card in place: the server pushes the re-derived card,
// the socket hook merges it into the message's settings, and the card reads
// settings.buildRewardReview on render.
test('reward review card updates arrive over the socket and merge into message settings', () => {
  const hook = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );
  assert.match(
    hook,
    /socket\.on\('build_reward_review_updated', handleBuildRewardReviewUpdated\)/
  );
  assert.match(
    hook,
    /socket\.off\('build_reward_review_updated', handleBuildRewardReviewUpdated\)/
  );
  assert.match(hook, /settings: \{ buildRewardReview: payload\.review \}/);

  const actions = readSource('src/contexts/Chat/actions.ts');
  assert.match(actions, /type: 'UPDATE_MESSAGE_SETTINGS'/);

  const reducer = readSource('src/contexts/Chat/reducer.ts');
  const start = reducer.indexOf("case 'UPDATE_MESSAGE_SETTINGS': {");
  assert.ok(start > 0, 'reducer handles UPDATE_MESSAGE_SETTINGS');
  const body = reducer.slice(start, reducer.indexOf("case 'DELETE_MESSAGE'"));
  // Unknown message: no state change. Known message: settings merged, content
  // kept. The merge lives in a shared helper that also updates reply copies.
  assert.match(body, /updateChannelMessageSettings\(\s*prevChannelObj,\s*action\.messageId,\s*action\.settings\s*\);\s*if \(nextChannel === prevChannelObj\) return state;/);
  assert.doesNotMatch(body, /content:/);
  const helper = readSource('src/helpers/chatReplyTargetSettings.ts');
  assert.match(helper, /const nextSettings = \{ \.\.\.previous, \.\.\.settings \};/);
  assert.match(helper, /return \{ \.\.\.message, settings: nextSettings \};/);
});
