import type {
  BuildCopilotPolicy,
  BuildLumineModel,
  BuildLumineModelOption,
  BuildLumineModelPreference,
  BuildLumineThinkLevel
} from '../ChatPanel/types';

export const DEFAULT_LUMINE_MODEL: BuildLumineModel = 'gpt-5.4';
export const DEFAULT_LUMINE_THINK_LEVEL: BuildLumineThinkLevel = 'medium';

export const LUMINE_THINK_LEVEL_LABELS: Record<BuildLumineThinkLevel, string> =
  {
    none: 'none',
    low: 'low',
    medium: 'medium',
    high: 'high',
    xhigh: 'xhigh'
  };

const ALL_LUMINE_THINK_LEVELS: BuildLumineThinkLevel[] = [
  'low',
  'medium',
  'high',
  'xhigh'
];

const FALLBACK_LUMINE_MODEL_OPTIONS: BuildLumineModelOption[] = [
  {
    model: 'gpt-5.5',
    label: 'GPT-5.5',
    description: 'Best for tricky builds.',
    defaultReasoningEffort: DEFAULT_LUMINE_THINK_LEVEL,
    supportedReasoningEfforts: ALL_LUMINE_THINK_LEVELS
  },
  {
    model: 'claude-opus-4-8',
    label: 'Claude Opus 4.8',
    description: 'Powerful reasoning for ambitious builds.',
    defaultReasoningEffort: 'high',
    supportedReasoningEfforts: ALL_LUMINE_THINK_LEVELS
  },
  {
    model: 'claude-fable-5',
    label: 'Claude Fable 5',
    description: 'Deepest thinker for the hardest builds.',
    defaultReasoningEffort: 'high',
    supportedReasoningEfforts: ALL_LUMINE_THINK_LEVELS
  },
  {
    model: 'gpt-5.4',
    label: 'GPT-5.4',
    description: 'Quick and steady.',
    defaultReasoningEffort: DEFAULT_LUMINE_THINK_LEVEL,
    supportedReasoningEfforts: ALL_LUMINE_THINK_LEVELS
  }
];

function isLumineModel(value: unknown): value is BuildLumineModel {
  return (
    value === 'gpt-5.5' ||
    value === 'claude-opus-4-8' ||
    value === 'claude-fable-5' ||
    value === 'gpt-5.4'
  );
}

function isSelectableLumineThinkLevel(
  value: unknown
): value is BuildLumineThinkLevel {
  return (
    value === 'low' ||
    value === 'medium' ||
    value === 'high' ||
    value === 'xhigh'
  );
}

export function getSelectableLumineModelOptions(
  copilotPolicy?: BuildCopilotPolicy | null
): BuildLumineModelOption[] {
  const policyOptions = Array.isArray(copilotPolicy?.lumineModelOptions)
    ? copilotPolicy.lumineModelOptions
    : [];
  const normalizedOptions = policyOptions
    .filter((option) => isLumineModel(option?.model))
    .map((option) => {
      const supportedReasoningEfforts = Array.isArray(
        option.supportedReasoningEfforts
      )
        ? option.supportedReasoningEfforts.filter(isSelectableLumineThinkLevel)
        : [];
      return {
        ...option,
        label: String(option.label || option.model),
        description: String(option.description || '').trim(),
        defaultReasoningEffort: isSelectableLumineThinkLevel(
          option.defaultReasoningEffort
        )
          ? option.defaultReasoningEffort
          : DEFAULT_LUMINE_THINK_LEVEL,
        supportedReasoningEfforts:
          supportedReasoningEfforts.length > 0
            ? supportedReasoningEfforts
            : ALL_LUMINE_THINK_LEVELS
      };
    });
  return normalizedOptions.length > 0
    ? normalizedOptions
    : FALLBACK_LUMINE_MODEL_OPTIONS;
}

export function normalizeLumineModelSelection({
  selection,
  modelOptions
}: {
  selection?: Partial<BuildLumineModelPreference> | null;
  modelOptions: BuildLumineModelOption[];
}): BuildLumineModelPreference {
  const options =
    modelOptions.length > 0 ? modelOptions : FALLBACK_LUMINE_MODEL_OPTIONS;
  const model = isLumineModel(selection?.model)
    ? selection.model
    : DEFAULT_LUMINE_MODEL;
  const option =
    options.find((candidate) => candidate.model === model) ||
    options.find((candidate) => candidate.model === DEFAULT_LUMINE_MODEL) ||
    options[0];
  const defaultEffort =
    option && isSelectableLumineThinkLevel(option.defaultReasoningEffort)
      ? option.defaultReasoningEffort
      : DEFAULT_LUMINE_THINK_LEVEL;
  const allowedEfforts = Array.isArray(option?.supportedReasoningEfforts)
    ? option.supportedReasoningEfforts.filter(isSelectableLumineThinkLevel)
    : [];
  const fallbackEffort = allowedEfforts.includes(defaultEffort)
    ? defaultEffort
    : allowedEfforts[0] || DEFAULT_LUMINE_THINK_LEVEL;
  const requestedEffort = isSelectableLumineThinkLevel(
    selection?.reasoningEffort
  )
    ? selection.reasoningEffort
    : fallbackEffort;
  return {
    model: option?.model || DEFAULT_LUMINE_MODEL,
    reasoningEffort: allowedEfforts.includes(requestedEffort)
      ? requestedEffort
      : fallbackEffort,
    source: selection?.source || 'default'
  };
}

export function resolveLumineModelSelectionFromPolicy(
  copilotPolicy?: BuildCopilotPolicy | null
) {
  const modelOptions = getSelectableLumineModelOptions(copilotPolicy);
  return normalizeLumineModelSelection({
    selection: copilotPolicy?.lumineModelPreference || null,
    modelOptions
  });
}

export function getLumineModelOption(
  modelOptions: BuildLumineModelOption[],
  model: BuildLumineModel
) {
  return (
    modelOptions.find((option) => option.model === model) ||
    modelOptions.find((option) => option.model === DEFAULT_LUMINE_MODEL) ||
    modelOptions[0] ||
    FALLBACK_LUMINE_MODEL_OPTIONS[1]
  );
}
