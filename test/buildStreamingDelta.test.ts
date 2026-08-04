import assert from 'node:assert/strict';
import test from 'node:test';
import { applyBuildRunStreamUpdate } from '../src/contexts/Build/reducer';

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
    assistantMessage: {
      id: -1,
      role: 'assistant',
      content: 'hello',
      codeGenerated: null,
      streamCodePreview: 'const a = 1;',
      createdAt: 1
    },
    usageMetrics: {},
    baseProjectFiles: [],
    streamingProjectFiles: null,
    projectFilesMode: null,
    projectFilesPersisted: false,
    projectFilesFocusPath: null,
    runEvents: [],
    executionPlan: null,
    followUpPrompt: null,
    pendingToolApproval: null,
    thumbnailNudge: null,
    deferredBuildRequest: null,
    updatedAt: 1
  } as any;
}

test('Build stream deltas append while canonical snapshots replace', () => {
  const withDelta = applyBuildRunStreamUpdate(createRun(), {
    replyDelta: ' world',
    codeGeneratedDelta: '\nconst b = 2;'
  });
  assert.equal(withDelta.assistantMessage?.content, 'hello world');
  assert.equal(
    withDelta.assistantMessage?.streamCodePreview,
    'const a = 1;\nconst b = 2;'
  );

  const reconciled = applyBuildRunStreamUpdate(withDelta, {
    reply: 'canonical reply',
    codeGenerated: 'canonical code'
  });
  assert.equal(reconciled.assistantMessage?.content, 'canonical reply');
  assert.equal(
    reconciled.assistantMessage?.streamCodePreview,
    'canonical code'
  );
});
