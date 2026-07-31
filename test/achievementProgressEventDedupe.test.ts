import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearAchievementProgressEventMemory,
  consumeAchievementProgressEvent
} from '../src/containers/App/Header/hooks/useAPISocket/achievementProgressEventDedupe';

function createStorage() {
  const entries = new Map<string, string>();
  return {
    getItem(key: string) {
      return entries.get(key) || null;
    },
    setItem(key: string, value: string) {
      entries.set(key, value);
    }
  };
}

test('a burn progress event is consumed once across remounts and account scopes', () => {
  const storage = createStorage();
  clearAchievementProgressEventMemory();

  assert.equal(
    consumeAchievementProgressEvent({
      userId: 1,
      eventId: 'ai-card-burn:44',
      storage
    }),
    true
  );
  assert.equal(
    consumeAchievementProgressEvent({
      userId: 1,
      eventId: 'ai-card-burn:44',
      storage
    }),
    false
  );

  clearAchievementProgressEventMemory();
  assert.equal(
    consumeAchievementProgressEvent({
      userId: 1,
      eventId: 'ai-card-burn:44',
      storage
    }),
    false
  );
  assert.equal(
    consumeAchievementProgressEvent({
      userId: 2,
      eventId: 'ai-card-burn:44',
      storage
    }),
    true
  );
});

test('legacy progress events without an operation id remain displayable', () => {
  clearAchievementProgressEventMemory();
  assert.equal(
    consumeAchievementProgressEvent({ userId: 1, storage: null }),
    true
  );
  assert.equal(
    consumeAchievementProgressEvent({ userId: 1, storage: null }),
    true
  );
});
