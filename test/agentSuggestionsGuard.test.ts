import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SUGGESTION_TAP_GUARD_MS,
  shouldIgnoreSuggestionTap
} from '../src/containers/Chat/Body/MessagesContainer/MessageInput/agentSuggestionsGuard';
import {
  readCachedStarters,
  writeCachedStarters
} from '../src/containers/Chat/Body/MessagesContainer/MessageInput/agentStartersCache';

test('a pointer tap right after the chips appear is ignored, a later one passes', () => {
  const shownAt = 10_000;
  assert.equal(
    shouldIgnoreSuggestionTap({ now: shownAt + 50, shownAt, clickDetail: 1 }),
    true
  );
  assert.equal(
    shouldIgnoreSuggestionTap({
      now: shownAt + SUGGESTION_TAP_GUARD_MS - 1,
      shownAt,
      clickDetail: 1
    }),
    true
  );
  assert.equal(
    shouldIgnoreSuggestionTap({
      now: shownAt + SUGGESTION_TAP_GUARD_MS,
      shownAt,
      clickDetail: 1
    }),
    false
  );
});

test('keyboard activation is never guarded', () => {
  assert.equal(
    shouldIgnoreSuggestionTap({ now: 10_010, shownAt: 10_000, clickDetail: 0 }),
    false
  );
});

test('starter cache round-trips per user and day and survives broken storage', () => {
  const map = new Map<string, string>();
  const storage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v)
  };
  const day1 = Date.UTC(2026, 10, 15, 12);
  const day2 = Date.UTC(2026, 10, 16, 1);
  writeCachedStarters(7, ['a', 'b'], storage, day1);
  assert.deepEqual(readCachedStarters(7, storage, day1), ['a', 'b']);
  assert.deepEqual(readCachedStarters(8, storage, day1), []);
  assert.deepEqual(readCachedStarters(7, storage, day2), []);
  const broken = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('full');
    }
  };
  assert.deepEqual(readCachedStarters(7, broken, day1), []);
  writeCachedStarters(7, ['a'], broken, day1);
  map.set('twinkle:agentStarters:9:2026-11-15', '{bad');
  assert.deepEqual(readCachedStarters(9, storage, day1), []);
});
