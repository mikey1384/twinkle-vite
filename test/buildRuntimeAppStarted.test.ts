import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  formatBuildRuntimeAppStartedLine,
  resolveBuildRuntimeAppStarted
} from '../src/containers/Build/PreviewPanel/helpers/runtimeAppStarted';

// Synthetic fixtures only. The preview SDK's booted flag is only ever a
// positive signal, so a missing one must never read as "the app did not
// start" (the Nov 2026 audit: "booted: no" on a working module app sent
// runs chasing a problem that was not there).

test('app started is yes only on the SDK signal, no only with an error and a blank screen', () => {
  const error = [{ kind: 'error' as const }];
  assert.equal(resolveBuildRuntimeAppStarted({ booted: true, meaningfulRender: false }, error), 'yes');
  assert.equal(resolveBuildRuntimeAppStarted({ booted: false, meaningfulRender: true }, []), 'not_confirmed');
  assert.equal(resolveBuildRuntimeAppStarted({ booted: false, meaningfulRender: true }, error), 'not_confirmed');
  assert.equal(resolveBuildRuntimeAppStarted({ booted: false, meaningfulRender: false }, [{ kind: 'consoleerror' as const }]), 'not_confirmed');
  assert.equal(resolveBuildRuntimeAppStarted({ booted: false, meaningfulRender: false }, error), 'no');
  assert.equal(resolveBuildRuntimeAppStarted({ booted: false, meaningfulRender: false }, [{ kind: 'unhandledrejection' as const }]), 'no');
});

test('the summary Lumine reads says not confirmed in plain words, never "booted: no"', () => {
  const line = formatBuildRuntimeAppStartedLine({ booted: false, meaningfulRender: true }, []);
  assert.match(line, /^- app started: not confirmed \(/);
  assert.match(line, /this alone is not a failure/);
  assert.doesNotMatch(line, /booted/);
  const source = readFileSync(
    new URL('../src/containers/Build/Editor/hooks/useRuntimeFollowUp.ts', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(source, /- booted: /);
  assert.match(source, /formatBuildRuntimeAppStartedLine\(health, observationState\.issues\)/);
});
