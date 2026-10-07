import test from 'node:test';
import assert from 'node:assert/strict';
import { stripLeadingActorName } from '../src/helpers/buildAppNotificationSummary';

test('a summary that repeats the actor name drops it', () => {
  assert.equal(
    stripLeadingActorName('Liki responded to the Twinkle Newspaper: “@mone, Congratulations!”', 'Liki'),
    'responded to the Twinkle Newspaper: “@mone, Congratulations!”'
  );
  assert.equal(stripLeadingActorName('liki posted in Lobby', 'Liki'), 'posted in Lobby');
  assert.equal(stripLeadingActorName('Liki: new high score', 'Liki'), 'new high score');
});

test('other summaries are left alone', () => {
  assert.equal(stripLeadingActorName('posted in Lobby', 'Liki'), 'posted in Lobby');
  assert.equal(stripLeadingActorName('Likiko joined your crew', 'Liki'), 'Likiko joined your crew');
  assert.equal(stripLeadingActorName('Liki', 'Liki'), 'Liki');
  // a possessive stays whole: "Liki" + "tower …" would be ungrammatical
  assert.equal(
    stripLeadingActorName("Liki's tower reached floor 8", 'Liki'),
    "Liki's tower reached floor 8"
  );
  assert.equal(stripLeadingActorName('Liki responded', ''), 'Liki responded');
  assert.equal(stripLeadingActorName('', 'Liki'), '');
});
