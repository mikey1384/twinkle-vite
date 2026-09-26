import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countLumineSteps,
  resolveLumineEnergyPreflight
} from '../src/containers/Build/Editor/helpers/lumineEnergySteps';

// Shapes and rough prices of the policy's model options (units per step and
// hand-off reserve), close to production.
const option = (
  model: string,
  mode: 'auto' | 'light' | 'medium' | 'heavy',
  step: number,
  reserve: number
) =>
  ({
    model,
    mode,
    label: model,
    description: '',
    defaultReasoningEffort: 'medium',
    supportedReasoningEfforts: ['medium'],
    typicalCallEnergyUnits: step,
    handoffReserveEnergyUnits: reserve
  }) as any;
const OPTIONS = [
  option('auto', 'auto', 0, 0),
  option('gpt-6-luna', 'light', 3_300, 500),
  option('gpt-6-sol', 'medium', 41_000, 7_000),
  option('claude-opus-5-5', 'heavy', 90_000, 90_000)
];
const heavy = {
  model: 'claude-opus-5-5',
  mode: 'heavy',
  reasoningEffort: 'medium'
} as any;

test('steps are the Energy after the hand-off reserve, in whole typical rounds', () => {
  assert.equal(countLumineSteps(OPTIONS[3], 270_000), 2);
  assert.equal(countLumineSteps(OPTIONS[3], 80_000), 0);
  assert.equal(countLumineSteps(OPTIONS[0], 10), Infinity);
});

test('a model that cannot read and then edit is offered the heaviest lighter mode that can', () => {
  const preflight = resolveLumineEnergyPreflight({
    modelOptions: OPTIONS,
    selection: heavy,
    energyRemaining: 200_000
  });
  assert.equal(preflight.noStepAffordable, false);
  assert.equal(preflight.tightSelection?.currentSteps, 1);
  assert.equal(preflight.tightSelection?.lighter.model, 'gpt-6-sol');
  assert.equal(preflight.tightSelection?.lighterSteps, 4);
});

test('enough steps, Auto, or no number to go on: nothing to say', () => {
  for (const [selection, energyRemaining] of [
    [heavy, 600_000],
    [{ model: 'auto', mode: 'auto', reasoningEffort: 'medium' }, 200_000],
    [heavy, undefined]
  ] as const) {
    const preflight = resolveLumineEnergyPreflight({
      modelOptions: OPTIONS,
      selection: selection as any,
      energyRemaining: energyRemaining as any
    });
    assert.equal(preflight.tightSelection, null);
    assert.equal(preflight.noStepAffordable, false);
  }
});

test('not even one step on the lightest model disables the composer instead of offering a switch', () => {
  const preflight = resolveLumineEnergyPreflight({
    modelOptions: OPTIONS,
    selection: heavy,
    energyRemaining: 1_800
  });
  assert.equal(preflight.noStepAffordable, true);
  assert.equal(preflight.tightSelection, null);
});
