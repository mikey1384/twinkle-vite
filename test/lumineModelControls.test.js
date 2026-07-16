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
    /export const LUMINE_MODES[\s\S]*?'light'[\s\S]*?'normal'[\s\S]*?'heavy'[\s\S]*?'superheavy'/
  );
  assert.match(
    selectionHelperSource,
    /export function getAvailableLumineModes\([\s\S]*?LUMINE_MODES\.filter\([\s\S]*?modelOptions\.some\(\(option\) => option\.mode === mode\)/m
  );
  assert.match(
    selectionHelperSource,
    /DEFAULT_LUMINE_MODEL[^=]*= 'grok-4\.5'[\s\S]*?DEFAULT_LUMINE_THINK_LEVEL[^=]*= 'high'/
  );
  assert.match(
    selectionHelperSource,
    /const DEFAULT_LUMINE_MODEL_BY_MODE[\s\S]*?light: 'grok-4\.5'[\s\S]*?normal: 'gpt-5\.6-terra'[\s\S]*?heavy: 'gpt-5\.6-sol'[\s\S]*?superheavy: 'gpt-5\.6-sol'/m
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
    /model: 'gpt-5\.6-sol'[\s\S]*?mode: 'superheavy'[\s\S]*?defaultReasoningEffort: 'max'[\s\S]*?supportedReasoningEfforts: \['max'\]/m
  );
  assert.match(
    selectionHelperSource,
    /model: 'claude-sonnet-5'[\s\S]*?mode: 'normal'/
  );
  assert.match(
    selectionHelperSource,
    /model: 'claude-opus-4-8'[\s\S]*?mode: 'heavy'/
  );
  assert.doesNotMatch(headerSource, /gpt-5\.[1-5]|GPT-5\.[1-5]|Think level/i);
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
