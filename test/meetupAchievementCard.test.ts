import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as meetup from '../src/constants/meetupQuest';

// The Bridge Builder card said "at least 3 students from 3 different Twinkle
// branches", which is the Gold bar; Bronze needs only 2 students. The card
// now states every tier from the mirrored quest constants.

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
  assert.equal(
    readConst(readFileSync(userHelpersPath, 'utf8'), 'FACE_TO_FACE_RECRUIT_TARGET'),
    meetup.FACE_TO_FACE_RECRUIT_TARGET
  );
});

test('the card states the Bronze minimum and every tier from the constants, never typed numbers', () => {
  const text = cardSource.replace(/\s+/g, ' ');
  assert.doesNotMatch(text, /at least \d+ students/);
  assert.doesNotMatch(text, /\d+ different Twinkle branches/);
  assert.doesNotMatch(text, /Bring \d+ friends/);
  assert.match(text, /at least \{MEETUP_CREW_MIN_MEMBERS\}\{' '\} Twinkle students/);
  assert.match(text, /<b>Bronze<\/b> \{MEETUP_CREW_MIN_MEMBERS\}\+ students/);
  assert.match(
    text,
    /<b>Silver<\/b> \{MEETUP_CREW_MIN_MEMBERS\}\+ students from\{' '\} \{MEETUP_SILVER_MIN_BRANCHES\}\+ branches/
  );
  assert.match(
    text,
    /<b>Gold<\/b>\{' '\} \{MEETUP_GOLD_MIN_MEMBERS\}\+ students from \{MEETUP_GOLD_MIN_BRANCHES\}\+ branches/
  );
  assert.match(text, /Bring \{FACE_TO_FACE_RECRUIT_TARGET\} friends/);
});
