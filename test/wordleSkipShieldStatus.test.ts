import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  isSkipShieldReady,
  normalizeSkipShieldStatus,
  shouldBlockWordleClose
} from '../src/containers/Chat/Modals/WordleModal/skipShieldStatus';
import {
  fetchCanonicalWordleState,
  normalizeCanonicalWordleState
} from '../src/containers/Chat/Modals/WordleModal/wordleCanonicalState';

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

test('Wordle shows canonical today-only skip protection before close', () => {
  const wordleModal = source(
    'src/containers/Chat/Modals/WordleModal/index.tsx'
  );
  const game = source('src/containers/Chat/Modals/WordleModal/Game/index.tsx');
  const checklist = source(
    'src/containers/Chat/Modals/WordleModal/SkipShieldChecklist.tsx'
  );
  const statusRail = source(
    'src/containers/Chat/Modals/WordleModal/StatusRail.tsx'
  );

  assert.match(wordleModal, /normalizeSkipShieldStatus/);
  assert.match(wordleModal, /void refreshSkipShieldStatus\(\)/);
  assert.match(wordleModal, /window\.addEventListener\('focus'/);
  assert.match(wordleModal, /skipShieldChecklist=\{skipShieldChecklist\}/);
  assert.match(wordleModal, /shouldBlockWordleClose\(status\)/);
  assert.match(
    wordleModal,
    /requestSequence !== skipShieldStatusRequestSequenceRef\.current[\s\S]*?return null;/
  );
  assert.match(statusRail, /isSkipShieldReady\(skipShieldChecklist\)/);
  assert.match(
    statusRail,
    /<SkipShieldChecklist checklist=\{skipShieldChecklist\} compact bare/
  );
  assert.match(checklist, /Built with Lumine today/);
  assert.match(checklist, /new projects and updates both count/);
  assert.match(checklist, /improve one you already have/);
  assert.match(checklist, /first build chat works even with an empty battery/);
  assert.match(checklist, /Tried a member's app today/);
  assert.match(
    checklist,
    /You're protected if you leave today's word unfinished/
  );
  assert.match(game, /normalizeCanonicalWordleState\(response\)/);
  assert.match(
    wordleModal,
    /void refreshCanonicalWordleState\(\);[\s\S]*?\}, \[channelId\]\);/
  );
  assert.match(
    wordleModal,
    /wordleSnapshotStatus === 'loading'[\s\S]*?Loading today's Wordle/
  );
  assert.match(
    wordleModal,
    /Loading[\s\S]*?minHeight: WORDLE_MODAL_BODY_MIN_HEIGHT/
  );
  assert.doesNotMatch(
    wordleModal,
    /Loading[\s\S]{0,180}?style=\{\{ height: '100%' \}\}/
  );
  assert.match(
    wordleModal,
    /clamp\(18rem, calc\(100dvh - 16rem\), 55rem\)/
  );
  assert.match(
    wordleModal,
    /catch \(error\)[\s\S]*?setWordleSnapshotStatus\('error'\)/
  );
  assert.equal(
    (game.match(/await updateWordleAttempt\(/g) || []).length,
    1,
    'every accepted guess crosses exactly one canonical mutation boundary'
  );
  assert.doesNotMatch(
    game,
    /socketConnected/,
    'canonical HTTP Wordle guesses must not depend on socket connectivity'
  );
  assert.doesNotMatch(game, /checkIfDuplicateWordleAttempt/);
  assert.match(game, /expectedSolution: solution/);
  assert.match(
    game,
    /canonicalState\.wordleSolution !== solution[\s\S]*?return;/
  );
  assert.match(game, /catch \(error\)[\s\S]*?await onRefreshCanonicalState\(\)/);
  assert.doesNotMatch(game, /onSetWordleGuesses/);
  assert.match(wordleModal, /if \(wordleSubmissionPending\) return/);
  assert.match(
    wordleModal,
    /wordleGuesses,[\s\S]*?wordleStats: canonicalWordleStats/
  );
});

test('persisted skip coverage overrides lossy live checklist evidence', () => {
  const covered = normalizeSkipShieldStatus({
    shieldActive: true,
    todayDodgePending: true,
    todayCovered: true,
    checklist: {
      metLumine: true,
      builtWithLumineToday: false,
      triedPeerBuildToday: false
    }
  });
  assert.ok(covered);
  assert.equal(isSkipShieldReady(covered.checklist), true);
  assert.equal(shouldBlockWordleClose(covered), false);

  const pending = normalizeSkipShieldStatus({
    shieldActive: true,
    todayDodgePending: true,
    todayCovered: false,
    checklist: {
      metLumine: true,
      hasWorkingBuild: true,
      triedPeerBuildToday: false
    }
  });
  assert.ok(pending);
  assert.equal(pending.checklist.builtWithLumineToday, true);
  assert.equal(isSkipShieldReady(pending.checklist), false);
  assert.equal(shouldBlockWordleClose(pending), true);
  assert.equal(normalizeSkipShieldStatus({}), null);
});

test('Wordle shared state accepts only a complete canonical response', () => {
  const canonical = {
    dailyTaskStatus: { wordle: { basicQualified: true } },
    wordleAttemptState: { isSolved: false, isCompleted: false },
    wordleGuesses: ['CRANE'],
    wordleSolution: 'PLANT',
    wordleWordLevel: 2,
    wordleStats: { currentStreak: 4 },
    nextDayTimeStamp: 2_000_000_000,
    needsReload: false
  };

  assert.deepEqual(normalizeCanonicalWordleState(canonical), canonical);
  assert.equal(
    normalizeCanonicalWordleState({
      ...canonical,
      wordleGuesses: undefined
    }),
    null
  );
  assert.equal(
    normalizeCanonicalWordleState({
      ...canonical,
      wordleGuesses: '["CRANE"]'
    }),
    null
  );
  assert.equal(
    normalizeCanonicalWordleState({ ...canonical, wordleStats: null }),
    null
  );
});

test('opening Wordle ignores a stale channel snapshot and loads canonical state', async () => {
  const staleChannelSnapshot = {
    wordleSolution: 'OLDIE',
    wordleGuesses: ['OLDIE']
  };
  const canonical = {
    dailyTaskStatus: { wordle: { basicQualified: false } },
    wordleAttemptState: { isSolved: false, isCompleted: false },
    wordleGuesses: [],
    wordleSolution: 'TODAY',
    wordleWordLevel: 2,
    wordleStats: { currentStreak: 4 },
    nextDayTimeStamp: 2_000_086_400,
    needsReload: false
  };
  const requestedChannelIds: number[] = [];

  const loaded = await fetchCanonicalWordleState({
    channelId: 1,
    loadWordle: async (channelId) => {
      requestedChannelIds.push(channelId);
      return canonical;
    }
  });

  assert.deepEqual(requestedChannelIds, [1]);
  assert.deepEqual(loaded, canonical);
  assert.notEqual(loaded?.wordleSolution, staleChannelSnapshot.wordleSolution);

  await assert.rejects(
    fetchCanonicalWordleState({
      channelId: 1,
      loadWordle: async () => {
        throw new Error('offline');
      }
    }),
    /offline/
  );
  await assert.rejects(
    fetchCanonicalWordleState({
      channelId: 1,
      loadWordle: async () => ({ wordleSolution: 'INCOMPLETE' })
    }),
    /invalid canonical state/
  );
});
