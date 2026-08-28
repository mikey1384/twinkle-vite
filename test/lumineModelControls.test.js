import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const headerSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/ChatPanel/Header.tsx',
    import.meta.url
  ),
  'utf8'
);
const selectionHelperSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/helpers/lumineModelSelection.ts',
    import.meta.url
  ),
  'utf8'
);
const useRunStartActionsSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/hooks/useRunStartActions.ts',
    import.meta.url
  ),
  'utf8'
);
const modelSelectionHookSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/hooks/useLumineModelSelection.ts',
    import.meta.url
  ),
  'utf8'
);
const buildEditorSource = readFileSync(
  new URL('../src/containers/Build/Editor/index.tsx', import.meta.url),
  'utf8'
);
const requestHelpersSource = readFileSync(
  new URL('../src/contexts/requestHelpers/build.ts', import.meta.url),
  'utf8'
);
const requestHelperIndexSource = readFileSync(
  new URL('../src/contexts/requestHelpers/index.ts', import.meta.url),
  'utf8'
);

test('lumine workspace header exposes simple modes with advanced model choices', () => {
  assert.match(headerSource, /label="Mode"/);
  assert.match(headerSource, /label="Model"/);
  assert.match(headerSource, /Advanced model choices/);
  assert.match(
    headerSource,
    /const hasAdvancedModelOptions = advancedModelOptions\.length > 0/
  );
  assert.match(headerSource, /\{availableModes\.map\(\(mode\) => \(/);
  assert.doesNotMatch(headerSource, /\{LUMINE_MODES\.map\(\(mode\) => \(/);
  assert.match(
    selectionHelperSource,
    /export const LUMINE_MODES[\s\S]*?'light'[\s\S]*?'medium'[\s\S]*?'heavy'/
  );
  // The Super Heavy tier is retired; Claude Opus 5 at Heavy replaces it.
  assert.doesNotMatch(selectionHelperSource, /superheavy/);
  assert.match(
    selectionHelperSource,
    /export function getAvailableLumineModes\([\s\S]*?LUMINE_MODES\.filter\([\s\S]*?modelOptions\.some\(\(option\) => option\.mode === mode\)/m
  );
  assert.match(
    selectionHelperSource,
    /DEFAULT_LUMINE_MODEL[^=]*= 'gpt-5\.6-luna'[\s\S]*?DEFAULT_LUMINE_THINK_LEVEL[^=]*= 'xhigh'/
  );
  assert.match(
    selectionHelperSource,
    /const DEFAULT_LUMINE_MODEL_BY_MODE[\s\S]*?light: 'gpt-5\.6-luna'[\s\S]*?medium: 'grok-4\.6'[\s\S]*?heavy: 'gpt-5\.6-sol'/m
  );
  assert.match(
    selectionHelperSource,
    /model: 'gpt-5\.6-luna'[\s\S]*?mode: 'light'[\s\S]*?defaultReasoningEffort: 'xhigh'[\s\S]*?model: 'grok-4\.6'[\s\S]*?mode: 'light'[\s\S]*?defaultReasoningEffort: 'medium'[\s\S]*?model: 'grok-4\.6'[\s\S]*?mode: 'medium'[\s\S]*?defaultReasoningEffort: 'high'[\s\S]*?model: 'gpt-5\.6-sol'[\s\S]*?mode: 'heavy'[\s\S]*?defaultReasoningEffort: 'xhigh'/m
  );
  assert.match(
    selectionHelperSource,
    /if \(!preferredOption\) return null;[\s\S]*?model: preferredOption\.model/m
  );
  assert.match(
    selectionHelperSource,
    /reasoningEffort:\s*preferredOption\.defaultReasoningEffort/m
  );
  assert.match(
    selectionHelperSource,
    /model: 'claude-sonnet-5'[\s\S]*?mode: 'medium'/
  );
  assert.match(
    selectionHelperSource,
    /model: 'claude-opus-5'[\s\S]*?mode: 'heavy'/
  );
  assert.doesNotMatch(headerSource, /gpt-5\.[1-5]|GPT-5\.[1-5]|Think level/i);
});

test('lumine Light defaults to Luna xhigh while following the served API catalog', async () => {
  const {
    DEFAULT_LUMINE_MODEL,
    DEFAULT_LUMINE_THINK_LEVEL,
    getLumineSelectionForMode,
    getSelectableLumineModelOptions,
    resolveLumineModelSelectionFromPolicy
  } = await import(
    '../src/containers/Build/Editor/helpers/lumineModelSelection.ts'
  );

  assert.equal(DEFAULT_LUMINE_MODEL, 'gpt-5.6-luna');
  assert.equal(DEFAULT_LUMINE_THINK_LEVEL, 'xhigh');
  assert.match(
    buildEditorSource,
    /getLumineModelSelection:\s*\(\) =>[\s\S]*?getLatestCopilotPolicy\(\)[\s\S]*?getCurrentLumineModelSelection\(\)\s*:\s*null/m
  );
  assert.match(
    buildEditorSource,
    /lumineModelSelectionControl:\s*copilotPolicy[\s\S]*?\? lumineModelSelectionControl[\s\S]*?: null/m
  );

  const fallbackOptions = getSelectableLumineModelOptions(null);
  assert.deepEqual(
    fallbackOptions
      .filter((option) => option.mode === 'light')
      .map((option) => ({
        model: option.model,
        defaultReasoningEffort: option.defaultReasoningEffort
      })),
    [
      { model: 'gpt-5.6-luna', defaultReasoningEffort: 'xhigh' },
      { model: 'grok-4.6', defaultReasoningEffort: 'medium' }
    ]
  );
  assert.deepEqual(
    getLumineSelectionForMode({
      mode: 'light',
      modelOptions: fallbackOptions
    }),
    {
      model: 'gpt-5.6-luna',
      reasoningEffort: 'xhigh',
      mode: 'light',
      source: 'default'
    }
  );
  assert.deepEqual(resolveLumineModelSelectionFromPolicy(null), {
    model: 'gpt-5.6-luna',
    reasoningEffort: 'xhigh',
    mode: 'light',
    source: 'default'
  });

  const oldApiPolicy = {
    lumineModelPreference: {
      model: 'grok-4.6',
      reasoningEffort: 'medium',
      mode: 'light',
      source: 'default'
    },
    lumineModelOptions: [
      {
        model: 'grok-4.6',
        mode: 'light',
        label: 'Grok 4.6',
        description: '',
        defaultReasoningEffort: 'medium',
        supportedReasoningEfforts: ['medium']
      }
    ]
  };
  const servedOptions = getSelectableLumineModelOptions(oldApiPolicy);
  assert.deepEqual(
    getLumineSelectionForMode({ mode: 'light', modelOptions: servedOptions }),
    {
      model: 'grok-4.6',
      reasoningEffort: 'medium',
      mode: 'light',
      source: 'default'
    }
  );
  assert.deepEqual(resolveLumineModelSelectionFromPolicy(oldApiPolicy), {
    model: 'grok-4.6',
    reasoningEffort: 'medium',
    mode: 'light',
    source: 'default'
  });
});

test('lumine retires Grok Heavy while preserving existing users on Heavy', async () => {
  const {
    getLumineSelectionForMode,
    getSelectableLumineModelOptions,
    resolveLumineModelSelectionFromPolicy
  } = await import(
    '../src/containers/Build/Editor/helpers/lumineModelSelection.ts'
  );
  const legacyPolicy = {
    lumineModelPreference: {
      model: 'grok-4.6',
      reasoningEffort: 'xhigh',
      mode: 'heavy',
      source: 'stored'
    },
    lumineModelOptions: [
      {
        model: 'grok-4.6',
        mode: 'light',
        label: 'Grok 4.6',
        description: '',
        defaultReasoningEffort: 'medium',
        supportedReasoningEfforts: ['medium']
      },
      {
        model: 'grok-4.6',
        mode: 'medium',
        label: 'Grok 4.6',
        description: '',
        defaultReasoningEffort: 'high',
        supportedReasoningEfforts: ['high']
      },
      {
        model: 'grok-4.6',
        mode: 'heavy',
        label: 'Grok 4.6',
        description: '',
        defaultReasoningEffort: 'xhigh',
        supportedReasoningEfforts: ['xhigh']
      },
      {
        model: 'claude-opus-5',
        mode: 'heavy',
        label: 'Claude Opus 5',
        description: '',
        defaultReasoningEffort: 'high',
        supportedReasoningEfforts: ['high']
      },
      {
        model: 'gpt-5.6-sol',
        mode: 'heavy',
        label: 'GPT-5.6 Sol',
        description: '',
        defaultReasoningEffort: 'xhigh',
        supportedReasoningEfforts: ['xhigh']
      }
    ]
  };

  const options = getSelectableLumineModelOptions(legacyPolicy);
  assert.equal(
    options.some(
      (option) => option.model === 'grok-4.6' && option.mode === 'heavy'
    ),
    false
  );
  assert.deepEqual(resolveLumineModelSelectionFromPolicy(legacyPolicy), {
    model: 'gpt-5.6-sol',
    reasoningEffort: 'xhigh',
    mode: 'heavy',
    source: 'stored'
  });
  assert.deepEqual(
    getLumineSelectionForMode({ mode: 'heavy', modelOptions: options }),
    {
      model: 'gpt-5.6-sol',
      reasoningEffort: 'xhigh',
      mode: 'heavy',
      source: 'default'
    }
  );
});

test('lumine model preference saves through the build request helper', () => {
  const availabilityCheckIndex = modelSelectionHookSource.indexOf(
    'const requestedOption = modelOptions.find('
  );
  const normalizationIndex = modelSelectionHookSource.indexOf(
    'const normalizedNextSelection = normalizeLumineModelSelection('
  );
  const requestIndex = modelSelectionHookSource.indexOf(
    'await updateBuildLumineModelPreference('
  );

  assert.match(requestHelpersSource, /updateBuildLumineModelPreference/);
  assert.match(
    requestHelpersSource,
    /\/lumine-model-preference`[\s\S]*?\{ model, reasoningEffort \}/
  );
  assert.match(requestHelperIndexSource, /updateBuildLumineModelPreference/);
  assert.match(buildEditorSource, /useLumineModelSelection/);
  assert.match(buildEditorSource, /lumineModelSelectionControl/);
  assert(availabilityCheckIndex >= 0);
  assert(normalizationIndex > availabilityCheckIndex);
  assert(requestIndex > normalizationIndex);
  assert.match(
    modelSelectionHookSource,
    /if \(!requestedOption\) \{[\s\S]*?That Lumine mode is no longer available[\s\S]*?return false;/m
  );
});

test('build generate socket payload carries current model and think level', () => {
  assert.match(useRunStartActionsSource, /getLumineModelSelection/);
  assert.match(
    useRunStartActionsSource,
    /lumineModel: lumineModelSelection\?\.model/
  );
  assert.match(
    useRunStartActionsSource,
    /lumineReasoningEffort:\s*lumineModelSelection\?\.reasoningEffort/
  );
});
