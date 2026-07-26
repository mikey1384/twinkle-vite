import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

// BuildEditor.tsx was folderized into Build/Editor/ and the socket hooks moved
// under hooks/useAPISocket/. All three hops below still exist, just in new
// homes: the socket hook receives interruptionReason, the terminal payload path
// preserves it, and shared-run reconciliation carries it onto the local run.
// Losing it at any hop makes a tool-limit pause look like a normal completion,
// so the user is never told the run can be resumed.
const useBuildSocketSource = readSource(
  'src/containers/App/Header/hooks/useAPISocket/useBuildSocket.ts'
);
const sharedTerminalReconciliationSource = readSource(
  'src/containers/Build/Editor/hooks/useSharedTerminalRunReconciliation.ts'
);

test('tool-limit pause completions preserve interruption reason through shared socket state', () => {
  // The union later grew energy_depleted and awaiting_approval; what matters
  // is that tool_limit still travels on this payload.
  assert.match(
    useBuildSocketSource,
    /function handleGenerateComplete\(\{[\s\S]*?interruptionReason,[\s\S]*?\}: \{[\s\S]*?interruptionReason\?:[\s\S]{0,120}'tool_limit'/m
  );
  assert.match(
    useBuildSocketSource,
    /interruptionReason: terminalPayload\.interruptionReason \?\? null/
  );
  assert.match(
    sharedTerminalReconciliationSource,
    /interruptionReason: sharedBuildRun\.interruptionReason \?\? null,/
  );
});
