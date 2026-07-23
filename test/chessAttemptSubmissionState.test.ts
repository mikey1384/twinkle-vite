import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  areNormalAttemptTransitionsLocked,
  getChessAttemptRequestStatus,
  type NormalAttemptSubmissionState
} from '../src/containers/Home/ChessPuzzleModal/normalAttemptSubmission';

test('normal chess transitions stay locked until attempt submission is canonical', () => {
  const states: Array<{
    state: NormalAttemptSubmissionState;
    locked: boolean;
  }> = [
    { state: { status: 'idle' }, locked: false },
    {
      state: { status: 'submitting', result: { solved: true } },
      locked: true
    },
    {
      state: {
        status: 'failed',
        result: { solved: false },
        message: 'Retry'
      },
      locked: true
    }
  ];

  for (const { state, locked } of states) {
    assert.equal(areNormalAttemptTransitionsLocked(state), locked);
  }
});

test('canonical conflict status survives the request helper error boundary', () => {
  assert.equal(
    getChessAttemptRequestStatus({
      status: 409,
      message: 'Attempt already recorded'
    }),
    409
  );
  assert.equal(getChessAttemptRequestStatus(new Error('offline')), null);
});

test('modal gates every normal puzzle transition and exposes retry UI', () => {
  const modalSource = readFileSync(
    new URL(
      '../src/containers/Home/ChessPuzzleModal/index.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const actionSource = readFileSync(
    new URL(
      '../src/containers/Home/ChessPuzzleModal/Puzzle/ActionButtons.tsx',
      import.meta.url
    ),
    'utf8'
  );

  for (const handler of [
    'handleMoveToNextPuzzle',
    'handleLevelChange',
    'handleStartLevel',
    'persistAndLoadLevel'
  ]) {
    const handlerSource = modalSource.slice(
      modalSource.indexOf(`function ${handler}`),
      modalSource.indexOf('\n  }', modalSource.indexOf(`function ${handler}`))
    );
    assert.match(handlerSource, /attemptTransitionsLocked/);
  }
  assert.match(modalSource, /reconcileAfterAttemptConflict/);
  assert.match(actionSource, /Retry saving result/);
  assert.match(actionSource, /attemptSubmission\.status !== 'idle'/);
});
