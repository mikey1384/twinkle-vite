import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAgentManualText } from '../src/containers/Build/PreviewPanel/AgentManualPane';

test('the Build agent manual advertises Three.js addons without overpromising', () => {
  const manual = buildAgentManualText(null);

  assert.match(
    manual,
    /\/build\/vendor\/three\/0\.184\.0\/three\.module\.min\.js/
  );
  assert.match(
    manual,
    /EffectComposer, RenderPass, SSAOPass\/GTAOPass, UnrealBloomPass, and OutputPass/
  );
  assert.match(
    manual,
    /\/build\/vendor\/three\/0\.184\.0\/addons\/postprocessing\/EffectComposer\.js/
  );
  assert.match(
    manual,
    /absence there is not evidence that an official addon is unavailable/
  );
  assert.match(
    manual,
    /WebGL EffectComposer passes do not work with WebGPURenderer/
  );
  assert.match(manual, /Treat addons as available tools, not defaults/);
  assert.match(manual, /not arbitrary third-party Three\.js packages/);
  assert.match(
    manual,
    /Do not remove or disable a requested visual effect as a performance tradeoff without the user's explicit approval/
  );
  assert.match(manual, /never mix the legacy core with current addons/);
  assert.match(manual, /cap render pixel ratio around 1–1\.25/);
  assert.match(manual, /Size both WebGLRenderer and EffectComposer/);
  assert.match(manual, /composer\.render\(\)/);
});
