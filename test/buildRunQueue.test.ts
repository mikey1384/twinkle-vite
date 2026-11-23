import assert from 'node:assert/strict';
import test from 'node:test';
import BuildReducer, {
  applyBuildRunStreamUpdate,
  normalizeBuildRunQueueState
} from '../src/contexts/Build/reducer';
import { normalizeBuildResumeRunState } from '../src/contexts/Build/resumeRunState';
import { describeBuildRunQueue } from '../src/containers/Build/Editor/ChatPanel/helpers/queue';

function createRun() {
  return {
    buildId: 1,
    requestId: 'run-1',
    runMode: 'user',
    generating: true,
    error: null,
    status: null,
    assistantStatusSteps: [],
    userMessage: null,
    assistantMessage: null,
    usageMetrics: {},
    baseProjectFiles: [],
    streamingProjectFiles: null,
    streamingFocusFilePath: null,
    runEvents: [],
    updatedAt: 1
  } as any;
}

test('queue card copy: next in line, builds ahead, and no estimate without one', () => {
  assert.deepEqual(
    describeBuildRunQueue({ position: 1, ahead: 1, etaMinutes: { low: 1, high: 3 } }),
    {
      headline: "You're next in line",
      detail: 'Another build is finishing · about 1–3 min'
    }
  );
  assert.deepEqual(
    describeBuildRunQueue({ position: 2, ahead: 2, etaMinutes: { low: 4, high: 9 } }),
    {
      headline: '2 builds ahead of you',
      detail: 'Lumine starts yours when a spot opens · about 4–9 min'
    }
  );
  assert.equal(
    describeBuildRunQueue({ position: 1, ahead: 1, etaMinutes: null }).detail,
    'Another build is finishing'
  );
});

test('queue state keeps counts only and drops anything malformed', () => {
  assert.deepEqual(
    normalizeBuildRunQueueState({
      position: 2,
      ahead: 3,
      etaMinutes: { low: 2, high: 5 },
      userId: 7,
      buildId: 99
    }),
    { position: 2, ahead: 3, etaMinutes: { low: 2, high: 5 } }
  );
  assert.equal(normalizeBuildRunQueueState({ position: 0, ahead: 1 }), null);
  assert.equal(normalizeBuildRunQueueState(null), null);
  assert.deepEqual(
    normalizeBuildRunQueueState({ position: 1, ahead: 1, etaMinutes: { low: 3, high: 3 } }),
    { position: 1, ahead: 1, etaMinutes: null }
  );
});

test('queued → working: the first update without a queue ends the queued state and its step', () => {
  const queued = applyBuildRunStreamUpdate(createRun(), {
    status: "You're next in line: another build is finishing (about 1–3 min)",
    assistantStatusSteps: [
      "You're next in line: another build is finishing (about 1–3 min)"
    ],
    queue: { position: 1, ahead: 1, etaMinutes: { low: 1, high: 3 } }
  });
  assert.deepEqual(queued.queue, {
    position: 1,
    ahead: 1,
    etaMinutes: { low: 1, high: 3 }
  });
  // A stream update with no queue field (e.g. a resume stream replay) keeps it.
  const replayed = applyBuildRunStreamUpdate(queued, { reply: '' });
  assert.ok(replayed.queue);
  // The socket handler always sends queue (null when absent) with a status
  // update; the run's own steps replace the queued line.
  const working = applyBuildRunStreamUpdate(queued, {
    status: 'Reading your project',
    assistantStatusSteps: ['Reading your project'],
    queue: null
  });
  assert.equal(working.queue, null);
  assert.deepEqual(working.assistantStatusSteps, ['Reading your project']);
});

test('a reload restores the place in line from the resume snapshot', () => {
  const normalized = normalizeBuildResumeRunState({
    requestId: 'run-1',
    buildId: 1,
    status: "You're next in line: another build is finishing",
    assistantStatusSteps: ["You're next in line: another build is finishing"],
    queue: { position: 1, ahead: 1, etaMinutes: null }
  });
  assert.deepEqual(normalized.queue, { position: 1, ahead: 1, etaMinutes: null });
  assert.equal(
    normalizeBuildResumeRunState({ requestId: 'run-1', buildId: 1 }).queue,
    null
  );
});

test('queued → working: once the run has events, a late queue update cannot bring the card back', () => {
  const queue = { position: 1, ahead: 1, etaMinutes: null };
  const started = { ...createRun(), queue, runEvents: [{ id: 'e1', kind: 'status', message: 'Reading' }] };
  const late = applyBuildRunStreamUpdate(started, {
    status: "You're next in line: another build is finishing",
    assistantStatusSteps: ["You're next in line: another build is finishing"],
    queue
  });
  assert.equal(late.queue, null);
});

test('the first run event and a local Stopping status both end the queued state', () => {
  const queue = { position: 2, ahead: 2, etaMinutes: { low: 3, high: 6 } };
  const state = {
    buildsById: {},
    buildRuns: { '1': { ...createRun(), queue } },
    buildRunRequestMap: { 'run-1': 1 },
    buildWorkspaces: {},
    buildWorkspaceUi: {},
    forumInvalidationVersions: {}
  } as any;
  const afterEvent = BuildReducer(state, {
    type: 'APPEND_BUILD_RUN_EVENT',
    buildRun: {
      buildId: 1,
      requestId: 'run-1',
      event: { id: 'e1', kind: 'status', phase: null, message: 'Reading', createdAt: 1 }
    }
  } as any);
  assert.equal(afterEvent.buildRuns['1'].queue, null);
  const afterStop = BuildReducer(state, {
    type: 'UPDATE_BUILD_RUN_STATUS',
    buildRun: { buildId: 1, requestId: 'run-1', status: 'Stopping...' }
  } as any);
  assert.equal(afterStop.buildRuns['1'].queue, null);
});
