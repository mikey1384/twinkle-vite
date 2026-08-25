import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { applyCanonicalUserProfileStatePatch } from '../src/contexts/User/profileState';

const profileHomeSource = readFileSync(
  new URL('../src/containers/Profile/Body/Home/index.tsx', import.meta.url),
  'utf8'
);
const userReducerSource = readFileSync(
  new URL('../src/contexts/User/reducer.ts', import.meta.url),
  'utf8'
);

test('canonical profile patches preserve the latest sibling state', () => {
  const user = {
    id: 7,
    username: 'turtle',
    state: {
      navTabs: { order: ['home'] },
      profile: {
        pinnedBuildIds: [3],
        sectionOrder: ['intro', 'builds']
      }
    }
  };

  const updated = applyCanonicalUserProfileStatePatch({
    user,
    userId: 7,
    profileState: { pinnedAICardIds: [9, 4] }
  });

  assert.deepEqual(updated.state, {
    navTabs: { order: ['home'] },
    profile: {
      pinnedBuildIds: [3],
      sectionOrder: ['intro', 'builds'],
      pinnedAICardIds: [9, 4]
    }
  });
  assert.equal(updated.username, 'turtle');
  assert.equal(updated.userId, 7);
  assert.equal(updated.contentId, 7);
});

test('section-order writes require and wait for canonical response data', () => {
  assert.match(
    profileHomeSource,
    /if \(!Array\.isArray\(data\?\.sectionOrder\)\)[\s\S]*?did not include canonical data/
  );
  assert.doesNotMatch(profileHomeSource, /:\s*nextOrder/);
  assert.match(profileHomeSource, /submitting=\{savingSectionOrder\}/);
  assert.match(
    userReducerSource,
    /case 'APPLY_CANONICAL_USER_PROFILE_STATE'[\s\S]*?applyCanonicalUserProfileStatePatch/
  );
});
