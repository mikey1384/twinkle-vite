import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as meetup from '../src/constants/meetupQuest';

// The Bridge Builder card states its numbers from the mirrored quest
// constants, never typed ones. Since 2026-10-17 it unlocks after check-ins
// with 7 different people (the same count as friends brought in) or one
// meetup with a grown-up there.

const cardSource = readFileSync(
  new URL('../src/components/AchievementItem/Big/Meetup.tsx', import.meta.url),
  'utf8'
);

function readConst(source: string, name: string) {
  return Number(source.match(new RegExp(`${name}\\s*=\\s*(\\d+)`))?.[1]);
}

test('the card numbers match the quest rules: Bronze 2+, Silver 2+ from 2+ branches, Gold 3+ from 3+ branches', () => {
  assert.equal(meetup.MEETUP_CREW_MIN_MEMBERS, 2);
  assert.equal(meetup.MEETUP_SILVER_MIN_BRANCHES, 2);
  assert.equal(meetup.MEETUP_GOLD_MIN_MEMBERS, 3);
  assert.equal(meetup.MEETUP_GOLD_MIN_BRANCHES, 3);
  assert.equal(meetup.MEETUP_CREW_MAX_MEMBERS, 8);
  assert.equal(meetup.FACE_TO_FACE_RECRUIT_TARGET, 7);
});

test('the mirrored numbers equal the API when it is checked out next to this repo', () => {
  const apiRoot = fileURLToPath(new URL('../../twinkle-api/', import.meta.url));
  const questPath = `${apiRoot}constants/meetupQuest.ts`;
  const userHelpersPath = `${apiRoot}helpers/user/index.ts`;
  if (!existsSync(questPath) || !existsSync(userHelpersPath)) return;
  const questSource = readFileSync(questPath, 'utf8');
  for (const name of [
    'MEETUP_CREW_MIN_MEMBERS',
    'MEETUP_SILVER_MIN_BRANCHES',
    'MEETUP_GOLD_MIN_MEMBERS',
    'MEETUP_GOLD_MIN_BRANCHES',
    'MEETUP_CREW_MAX_MEMBERS'
  ] as const) {
    assert.equal(readConst(questSource, name), meetup[name], name);
  }
  // the API's one count (check-ins and invited friends alike)
  assert.equal(readConst(questSource, 'BRIDGE_BUILDER_PEOPLE_TARGET'), meetup.FACE_TO_FACE_RECRUIT_TARGET);
  assert.match(
    readFileSync(userHelpersPath, 'utf8'),
    /FACE_TO_FACE_RECRUIT_TARGET = BRIDGE_BUILDER_PEOPLE_TARGET/
  );
});

test('the card states the people count from the constant and both ways to unlock', () => {
  const text = cardSource.replace(/\s+/g, ' ');
  assert.doesNotMatch(text, /Meet \d+ different people/);
  assert.match(text, /Meet \{FACE_TO_FACE_RECRUIT_TARGET\} different people in real life/);
  assert.match(text, /Friends you bring to Twinkle count too/);
  assert.match(text, /a Twinkle teacher or your parent there/);
  // the retired steps are gone from the card
  assert.doesNotMatch(text, /film it|Dark Citadel|step \$\{/);
});
