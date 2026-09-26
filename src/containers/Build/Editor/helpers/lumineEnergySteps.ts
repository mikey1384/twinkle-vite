import type {
  BuildLumineMode,
  BuildLumineModelOption,
  BuildLumineModelPreference
} from '../ChatPanel/types';

// Before a run starts: how many steps (tool rounds) each Lumine model can
// afford with the Energy that is left. The server prices a step at the
// model's typical round and sets a hand-off reserve aside first
// (helpers/build/lumine/copilot/energyBudget.ts); this is the same sum.
//
// A change to a project takes a step to read and a step to edit, so fewer
// than two steps usually saves nothing. The server refuses such a run before
// spending and offers a lighter model; this lets the page say so before the
// message is sent. With not even one step on any model, the composer is
// disabled instead of taking a message that stops at once.
export const LUMINE_MIN_STEPS_FOR_PROJECT_EDIT = 2;

const MODE_RANK: Record<BuildLumineMode, number> = {
  auto: -1,
  light: 0,
  medium: 1,
  heavy: 2
};

export function countLumineSteps(
  option: BuildLumineModelOption,
  energyRemaining: number
) {
  const stepUnits = Number(option.typicalCallEnergyUnits) || 0;
  if (stepUnits <= 0) return Infinity;
  const reserve = Number(option.handoffReserveEnergyUnits) || 0;
  return Math.floor(Math.max(energyRemaining - reserve, 0) / stepUnits);
}

export interface LumineEnergyPreflight {
  // Not even one step on any model: the composer is disabled.
  noStepAffordable: boolean;
  // The chosen model cannot read and then edit; a lighter one can.
  tightSelection: {
    current: BuildLumineModelOption;
    currentSteps: number;
    lighter: BuildLumineModelOption;
    lighterSteps: number;
  } | null;
}

export function resolveLumineEnergyPreflight({
  modelOptions,
  selection,
  energyRemaining
}: {
  modelOptions: BuildLumineModelOption[];
  selection?: BuildLumineModelPreference | null;
  energyRemaining?: number | null;
}): LumineEnergyPreflight {
  const none = { noStepAffordable: false, tightSelection: null };
  if (typeof energyRemaining !== 'number' || !Number.isFinite(energyRemaining))
    return none;
  // Auto picks its own model per request, so only real models are counted.
  const priced = modelOptions.filter(
    (option) =>
      option.mode !== 'auto' && Number(option.typicalCallEnergyUnits) > 0
  );
  if (priced.length === 0) return none;
  const noStepAffordable = priced.every(
    (option) => countLumineSteps(option, energyRemaining) < 1
  );
  const current = selection
    ? priced.find((option) => option.model === selection.model)
    : undefined;
  if (noStepAffordable || !current) {
    return { noStepAffordable, tightSelection: null };
  }
  const currentSteps = countLumineSteps(current, energyRemaining);
  if (currentSteps >= LUMINE_MIN_STEPS_FOR_PROJECT_EDIT) return none;
  // The heaviest lighter mode that can still read and edit.
  const lighter = priced
    .filter(
      (option) =>
        MODE_RANK[option.mode] < MODE_RANK[current.mode] &&
        countLumineSteps(option, energyRemaining) >=
          LUMINE_MIN_STEPS_FOR_PROJECT_EDIT
    )
    .sort((left, right) => MODE_RANK[right.mode] - MODE_RANK[left.mode])[0];
  if (!lighter) return none;
  return {
    noStepAffordable: false,
    tightSelection: {
      current,
      currentSteps,
      lighter,
      lighterSteps: countLumineSteps(lighter, energyRemaining)
    }
  };
}
