import type {
  BuildCopilotPolicy,
  BuildLumineMode,
  BuildLumineModel,
  BuildLumineModelOption,
  BuildLumineModelPreference,
  BuildLumineThinkLevel
} from '../ChatPanel/types';

export const DEFAULT_LUMINE_MODEL: BuildLumineModel = 'auto';
export const DEFAULT_LUMINE_THINK_LEVEL: BuildLumineThinkLevel = 'medium';

export const LUMINE_MODE_LABELS: Record<BuildLumineMode, string> = {
  auto: 'Auto',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy'
};

export const LUMINE_MODES: BuildLumineMode[] = [
  'auto',
  'light',
  'medium',
  'heavy'
];

const DEFAULT_LUMINE_MODEL_BY_MODE: Record<BuildLumineMode, BuildLumineModel> =
  {
    auto: 'auto',
    light: 'gpt-6-luna',
    medium: 'gpt-6-sol',
    heavy: 'claude-opus-5-5'
  };

// Retired models the server migrates (Super Heavy's Astra and Fable included).
// A stored preference naming one resolves to its replacement here too, so the
// picker never shows a mode that no longer exists.
const RETIRED_LUMINE_MODEL_REPLACEMENTS: Partial<
  Record<BuildLumineModel, BuildLumineModel>
> = {
  'gpt-5.6-luna': 'gpt-6-luna',
  'grok-4.6': 'gpt-6-luna',
  'grok-4.5': 'gpt-6-luna',
  'gpt-5.6-terra': 'gpt-6-sol',
  'gpt-5.6-sol': 'gpt-6-sol',
  'claude-sonnet-5': 'gpt-6-sol',
  'claude-opus-5': 'claude-opus-5-5',
  'claude-opus-4-8': 'claude-opus-5-5',
  'gpt-6-astra': 'claude-opus-5-5',
  'claude-fable-5-1': 'claude-opus-5-5',
  'claude-fable-5': 'claude-opus-5-5'
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
    model: 'auto',
    mode: 'auto',
    label: 'Auto',
    description:
      'Chooses a suitable model for each request, balancing capability and Energy.',
    defaultReasoningEffort: 'medium',
    supportedReasoningEfforts: ['medium']
  },
  {
    model: 'gpt-6-luna',
    mode: 'light',
    label: 'GPT-6 Luna',
    description: 'Light mode: quick, efficient reasoning for everyday builds.',
    defaultReasoningEffort: 'medium',
    supportedReasoningEfforts: ['medium']
  },
  {
    model: 'gpt-6-sol',
    mode: 'medium',
    label: 'GPT-6 Sol',
    description: 'Medium mode: strong reasoning for complex builds.',
    defaultReasoningEffort: 'low',
    supportedReasoningEfforts: ['low']
  },
  {
    model: 'claude-opus-5-5',
    mode: 'heavy',
    label: 'Claude Opus 5.5',
    description: 'Heavy mode: deepest reasoning for the hardest builds.',
    defaultReasoningEffort: 'medium',
    supportedReasoningEfforts: ['medium']
  }
];

const DEFAULT_FALLBACK_LUMINE_MODEL_OPTION =
  FALLBACK_LUMINE_MODEL_OPTIONS.find(
    (option) => option.model === DEFAULT_LUMINE_MODEL
  ) || FALLBACK_LUMINE_MODEL_OPTIONS[0];

function isCurrentLumineModel(value: unknown): value is BuildLumineModel {
  return (
    value === 'auto' ||
    value === 'gpt-6-luna' ||
    value === 'gpt-6-sol' ||
    value === 'claude-opus-5-5'
  );
}

function isLumineMode(value: unknown): value is BuildLumineMode {
  return (
    value === 'auto' ||
    value === 'light' ||
    value === 'medium' ||
    value === 'heavy'
  );
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
  // Only current models are offered. During an API/Vite overlap an older
  // policy may still advertise retired models or Super Heavy; the fallback
  // list below then stands in for it.
  const normalizedOptions = policyOptions
    .filter((option) => isCurrentLumineModel(option?.model))
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
          : resolveLumineMode({ model: option.model }),
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
  // Auto alone is not a usable picker: an older policy advertising only
  // retired models leaves just the Auto sentinel, so use the fallback list.
  return normalizedOptions.some((option) => option.model !== 'auto')
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
  const retiredReplacement = selection?.model
    ? RETIRED_LUMINE_MODEL_REPLACEMENTS[selection.model]
    : undefined;
  // A retired model moves to its replacement at that model's own effort.
  const migratedSelection = retiredReplacement
    ? {
        ...selection,
        model: retiredReplacement,
        reasoningEffort: undefined,
        mode: undefined
      }
    : selection;
  const model = isCurrentLumineModel(migratedSelection?.model)
    ? migratedSelection.model
    : DEFAULT_LUMINE_MODEL;
  const matchingModelOptions = options.filter(
    (candidate) => candidate.model === model
  );
  const requestedSelectionEffort = isSelectableLumineThinkLevel(
    migratedSelection?.reasoningEffort
  )
    ? migratedSelection.reasoningEffort
    : null;
  const option =
    (isLumineMode(migratedSelection?.mode)
      ? matchingModelOptions.find(
          (candidate) => candidate.mode === migratedSelection.mode
        )
      : undefined) ||
    (requestedSelectionEffort
      ? matchingModelOptions.find((candidate) =>
          candidate.supportedReasoningEfforts.includes(requestedSelectionEffort)
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
    isCurrentLumineModel(migratedSelection?.model) &&
    migratedSelection.model === option?.model;
  const mode =
    selectionModelMatchesOption && isLumineMode(migratedSelection?.mode)
      ? migratedSelection.mode
      : isLumineMode(option?.mode)
        ? option.mode
        : resolveLumineMode({
            model: option?.model || DEFAULT_LUMINE_MODEL
          });
  return {
    model: option?.model || DEFAULT_LUMINE_MODEL,
    reasoningEffort,
    mode,
    source: migratedSelection?.source || 'default'
  };
}

export function resolveLumineMode({
  model
}: Pick<BuildLumineModelPreference, 'model'> &
  Partial<
    Pick<BuildLumineModelPreference, 'reasoningEffort'>
  >): BuildLumineMode {
  if (model === 'auto') return 'auto';
  const currentModel = RETIRED_LUMINE_MODEL_REPLACEMENTS[model] || model;
  if (currentModel === 'gpt-6-luna') return 'light';
  if (currentModel === 'gpt-6-sol') return 'medium';
  return 'heavy';
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
    ) || modelOptions.find((option) => option.mode === mode);
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
  return mode === 'auto'
    ? []
    : modelOptions.filter((option) => option.mode === mode);
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
