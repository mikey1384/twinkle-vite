import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const buildEditorSource = readFileSync(
  new URL('../src/containers/Build/BuildEditor.tsx', import.meta.url),
  'utf8'
);
const useBuildSocketSource = readFileSync(
  new URL('../src/containers/App/Header/useAPISocket/useBuildSocket.ts', import.meta.url),
  'utf8'
);
const buildIndexSource = readFileSync(
  new URL('../src/containers/Build/index.tsx', import.meta.url),
  'utf8'
);

test('tool-limit pause completions preserve interruption reason through shared socket state', () => {
  assert.match(
    useBuildSocketSource,
    /function handleGenerateComplete\(\{[\s\S]*?interruptionReason[\s\S]*?\}: \{[\s\S]*?interruptionReason\?: 'tool_limit' \| null;[\s\S]*?onCompleteBuildRun\(\{[\s\S]*?interruptionReason,[\s\S]*?\}\);/m
  );
  assert.match(
    buildEditorSource,
    /applyGenerateComplete\(\{[\s\S]*?interruptionReason: sharedBuildRun\.interruptionReason \?\? null,[\s\S]*?\}\);/m
  );
  assert.match(
    buildIndexSource,
    /actions\.onCompleteBuildRun\(\{[\s\S]*?interruptionReason: terminalPayload\.interruptionReason \?\? null,[\s\S]*?\}\);/m
  );
});
