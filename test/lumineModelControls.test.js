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

function assertClientVersionAtLeast(expected) {
  const { version } = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );
  const actualParts = version.split('.').map(Number);
  const expectedParts = expected.split('.').map(Number);
  const comparison = actualParts.findIndex(
    (part, index) => part !== expectedParts[index]
  );
  assert.ok(
    comparison === -1 || actualParts[comparison] > expectedParts[comparison],
    `Expected website client version ${version} to be at least ${expected}`
  );
}

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
  // Three modes plus Auto since 2026-09-23; Super Heavy is gone.
  assert.match(
    selectionHelperSource,
    /export const LUMINE_MODES[\s\S]*?'auto'[\s\S]*?'light'[\s\S]*?'medium'[\s\S]*?'heavy'\s*\]/
  );
  assert.doesNotMatch(selectionHelperSource, /'superheavy'|superheavy:/);
  assert.match(
    selectionHelperSource,
    /export function getAvailableLumineModes\([\s\S]*?LUMINE_MODES\.filter\([\s\S]*?modelOptions\.some\(\(option\) => option\.mode === mode\)/m
  );
  assert.match(
    selectionHelperSource,
    /DEFAULT_LUMINE_MODEL[^=]*= 'auto'[\s\S]*?DEFAULT_LUMINE_THINK_LEVEL[^=]*= 'medium'/
  );
  assert.match(
    selectionHelperSource,
    /const DEFAULT_LUMINE_MODEL_BY_MODE[\s\S]*?light: 'gpt-6-luna'[\s\S]*?medium: 'gpt-6-sol'[\s\S]*?heavy: 'claude-opus-5-5'/m
  );
  assert.match(
    selectionHelperSource,
    /if \(!preferredOption\) return null;[\s\S]*?model: preferredOption\.model/m
  );
  assert.match(
    selectionHelperSource,
    /reasoningEffort:\s*preferredOption\.defaultReasoningEffort/m
  );
  assert.doesNotMatch(headerSource, /gpt-5\.[1-5]|GPT-5\.[1-5]|Think level/i);
});

test('lumine fallback lineup matches the API: Light Luna medium, Medium Sol low, Heavy Opus 5.5 medium', async () => {
  const {
    DEFAULT_LUMINE_MODEL,
    DEFAULT_LUMINE_THINK_LEVEL,
    getLumineSelectionForMode,
    getSelectableLumineModelOptions,
    resolveLumineModelSelectionFromPolicy
  } =
    await import('../src/containers/Build/Editor/helpers/lumineModelSelection.ts');

  assert.equal(DEFAULT_LUMINE_MODEL, 'auto');
  assert.equal(DEFAULT_LUMINE_THINK_LEVEL, 'medium');
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
    fallbackOptions.map((option) => [
      option.model,
      option.mode,
      option.defaultReasoningEffort
    ]),
    [
      ['auto', 'auto', 'medium'],
      ['gpt-6-luna', 'light', 'medium'],
      ['gpt-6-sol', 'medium', 'low'],
      ['claude-opus-5-5', 'heavy', 'medium']
    ]
  );
  for (const [mode, model, reasoningEffort] of [
    ['light', 'gpt-6-luna', 'medium'],
    ['medium', 'gpt-6-sol', 'low'],
    ['heavy', 'claude-opus-5-5', 'medium']
  ]) {
    assert.deepEqual(
      getLumineSelectionForMode({ mode, modelOptions: fallbackOptions }),
      { model, reasoningEffort, mode, source: 'default' }
    );
  }
  assert.deepEqual(resolveLumineModelSelectionFromPolicy(null), {
    model: 'auto',
    reasoningEffort: 'medium',
    mode: 'auto',
    source: 'default'
  });
});

test('lumine migrates retired stored choices to their replacement at its own thinking level', async () => {
  const { getSelectableLumineModelOptions, normalizeLumineModelSelection } =
    await import('../src/containers/Build/Editor/helpers/lumineModelSelection.ts');
  const options = getSelectableLumineModelOptions(null);
  for (const [selection, expected] of [
    [
      { model: 'grok-4.6', reasoningEffort: 'xhigh', mode: 'heavy' },
      { model: 'gpt-6-luna', reasoningEffort: 'medium', mode: 'light' }
    ],
    [
      { model: 'gpt-5.6-luna', reasoningEffort: 'xhigh', mode: 'light' },
      { model: 'gpt-6-luna', reasoningEffort: 'medium', mode: 'light' }
    ],
    [
      { model: 'gpt-5.6-sol', reasoningEffort: 'max', mode: 'superheavy' },
      { model: 'gpt-6-sol', reasoningEffort: 'low', mode: 'medium' }
    ],
    [
      { model: 'gpt-6-astra', reasoningEffort: 'xhigh', mode: 'superheavy' },
      { model: 'claude-opus-5-5', reasoningEffort: 'medium', mode: 'heavy' }
    ],
    [
      { model: 'claude-fable-5', reasoningEffort: 'xhigh' },
      { model: 'claude-opus-5-5', reasoningEffort: 'medium', mode: 'heavy' }
    ]
  ]) {
    assert.deepEqual(
      normalizeLumineModelSelection({
        selection: { ...selection, source: 'stored' },
        modelOptions: options
      }),
      { ...expected, source: 'stored' }
    );
  }
});

test('an older API catalog of retired models and Super Heavy falls back to the current lineup', async () => {
  assertClientVersionAtLeast('2.2.64');
  const { getSelectableLumineModelOptions, resolveLumineModelSelectionFromPolicy } =
    await import('../src/containers/Build/Editor/helpers/lumineModelSelection.ts');
  const policy = {
    lumineModelPreference: {
      model: 'claude-fable-5-1',
      reasoningEffort: 'xhigh',
      mode: 'superheavy',
      source: 'stored'
    },
    lumineModelOptions: [
      {
        model: 'grok-4.6',
        mode: 'medium',
        label: 'Grok 4.6',
        description: '',
        defaultReasoningEffort: 'high',
        supportedReasoningEfforts: ['high']
      },
      {
        model: 'claude-fable-5-1',
        mode: 'superheavy',
        label: 'Claude Fable 5.1',
        description: '',
        defaultReasoningEffort: 'xhigh',
        supportedReasoningEfforts: ['xhigh']
      }
    ]
  };
  const options = getSelectableLumineModelOptions(policy);
  assert.deepEqual(
    options.map((option) => option.mode),
    ['auto', 'light', 'medium', 'heavy']
  );
  assert.deepEqual(resolveLumineModelSelectionFromPolicy(policy), {
    model: 'claude-opus-5-5',
    reasoningEffort: 'medium',
    mode: 'heavy',
    source: 'stored'
  });
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
