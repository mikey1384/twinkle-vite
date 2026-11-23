import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAskSuggestions } from '../src/containers/App/QuickAsk/askSuggestionRules';

// The chips above Zero/Ciel's boxes: about this page and what the member
// really did, never about something they don't have.

const texts = (chips: { text: string }[]) => chips.map((chip) => chip.text);

test('a post page offers Explain and Summarize, carrying the post as Ask context', () => {
  const chips = buildAskSuggestions({ pathname: '/subjects/12', fallback: ['general'] });
  assert.deepEqual(texts(chips).slice(0, 2), ['Explain this post', 'Summarize the replies']);
  assert.deepEqual(chips[0].context, { kind: 'subject', id: 12, label: 'this post', path: '/subjects/12' });
  assert.equal(chips[1].context?.focus, 'replies');
  assert.equal(buildAskSuggestions({ pathname: '/videos/9' })[0].context?.kind, 'video');
  assert.equal(buildAskSuggestions({ pathname: '/comments/3' })[0].text, 'Explain this comment');
});

test('Word Master chips name only words the member really has', () => {
  const none = texts(buildAskSuggestions({ pathname: '/chat/vocabulary', chatType: 'vocabulary' }));
  assert.ok(!none.some((text) => /recent words|in a sentence|mean\?|remember/.test(text)), none.join('|'));
  const some = buildAskSuggestions({
    pathname: '/chat/vocabulary',
    chatType: 'vocabulary',
    activity: { recentWords: ['brave', 'calm'], wordleWord: 'plant', escapedWord: 'curious' }
  });
  assert.deepEqual(texts(some), [
    'Quiz me on my recent words',
    'Use “brave” in a sentence',
    'What does “plant” mean?',
    'Help me remember “curious”'
  ]);
  assert.match(String(some[0].context?.excerpt), /brave, calm/);
});

test('Arena offers "Explain my last result" only when there is one', () => {
  assert.ok(!texts(buildAskSuggestions({ pathname: '/arena' })).includes('Explain my last result'));
  const chips = buildAskSuggestions({
    pathname: '/arena',
    activity: { arenaResult: { battleId: 31, exam: 'CSAT English', score: '72 / 100', grade: '3등급' } }
  });
  assert.equal(chips[0].text, 'Explain my last result');
  assert.equal(chips[0].context?.path, '/arena?mode=arena&battle=31');
  assert.equal(chips[0].context?.excerpt, 'CSAT English: 72 / 100, 3등급');
  // the page's chip stands for the anywhere one
  assert.ok(!texts(chips).includes('Explain my last Arena result'));
});

test('chat, apps and profiles get their own chips; another member’s profile says nothing about them', () => {
  const chat = buildAskSuggestions({ pathname: '/chat/123', lastChatMessage: '안녕! 뭐해?' });
  assert.equal(chat[0].text, 'Translate the last message');
  assert.equal(chat[0].context?.excerpt, '안녕! 뭐해?');
  assert.ok(!texts(buildAskSuggestions({ pathname: '/chat/123' })).includes('Translate the last message'));
  assert.equal(buildAskSuggestions({ pathname: '/app/55' })[0].context?.kind, 'build');
  assert.equal(buildAskSuggestions({ pathname: '/build/55' })[0].text, 'Help me improve this app');
  const own = texts(buildAskSuggestions({ pathname: '/users/Mina', myUsername: 'mina' }));
  assert.ok(own.includes('Help me make my profile look cool'));
  const other = buildAskSuggestions({ pathname: '/users/ken', myUsername: 'mina' });
  assert.ok(other.every((chip) => !chip.context && !/ken/i.test(chip.text)));
});

test('activity chips follow the member anywhere, then the fallback; never more than four', () => {
  const chips = texts(
    buildAskSuggestions({
      pathname: '/',
      activity: { wordleWord: 'plant', escapedWord: 'curious' },
      fallback: ['a', 'b', 'c']
    })
  );
  assert.deepEqual(chips, ['What does “plant” mean?', 'Help me remember “curious”', 'a', 'b']);
  assert.deepEqual(texts(buildAskSuggestions({ pathname: '/', fallback: ['x'] })), ['x']);
});
