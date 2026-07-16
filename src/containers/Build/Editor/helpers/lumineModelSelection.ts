import type {
  BuildCopilotPolicy,
  BuildLumineMode,
  BuildLumineModel,
  BuildLumineModelOption,
  BuildLumineModelPreference,
  BuildLumineThinkLevel
} from '../ChatPanel/types';

export const DEFAULT_LUMINE_MODEL: BuildLumineModel = 'grok-4.5';
export const DEFAULT_LUMINE_THINK_LEVEL: BuildLumineThinkLevel = 'high';

export const LUMINE_MODE_LABELS: Record<BuildLumineMode, string> = {
  light: 'Light',
  normal: 'Normal',
  heavy: 'Heavy',
  superheavy: 'Super Heavy'
};

export const LUMINE_MODES: BuildLumineMode[] = [
  'light',
  'normal',
  'heavy',
  'superheavy'
];

const DEFAULT_LUMINE_MODEL_BY_MODE: Record<
  BuildLumineMode,
  BuildLumineModel
> = {
  light: 'grok-4.5',
  normal: 'gpt-5.6-terra',
  heavy: 'gpt-5.6-sol',
  superheavy: 'gpt-5.6-sol'
};

const ALL_LUMINE_THINK_LEVELS: BuildLumineThinkLevel[] = [
  'low',
  'medium',
  'high',
  'xhigh',
  'max'
];

const FALLBACK_LUMINE_MODEL_OPTIONS: BuildLumineModelOption[] = [
  {
    model: 'grok-4.5',
    mode: 'light',
    label: 'Grok 4.5',
    description: 'Light mode: fast, capable builds at lower cost.',
    defaultReasoningEffort: 'high',
    supportedReasoningEfforts: ['high']
  },
  {
    model: 'gpt-5.6-terra',
    mode: 'normal',
    label: 'GPT-5.6 Terra',
    description: 'Normal mode: balanced capability and cost.',
    defaultReasoningEffort: 'medium',
    supportedReasoningEfforts: ['medium']
  },
  {
    model: 'claude-sonnet-5',
    mode: 'normal',
    label: 'Claude Sonnet 5',
    description: 'Normal mode: efficient agentic coding and tool use.',
    defaultReasoningEffort: 'medium',
    supportedReasoningEfforts: ['medium']
  },
  {
    model: 'gpt-5.6-sol',
    mode: 'heavy',
    label: 'GPT-5.6 Sol',
    description: 'Heavy mode: deep reasoning for demanding builds.',
    defaultReasoningEffort: 'xhigh',
    supportedReasoningEfforts: ['xhigh']
  },
  {
    model: 'claude-opus-4-8',
    mode: 'heavy',
    label: 'Claude Opus 4.8',
    description: 'Heavy mode: powerful reasoning for ambitious builds.',
    defaultReasoningEffort: 'xhigh',
    supportedReasoningEfforts: ['xhigh']
  },
  {
    model: 'gpt-5.6-sol',
    mode: 'superheavy',
    label: 'GPT-5.6 Sol',
    description: 'Super Heavy mode: maximum reasoning for the hardest builds.',
    defaultReasoningEffort: 'max',
    supportedReasoningEfforts: ['max']
  },
  {
    model: 'claude-fable-5',
    mode: 'superheavy',
    label: 'Claude Fable 5',
    description: 'Super Heavy mode: deepest thinking for the hardest builds.',
    defaultReasoningEffort: 'xhigh',
    supportedReasoningEfforts: ['xhigh']
  }
];

const DEFAULT_FALLBACK_LUMINE_MODEL_OPTION =
  FALLBACK_LUMINE_MODEL_OPTIONS.find(
    (option) => option.model === DEFAULT_LUMINE_MODEL
  ) || FALLBACK_LUMINE_MODEL_OPTIONS[0];

function isLumineModel(value: unknown): value is BuildLumineModel {
  return (
    value === 'grok-4.5' ||
    value === 'gpt-5.6-terra' ||
    value === 'claude-sonnet-5' ||
    value === 'gpt-5.6-sol' ||
    value === 'claude-opus-4-8' ||
    value === 'claude-fable-5'
  );
}

function isLumineMode(value: unknown): value is BuildLumineMode {
  return (
    value === 'light' ||
    value === 'normal' ||
    value === 'heavy' ||
    value === 'superheavy'
  );
}

function resolveLegacyLumineOptionMode(
  option: Pick<
    BuildLumineModelOption,
    'model' | 'defaultReasoningEffort'
  >
): BuildLumineMode {
  if (
    option.model === 'gpt-5.6-sol' &&
    option.defaultReasoningEffort === 'medium'
  ) {
    return 'normal';
  }
  return resolveLumineMode({
    model: option.model,
    reasoningEffort: option.defaultReasoningEffort
  });
}

function isSelectableLumineThinkLevel(
  value: unknown
): value is BuildLumineThinkLevel {
  return (
    value === 'low' ||
    value === 'medium' ||
    value === 'high' ||
    value === 'xhigh' ||
    value === 'max'
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
        mode: isLumineMode(option.mode)
          ? option.mode
          : resolveLegacyLumineOptionMode(option),
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
  const matchingModelOptions = options.filter(
    (candidate) => candidate.model === model
  );
  const requestedSelectionEffort = isSelectableLumineThinkLevel(
    selection?.reasoningEffort
  )
    ? selection.reasoningEffort
    : null;
  const option =
    (isLumineMode(selection?.mode)
      ? matchingModelOptions.find(
          (candidate) => candidate.mode === selection.mode
        )
      : undefined) ||
    (requestedSelectionEffort
      ? matchingModelOptions.find((candidate) =>
          candidate.supportedReasoningEfforts.includes(
            requestedSelectionEffort
          )
        )
      : undefined) ||
    matchingModelOptions[0] ||
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
  const requestedEffort = requestedSelectionEffort || fallbackEffort;
  const reasoningEffort = allowedEfforts.includes(requestedEffort)
    ? requestedEffort
    : fallbackEffort;
  const selectionModelMatchesOption =
    isLumineModel(selection?.model) && selection.model === option?.model;
  const mode =
    selectionModelMatchesOption && isLumineMode(selection?.mode)
      ? selection.mode
      : isLumineMode(option?.mode)
        ? option.mode
        : resolveLumineMode({
            model: option?.model || DEFAULT_LUMINE_MODEL
          });
  return {
    model: option?.model || DEFAULT_LUMINE_MODEL,
    reasoningEffort,
    mode,
    source: selection?.source || 'default'
  };
}

export function resolveLumineMode({
  model,
  reasoningEffort
}: Pick<BuildLumineModelPreference, 'model'> &
  Partial<Pick<BuildLumineModelPreference, 'reasoningEffort'>>): BuildLumineMode {
  if (model === 'grok-4.5') return 'light';
  if (model === 'gpt-5.6-terra' || model === 'claude-sonnet-5') {
    return 'normal';
  }
  if (model === 'gpt-5.6-sol' && reasoningEffort === 'max') {
    return 'superheavy';
  }
  if (model === 'gpt-5.6-sol' || model === 'claude-opus-4-8') {
    return 'heavy';
  }
  return 'superheavy';
}

export function getLumineSelectionForMode({
  mode,
  modelOptions
}: {
  mode: BuildLumineMode;
  modelOptions: BuildLumineModelOption[];
}) {
  const preferredModel = DEFAULT_LUMINE_MODEL_BY_MODE[mode];
  const preferredOption =
    modelOptions.find(
      (option) => option.model === preferredModel && option.mode === mode
    ) ||
    modelOptions.find((option) => option.mode === mode);
  if (!preferredOption) return null;

  return normalizeLumineModelSelection({
    selection: {
      model: preferredOption.model,
      reasoningEffort: preferredOption.defaultReasoningEffort,
      mode
    },
    modelOptions
  });
}

export function getAvailableLumineModes(
  modelOptions: BuildLumineModelOption[]
) {
  return LUMINE_MODES.filter((mode) =>
    modelOptions.some((option) => option.mode === mode)
  );
}

export function getAdvancedLumineModelOptions({
  mode,
  modelOptions
}: {
  mode: BuildLumineMode;
  modelOptions: BuildLumineModelOption[];
}) {
  return modelOptions.filter((option) => option.mode === mode);
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
  model: BuildLumineModel,
  mode?: BuildLumineMode
) {
  return (
    (mode
      ? modelOptions.find(
          (option) => option.model === model && option.mode === mode
        )
      : undefined) ||
    modelOptions.find((option) => option.model === model) ||
    modelOptions.find((option) => option.model === DEFAULT_LUMINE_MODEL) ||
    modelOptions[0] ||
    DEFAULT_FALLBACK_LUMINE_MODEL_OPTION
  );
}
