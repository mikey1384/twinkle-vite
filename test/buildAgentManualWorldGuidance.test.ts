import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAgentManualText } from '../src/containers/Build/PreviewPanel/AgentManualPane';

test('the Build agent manual requires bounded coalesced world updates', () => {
  const manual = buildAgentManualText(null);

  assert.match(manual, /queue only changed presence/);
  assert.match(manual, /replace an older queued snapshot with the newest one/);
  assert.match(manual, /at most one request in flight/);
  assert.match(manual, /Never call or await updatePresence every animation frame/);
  assert.match(manual, /actions must not be automatically retried/);
  assert.match(manual, /WORLD_EVENT_RATE_LIMITED/);
  assert.match(manual, /without an immediate retry/);
});
