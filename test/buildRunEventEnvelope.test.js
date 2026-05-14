import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const buildSocketSource = readFileSync(
  new URL(
    '../src/containers/App/Header/hooks/useAPISocket/useBuildSocket.ts',
    import.meta.url
  ),
  'utf8'
);

async function loadBuildReducer() {
  return await import('../src/contexts/Build/reducer.ts');
}

async function loadBuildResumeRunState() {
  return await import('../src/contexts/Build/resumeRunState.ts');
}

async function loadPersistedRunSnapshotHelpers() {
  return await import('../src/containers/Build/helpers/persistedRunSnapshot.ts');
}

async function loadRuntimeDebugHelpers() {
  return await import('../src/containers/Build/Editor/ChatPanel/helpers/runtimeDebug.ts');
}

function createBuildState(createInitialBuildStudioState) {
  return {
    buildRuns: {},
    buildRunRequestMap: {},
    buildWorkspaces: {},
    buildWorkspaceUi: {},
    runtimeVerifyResults: {},
    buildStudio: createInitialBuildStudioState()
  };
}

test('build reducer preserves live run-event envelope fields and stable-id dedupe', async () => {
  const { default: BuildReducer, createInitialBuildStudioState } =
    await loadBuildReducer();
  const { normalizeBuildRunEventEnvelope } = await loadBuildResumeRunState();
  let state = createBuildState(createInitialBuildStudioState);

  state = BuildReducer(state, {
    type: 'REGISTER_BUILD_RUN',
    buildRun: {
      buildId: 101,
      requestId: 'run-live-1',
      runMode: 'user',
      generating: true
    }
  });

  const firstEvent = normalizeBuildRunEventEnvelope({
    requestId: 'run-live-1',
    buildId: 101,
    userId: 202,
    event: {
      id: 'run-live-1:1',
      schemaVersion: 1,
      eventType: 'status.implementing',
      source: 'lumine.socket',
      threadId: 'lumine_thread_abc',
      requestId: 'run-live-1',
      sequence: 1,
      buildId: 101,
      userId: 202,
      kind: 'status',
      phase: 'implementing',
      message: 'Lumine is working.',
      createdAt: 10_000,
      deduped: false,
      details: { thoughtContent: 'plan', customDebug: 'kept' },
      usage: {
        stage: 'codex',
        model: 'gpt-5.4',
        inputTokens: 12,
        outputTokens: 4,
        totalTokens: 16
      }
    }
  });
  assert(firstEvent);

  state = BuildReducer(state, {
    type: 'APPEND_BUILD_RUN_EVENT',
    buildRun: {
      buildId: 101,
      requestId: 'run-live-1',
      event: firstEvent
    }
  });

  const updatedEvent = normalizeBuildRunEventEnvelope({
    requestId: 'run-live-1',
    buildId: 101,
    userId: 202,
    event: {
      ...firstEvent,
      source: 'lumine.resume',
      sequence: 2,
      message: 'Lumine is still working.',
      deduped: true,
      details: { thoughtContent: 'updated', customDebug: 'still-kept' },
      usage: {
        stage: 'codex',
        model: 'gpt-5.5',
        inputTokens: 20,
        outputTokens: 8,
        totalTokens: 28
      }
    }
  });
  assert(updatedEvent);

  state = BuildReducer(state, {
    type: 'APPEND_BUILD_RUN_EVENT',
    buildRun: {
      buildId: 101,
      requestId: 'run-live-1',
      event: updatedEvent
    }
  });

  const runEvents = state.buildRuns['101'].runEvents;
  assert.equal(runEvents.length, 1);
  assert.equal(runEvents[0].id, 'run-live-1:1');
  assert.equal(runEvents[0].schemaVersion, 1);
  assert.equal(runEvents[0].eventType, 'status.implementing');
  assert.equal(runEvents[0].source, 'lumine.resume');
  assert.equal(runEvents[0].threadId, 'lumine_thread_abc');
  assert.equal(runEvents[0].requestId, 'run-live-1');
  assert.equal(runEvents[0].sequence, 2);
  assert.equal(runEvents[0].buildId, 101);
  assert.equal(runEvents[0].userId, 202);
  assert.equal(runEvents[0].deduped, true);
  assert.equal(runEvents[0].details?.customDebug, 'still-kept');
  assert.equal(runEvents[0].usage?.model, 'gpt-5.5');
  assert.equal(runEvents[0].usage?.totalTokens, 28);
});

test('build reducer preserves rich stable-id event data when a sparse duplicate arrives', async () => {
  const { default: BuildReducer, createInitialBuildStudioState } =
    await loadBuildReducer();
  const { normalizeBuildRunEventEnvelope } = await loadBuildResumeRunState();
  let state = createBuildState(createInitialBuildStudioState);

  state = BuildReducer(state, {
    type: 'REGISTER_BUILD_RUN',
    buildRun: {
      buildId: 102,
      requestId: 'run-live-2',
      runMode: 'user',
      generating: true
    }
  });

  const richEvent = normalizeBuildRunEventEnvelope({
    requestId: 'run-live-2',
    buildId: 102,
    userId: 203,
    event: {
      id: 'run-live-2:1',
      schemaVersion: 1,
      eventType: 'status.implementing',
      source: 'lumine.socket',
      threadId: 'lumine_thread_sparse_duplicate',
      requestId: 'run-live-2',
      sequence: 1,
      buildId: 102,
      userId: 203,
      kind: 'status',
      phase: 'implementing',
      message: 'Lumine is working.',
      createdAt: 11_000,
      deduped: true,
      details: { thoughtContent: 'plan', customDebug: 'kept' },
      usage: {
        stage: 'codex',
        model: 'gpt-5.5',
        inputTokens: 18,
        outputTokens: 6,
        totalTokens: 24
      }
    }
  });
  assert(richEvent);

  state = BuildReducer(state, {
    type: 'APPEND_BUILD_RUN_EVENT',
    buildRun: {
      buildId: 102,
      requestId: 'run-live-2',
      event: richEvent
    }
  });

  const sparseDuplicate = normalizeBuildRunEventEnvelope({
    requestId: 'run-live-2',
    buildId: 102,
    userId: 203,
    event: {
      id: 'run-live-2:1',
      kind: 'status',
      phase: null,
      message: 'Legacy duplicate still has a visible message.',
      createdAt: 11_500
    }
  });
  assert(sparseDuplicate);

  state = BuildReducer(state, {
    type: 'APPEND_BUILD_RUN_EVENT',
    buildRun: {
      buildId: 102,
      requestId: 'run-live-2',
      event: sparseDuplicate
    }
  });

  const runEvents = state.buildRuns['102'].runEvents;
  assert.equal(runEvents.length, 1);
  assert.equal(runEvents[0].id, 'run-live-2:1');
  assert.equal(runEvents[0].schemaVersion, 1);
  assert.equal(runEvents[0].eventType, 'status.implementing');
  assert.equal(runEvents[0].source, 'lumine.socket');
  assert.equal(runEvents[0].threadId, 'lumine_thread_sparse_duplicate');
  assert.equal(runEvents[0].requestId, 'run-live-2');
  assert.equal(runEvents[0].sequence, 1);
  assert.equal(runEvents[0].buildId, 102);
  assert.equal(runEvents[0].userId, 203);
  assert.equal(runEvents[0].phase, 'implementing');
  assert.equal(
    runEvents[0].message,
    'Legacy duplicate still has a visible message.'
  );
  assert.equal(runEvents[0].deduped, true);
  assert.equal(runEvents[0].details?.customDebug, 'kept');
  assert.equal(runEvents[0].usage?.model, 'gpt-5.5');
  assert.equal(runEvents[0].usage?.totalTokens, 24);
});

test('resume normalization and replay preserve envelope fields while accepting minimal legacy events', async () => {
  const { normalizeBuildResumeRunState, replayBuildResumeRunState } =
    await loadBuildResumeRunState();
  const normalized = normalizeBuildResumeRunState({
    requestId: 'run-resume-1',
    buildId: 303,
    runMode: 'user',
    status: 'Recovering live response...',
    agentContext: {
      schemaVersion: 1,
      source: 'lumine_thread_history_resume',
      threadId: 'lumine_thread_resume',
      providerLineage: {
        latestTurn: {
          requestId: 'run-resume-1',
          responseId: 'resp_resume_2',
          previousResponseId: 'resp_resume_1'
        },
        totalTurnCount: 2
      }
    },
    lifecycle: {
      schemaVersion: 1,
      state: 'interrupted',
      requestId: 'run-resume-1',
      threadId: 'lumine_thread_resume',
      buildId: 303,
      userId: 404,
      terminalType: 'complete',
      interruptionReason: 'tool_limit',
      canContinue: true,
      continuation: {
        previousResponseId: 'resp_resume_2'
      }
    },
    runEvents: [
      {
        id: 'run-resume-1:4',
        schemaVersion: 1,
        eventType: 'action.implementing',
        source: 'lumine.socket',
        threadId: 'lumine_thread_resume',
        requestId: 'run-resume-1',
        sequence: 4,
        buildId: 303,
        userId: 404,
        kind: 'action',
        phase: 'implementing',
        message: 'Lumine saved a file.',
        createdAt: 20_000,
        details: { filePath: '/index.html' },
        usage: {
          stage: 'codex',
          model: 'gpt-5.5',
          inputTokens: 20,
          outputTokens: 5,
          totalTokens: 25
        }
      },
      {
        id: 'run-resume-1:5',
        schemaVersion: 1,
        eventType: 'lifecycle.continuation.consumed',
        source: 'lumine.copilot',
        threadId: 'lumine_thread_resume',
        requestId: 'run-resume-1',
        sequence: 5,
        buildId: 303,
        userId: 404,
        kind: 'lifecycle',
        phase: 'continuation.consumed',
        message: 'Lumine continued from the paused response chain.',
        createdAt: 20_500,
        details: {
          continuation: {
            status: 'consumed',
            providerChainAction: 'continue',
            previousResponseId: 'resp_resume_2',
            anchorRequestId: 'run-paused-1',
            currentRequestId: 'run-resume-1',
            providerChainControl: {
              schemaVersion: 1,
              action: 'continue',
              status: 'consumed',
              reason: 'follow_up_accept_prompt',
              previousResponseId: 'resp_resume_2',
              anchorRequestId: 'run-paused-1',
              currentRequestId: 'run-resume-1',
              threadId: 'lumine_thread_resume',
              buildId: 303,
              userId: 404,
              lifecycleState: 'interrupted',
              interruptionReason: 'tool_limit',
              stopReason: null,
              source: 'interruption',
              promptBindingKind: 'follow_up_accept',
              planAction: 'continue'
            }
          }
        }
      },
      {
        kind: 'status',
        phase: 'planning',
        message: 'Older event still works.',
        createdAt: 21_000
      }
    ]
  });

  assert.equal(normalized.runEvents.length, 3);
  assert.equal(normalized.runEvents[0].schemaVersion, 1);
  assert.equal(normalized.runEvents[0].eventType, 'action.implementing');
  assert.equal(normalized.runEvents[0].source, 'lumine.socket');
  assert.equal(normalized.runEvents[0].threadId, 'lumine_thread_resume');
  assert.equal(normalized.runEvents[0].requestId, 'run-resume-1');
  assert.equal(normalized.runEvents[0].sequence, 4);
  assert.equal(normalized.runEvents[0].buildId, 303);
  assert.equal(normalized.runEvents[0].userId, 404);
  assert.equal(normalized.runEvents[0].details?.filePath, '/index.html');
  assert.equal(normalized.runEvents[0].usage?.model, 'gpt-5.5');
  assert.equal(normalized.runEvents[1].schemaVersion, 1);
  assert.equal(
    normalized.runEvents[1].details?.continuation?.status,
    'consumed'
  );
  assert.equal(
    normalized.runEvents[1].details?.continuation?.previousResponseId,
    'resp_resume_2'
  );
  assert.equal(
    normalized.runEvents[1].details?.continuation?.providerChainControl?.action,
    'continue'
  );
  assert.equal(
    normalized.agentContext?.providerLineage?.latestTurn?.responseId,
    'resp_resume_2'
  );
  assert.equal(normalized.lifecycle?.state, 'interrupted');
  assert.equal(
    normalized.lifecycle?.continuation?.previousResponseId,
    'resp_resume_2'
  );
  assert.match(normalized.runEvents[2].id, /^legacy:/);
  assert.equal(normalized.runEvents[2].schemaVersion, null);
  assert.equal(normalized.runEvents[2].message, 'Older event still works.');

  const replayedEvents = [];
  replayBuildResumeRunState({
    normalized,
    onRunningSnapshot(runningSnapshot) {
      replayedEvents.push({
        kind: 'running_snapshot',
        threadId: runningSnapshot.agentContext?.threadId,
        lifecycleState: runningSnapshot.lifecycle?.state,
        responseId:
          runningSnapshot.agentContext?.providerLineage?.latestTurn?.responseId
      });
    },
    onRunEvent(event) {
      replayedEvents.push(event);
    }
  });

  assert.equal(replayedEvents.length, 4);
  assert.equal(replayedEvents[0].kind, 'running_snapshot');
  assert.equal(replayedEvents[0].threadId, 'lumine_thread_resume');
  assert.equal(replayedEvents[0].lifecycleState, 'interrupted');
  assert.equal(replayedEvents[0].responseId, 'resp_resume_2');
  assert.equal(replayedEvents[1].threadId, 'lumine_thread_resume');
  assert.equal(replayedEvents[1].usage?.totalTokens, 25);
  assert.equal(
    replayedEvents[2].details?.continuation?.previousResponseId,
    'resp_resume_2'
  );
  assert.equal(
    replayedEvents[2].details?.continuation?.providerChainControl?.action,
    'continue'
  );
  assert.equal(replayedEvents[3].message, 'Older event still works.');
});

test('resume normalization preserves conflict lifecycle metadata', async () => {
  const { normalizeBuildResumeRunState, replayBuildResumeRunState } =
    await loadBuildResumeRunState();
  const conflictState = {
    schemaVersion: 1,
    source: 'lumine.conflict_state',
    status: 'blocked',
    reason: 'markers_remaining',
    requestId: 'run-conflict-1',
    threadId: 'lumine_thread_conflict',
    buildId: 909,
    userId: 1001,
    markerFiles: [
      {
        path: '/game.js',
        lineNumbers: [2, 4, 6],
        markerCount: 3
      }
    ],
    markerPathCount: 1,
    markerCount: 3,
    inspectedPaths: ['/game.js'],
    previousStatus: 'validation',
    createdAt: 40_000,
    updatedAt: 41_000,
    resolvedAt: null,
    blockedAt: 41_000
  };
  const normalized = normalizeBuildResumeRunState({
    requestId: 'run-conflict-1',
    buildId: 909,
    agentContext: {
      schemaVersion: 1,
      source: 'lumine_thread_history_resume',
      threadId: 'lumine_thread_conflict',
      conflictState
    },
    lifecycle: {
      schemaVersion: 1,
      state: 'running',
      requestId: 'run-conflict-1',
      conflictState
    },
    runEvents: [
      {
        id: 'run-conflict-1:1',
        schemaVersion: 1,
        eventType: 'lifecycle.conflict.blocked',
        source: 'lumine.copilot',
        threadId: 'lumine_thread_conflict',
        requestId: 'run-conflict-1',
        sequence: 1,
        buildId: 909,
        userId: 1001,
        kind: 'lifecycle',
        phase: 'conflict.blocked',
        message:
          'Lumine still sees marked cleanup spots. Next step: keep working on those files.',
        createdAt: 41_000,
        details: {
          conflictState
        }
      }
    ]
  });

  assert.equal(normalized.agentContext?.conflictState?.status, 'blocked');
  assert.equal(
    normalized.lifecycle?.conflictState?.reason,
    'markers_remaining'
  );
  assert.equal(
    normalized.runEvents[0].details?.conflictState?.markerFiles[0].path,
    '/game.js'
  );

  const replayedEvents = [];
  replayBuildResumeRunState({
    normalized,
    onRunningSnapshot(runningSnapshot) {
      replayedEvents.push(runningSnapshot);
    },
    onRunEvent(event) {
      replayedEvents.push(event);
    }
  });
  assert.equal(
    replayedEvents[0].agentContext?.conflictState?.status,
    'blocked'
  );
  assert.equal(
    replayedEvents[1].details?.conflictState?.previousStatus,
    'validation'
  );
});

test('persisted snapshot coverage requires run-event envelope metadata', async () => {
  const { normalizeBuildResumeRunState } = await loadBuildResumeRunState();
  const { isPersistedSnapshotEquivalentOrNewer } =
    await loadPersistedRunSnapshotHelpers();
  const normalized = normalizeBuildResumeRunState({
    requestId: 'run-envelope-coverage',
    buildId: 707,
    status: 'Running',
    assistantStatusSteps: ['Running'],
    lastActivityAt: 30_000,
    runEvents: [
      {
        id: 'run-envelope-coverage:1',
        schemaVersion: 1,
        eventType: 'lifecycle.provider_compaction.compacted',
        source: 'lumine.socket',
        threadId: 'lumine_thread_coverage',
        requestId: 'run-envelope-coverage',
        sequence: 1,
        buildId: 707,
        userId: 808,
        kind: 'lifecycle',
        phase: 'provider_compaction.compacted',
        message: 'Lumine compacted the provider context for this run.',
        createdAt: 30_000,
        deduped: true,
        details: {
          responsesCompaction: {
            status: 'compacted',
            providerContextCarriedForward: true
          }
        }
      }
    ]
  });
  const matchingEvent = {
    id: 'run-envelope-coverage:1',
    schemaVersion: 1,
    eventType: 'lifecycle.provider_compaction.compacted',
    source: 'lumine.socket',
    threadId: 'lumine_thread_coverage',
    requestId: 'run-envelope-coverage',
    sequence: 1,
    buildId: 707,
    userId: 808,
    kind: 'lifecycle',
    phase: 'provider_compaction.compacted',
    message: 'Lumine compacted the provider context for this run.',
    createdAt: 30_000,
    deduped: true,
    details: {
      responsesCompaction: {
        status: 'compacted',
        providerContextCarriedForward: true
      }
    }
  };
  const currentRun = {
    buildId: 707,
    requestId: 'run-envelope-coverage',
    runMode: 'user',
    generating: true,
    terminalState: null,
    stopReason: null,
    interruptionReason: null,
    error: null,
    status: 'Running',
    assistantStatusSteps: ['Running'],
    agentContext: null,
    lifecycle: null,
    usageMetrics: {},
    runEvents: [
      {
        id: matchingEvent.id,
        kind: matchingEvent.kind,
        phase: matchingEvent.phase,
        message: matchingEvent.message,
        createdAt: matchingEvent.createdAt,
        deduped: matchingEvent.deduped,
        details: matchingEvent.details
      }
    ],
    userMessage: null,
    assistantMessage: null,
    baseProjectFiles: [],
    streamingProjectFiles: null,
    streamingFocusFilePath: null,
    updatedAt: 30_000
  };

  assert.equal(
    isPersistedSnapshotEquivalentOrNewer({
      currentRun,
      normalized
    }),
    false
  );
  assert.equal(
    isPersistedSnapshotEquivalentOrNewer({
      currentRun: {
        ...currentRun,
        runEvents: [matchingEvent]
      },
      normalized
    }),
    true
  );
});

test('build reducer preserves lifecycle metadata through running and terminal replay', async () => {
  const { default: BuildReducer, createInitialBuildStudioState } =
    await loadBuildReducer();
  let state = createBuildState(createInitialBuildStudioState);

  state = BuildReducer(state, {
    type: 'REGISTER_BUILD_RUN',
    buildRun: {
      buildId: 505,
      requestId: 'run-lifecycle-1',
      runMode: 'user',
      generating: true
    }
  });

  state = BuildReducer(state, {
    type: 'APPLY_BUILD_RUN_RUNNING_SNAPSHOT',
    buildRun: {
      buildId: 505,
      requestId: 'run-lifecycle-1',
      runningSnapshot: {
        status: 'Running',
        assistantStatusSteps: ['Running'],
        lifecycle: {
          schemaVersion: 1,
          state: 'running',
          requestId: 'run-lifecycle-1'
        }
      }
    }
  });

  assert.equal(state.buildRuns['505'].lifecycle?.state, 'running');

  state = BuildReducer(state, {
    type: 'COMPLETE_BUILD_RUN',
    buildRun: {
      buildId: 505,
      requestId: 'run-lifecycle-1',
      lifecycle: {
        schemaVersion: 1,
        state: 'interrupted',
        requestId: 'run-lifecycle-1',
        canContinue: true,
        continuation: {
          previousResponseId: 'resp_lifecycle'
        }
      }
    }
  });

  assert.equal(state.buildRuns['505'].terminalState, 'complete');
  assert.equal(state.buildRuns['505'].lifecycle?.state, 'interrupted');
  assert.equal(
    state.buildRuns['505'].lifecycle?.continuation?.previousResponseId,
    'resp_lifecycle'
  );
});

test('live socket handler normalizes the run-event envelope before appending', () => {
  assert.match(
    buildSocketSource,
    /const normalizedEvent = normalizeBuildRunEventEnvelope\(\{[\s\S]*?event,[\s\S]*?requestId: normalizedRequestId,[\s\S]*?buildId: resolvedRun\.buildId,[\s\S]*?userId[\s\S]*?\}\);/m
  );
  assert.match(
    buildSocketSource,
    /onAppendBuildRunEvent\(\{[\s\S]*?requestId: normalizedRequestId,[\s\S]*?event: normalizedEvent[\s\S]*?\}\);/m
  );
});

test('live socket terminal handlers preserve lifecycle metadata', () => {
  assert.match(
    buildSocketSource,
    /function handleGenerateComplete\(\{[\s\S]*?lifecycle,[\s\S]*?onCompleteBuildRun\(\{[\s\S]*?lifecycle: lifecycle \?\? null/m
  );
  assert.match(
    buildSocketSource,
    /function handleGenerateError\(\{[\s\S]*?lifecycle[\s\S]*?onFailBuildRun\(\{[\s\S]*?lifecycle: lifecycle \?\? null/m
  );
  assert.match(
    buildSocketSource,
    /function handleGenerateStopped\(\{[\s\S]*?stopReason,[\s\S]*?lifecycle[\s\S]*?onStopBuildRun\(\{[\s\S]*?stopReason: stopReason \|\| null,[\s\S]*?lifecycle: lifecycle \?\? null/m
  );
  assert.match(
    buildSocketSource,
    /onRunningSnapshot: \(runningSnapshot\) => \{[\s\S]*?runningSnapshot: \{[\s\S]*?lifecycle: runningSnapshot\.lifecycle/m
  );
});

test('runtime debug projection summarizes durable run metadata without changing replay shape', async () => {
  const { buildLumineRuntimeDebugSnapshot } = await loadRuntimeDebugHelpers();
  const snapshot = buildLumineRuntimeDebugSnapshot({
    requestId: 'run-debug-1',
    agentContext: {
      threadId: 'lumine_thread_debug',
      providerLineage: {
        providerChainControl: {
          schemaVersion: 1,
          action: 'continue',
          status: 'consumed'
        }
      },
      conflictState: {
        schemaVersion: 1,
        status: 'blocked',
        reason: 'markers_remaining'
      },
      responsesCompaction: {
        schemaVersion: 1,
        status: 'compacted',
        compactionItems: [{ id: 'cmp_debug' }]
      }
    },
    lifecycle: {
      schemaVersion: 1,
      state: 'interrupted',
      terminalType: 'complete',
      requestId: 'run-debug-1',
      threadId: 'lumine_thread_debug',
      interruptionReason: 'tool_limit',
      canContinue: true
    },
    runEvents: [
      {
        id: 'run-debug-1:4',
        schemaVersion: 1,
        eventType: 'lifecycle.continuation.consumed',
        source: 'lumine.copilot',
        threadId: 'lumine_thread_debug',
        requestId: 'run-debug-1',
        sequence: 4,
        buildId: 909,
        userId: 1001,
        kind: 'lifecycle',
        phase: 'continuation.consumed',
        message: 'Lumine continued from the paused response chain.',
        createdAt: 55_000,
        details: {
          continuation: {
            providerChainControl: {
              schemaVersion: 1,
              action: 'continue',
              status: 'consumed'
            }
          }
        }
      }
    ]
  });

  assert(snapshot);
  assert.equal(snapshot.requestId, 'run-debug-1');
  assert.equal(snapshot.threadId, 'lumine_thread_debug');
  assert.equal(snapshot.lifecycle?.state, 'interrupted');
  assert.equal(snapshot.providerChainControl?.action, 'continue');
  assert.equal(snapshot.conflictState?.status, 'blocked');
  assert.equal(
    snapshot.responsesCompaction?.compactionItems?.[0]?.id,
    'cmp_debug'
  );
  assert.equal(
    snapshot.eventEnvelope?.eventType,
    'lifecycle.continuation.consumed'
  );
  assert.match(snapshot.compactJson, /"requestId": "run-debug-1"/);
});
