import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stripLeadingActorName,
  summaryNamesApp
} from '../src/helpers/buildAppNotificationSummary';

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

test('a summary that already names the app needs no "in <app>" after it', () => {
  const lead = 'replied to the Twinkle Newspaper: “Rrr”';
  assert.equal(summaryNamesApp(lead, 'Twinkle Newspaper'), true);
  assert.equal(summaryNamesApp('responded to the twinkle newspaper', 'Twinkle Newspaper'), true);
  // a summary that does not name it keeps the app title
  assert.equal(summaryNamesApp('reached floor 8', 'Infinite Stairs'), false);
  assert.equal(summaryNamesApp('posted in Lobby', 'Twinkle Newspaper'), false);
  // the member's own quoted words never count
  assert.equal(
    summaryNamesApp('replied: “I love the Twinkle Newspaper”', 'Twinkle Newspaper'),
    false
  );
  assert.equal(summaryNamesApp('posted', ''), false);
  assert.equal(summaryNamesApp('', 'Twinkle Newspaper'), false);
});

test('partial words and other app titles cannot hide the source app', () => {
  assert.equal(summaryNamesApp('got a new badge', 'Go'), false);
  assert.equal(summaryNamesApp('reached floor 8 in Stairs Deluxe', 'Air'), false);
  assert.equal(summaryNamesApp('posted in GoClub', 'Go'), false);
  assert.equal(summaryNamesApp('posted in Go_Club', 'Go'), false);
  assert.equal(summaryNamesApp('posted in 고게임', '게임'), false);
  assert.equal(summaryNamesApp('posted in Café', 'Cafe'), false);
  // Skip a partial match and still recognize a later complete title.
  assert.equal(summaryNamesApp('got a new badge in Go', 'Go'), true);
});

test('punctuation within an exact title is not a quoted-payload boundary', () => {
  assert.equal(summaryNamesApp('posted in AI: Friends: “Hello”', 'AI: Friends'), true);
  assert.equal(summaryNamesApp('posted in Say "Hi": “Hello”', 'Say "Hi"'), true);
  assert.equal(summaryNamesApp('replied: “AI: Friends is fun”', 'AI: Friends'), false);
  assert.equal(summaryNamesApp('replied “Go is fun”', 'Go'), false);
  assert.equal(summaryNamesApp('posted in Cafe\u0301', 'Café'), true);
});
