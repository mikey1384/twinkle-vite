import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getDisplayedPresence,
  isActivityShown,
  isPresenceHidden
} from '../src/helpers/presenceVisibility';

const ZERO = 11;
const CIEL = 12;
const HIDDEN = [ZERO, CIEL];
const PERSON = 42;

function readSource(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

test('only the listed accounts hide their presence', () => {
  assert.equal(isPresenceHidden(ZERO, HIDDEN), true);
  assert.equal(isPresenceHidden(String(CIEL), HIDDEN), true);
  assert.equal(isPresenceHidden(PERSON, HIDDEN), false);
  assert.equal(isPresenceHidden(null, HIDDEN), false);
  assert.equal(isPresenceHidden(0, [0]), false);
  // unset env ids come through as NaN and must never match anyone
  assert.equal(isPresenceHidden(Number.NaN, [Number.NaN]), false);
});

test('Zero and Ciel show no online, away or busy status even while online', () => {
  const status = { isOnline: true, isAway: true, isBusy: true };
  assert.deepEqual(getDisplayedPresence(ZERO, status, HIDDEN), {
    isOnline: false,
    isAway: false,
    isBusy: false
  });
  assert.deepEqual(getDisplayedPresence(PERSON, status, HIDDEN), {
    isOnline: true,
    isAway: true,
    isBusy: true
  });
  assert.deepEqual(getDisplayedPresence(PERSON, undefined, HIDDEN), {
    isOnline: false,
    isAway: false,
    isBusy: false
  });
});

test('the app a hidden account is playing still shows while it is online', () => {
  const activity = { type: 'build', buildId: 2610 };
  const shown = (userId: number, presence: object) =>
    isActivityShown({ userId, activity, presence, hiddenUserIds: HIDDEN });

  assert.equal(shown(ZERO, { isOnline: true }), true);
  // away is not shown for Zero and Ciel, so it doesn't hide their app either
  assert.equal(shown(ZERO, { isOnline: true, isAway: true }), true);
  assert.equal(shown(ZERO, { isOnline: false }), false);
  assert.equal(
    isActivityShown({
      userId: ZERO,
      activity: null,
      presence: { isOnline: true },
      hiddenUserIds: HIDDEN
    }),
    false
  );
  // everyone else keeps the old rule: online and not away
  assert.equal(shown(PERSON, { isOnline: true }), true);
  assert.equal(shown(PERSON, { isOnline: true, isAway: true }), false);
});

test('every presence display goes through the hidden-presence helpers', () => {
  const bound = readSource('../src/helpers/hiddenPresence.ts');
  assert.match(bound, /ZERO_TWINKLE_ID,\s*CIEL_TWINKLE_ID/);

  const profilePic = readSource('../src/components/ProfilePic/index.tsx');
  assert.match(profilePic, /!isPresenceHidden\(userId\)/);
  assert.match(profilePic, /isActivityShown\(userId, activity/);
  assert.doesNotMatch(profilePic, /activityOnline && !activityAway/);

  const panel = readSource('../src/components/ProfilePanel/index.tsx');
  assert.match(panel, /getDisplayedPresence\(\s*profileId/);
  assert.match(panel, /isPresenceHidden\(profileId\) \? null : lastActive/);

  const intro = readSource('../src/containers/Profile/Body/Home/Intro/index.tsx');
  assert.match(intro, /isPresenceHidden\(profile\.id\) \? '' : lastActive/);

  const member = readSource(
    '../src/containers/Chat/RightMenu/ChatInfo/Members/MemberListItem.tsx'
  );
  assert.match(member, /!isPresenceHidden\(member\.id\)/);

  const chatInfo = readSource('../src/containers/Chat/RightMenu/ChatInfo/index.tsx');
  assert.match(chatInfo, /!isPresenceHidden\(member\.id\) &&/);
  // General's "recently offline" list would reveal when they were last on
  assert.match(chatInfo, /!onlineIds\.has\(u\.id\) && !isPresenceHidden\(u\.id\)/);
});
