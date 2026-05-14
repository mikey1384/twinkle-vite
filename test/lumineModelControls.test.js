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

test('lumine workspace header exposes simple model and think level controls', () => {
  const thinkLevelLabelsBlock =
    selectionHelperSource.match(
      /export const LUMINE_THINK_LEVEL_LABELS[\s\S]*?\n\s*};/
    )?.[0] || '';
  const thinkLevelOptionsBlock =
    selectionHelperSource.match(
      /const ALL_LUMINE_THINK_LEVELS[\s\S]*?\n];/
    )?.[0] || '';
  const selectableThinkLevelGuardBlock =
    selectionHelperSource.match(
      /function isSelectableLumineThinkLevel[\s\S]*?\n\}/
    )?.[0] || '';

  assert.match(headerSource, /label="Model"/);
  assert.match(headerSource, /label="Think level"/);
  assert.match(selectionHelperSource, /'gpt-5\.5'/);
  assert.match(selectionHelperSource, /'gpt-5\.4'/);
  assert.match(thinkLevelLabelsBlock, /low: 'low'/);
  assert.match(thinkLevelLabelsBlock, /medium: 'medium'/);
  assert.match(thinkLevelLabelsBlock, /high: 'high'/);
  assert.match(thinkLevelLabelsBlock, /xhigh: 'xhigh'/);
  assert.doesNotMatch(thinkLevelLabelsBlock, /Quick|Light|Careful|Deepest/);
  assert.match(
    thinkLevelOptionsBlock,
    /'low'[\s\S]*'medium'[\s\S]*'high'[\s\S]*'xhigh'/
  );
  assert.doesNotMatch(thinkLevelOptionsBlock, /'none'/);
  assert.doesNotMatch(selectableThinkLevelGuardBlock, /value === 'none'/);
  assert.match(selectionHelperSource, /selection\?\.reasoningEffort/);
  assert.match(
    selectionHelperSource,
    /isSelectableLumineThinkLevel\(\s*selection\?\.reasoningEffort\s*\)/
  );
  assert.doesNotMatch(headerSource, /gpt-5\.4-mini|GPT-5\.4 mini/i);
  assert.doesNotMatch(selectionHelperSource, /gpt-5\.4-mini|GPT-5\.4 mini/i);
});

test('lumine model preference saves through the build request helper', () => {
  assert.match(requestHelpersSource, /updateBuildLumineModelPreference/);
  assert.match(
    requestHelpersSource,
    /\/lumine-model-preference`[\s\S]*?\{ model, reasoningEffort \}/
  );
  assert.match(requestHelperIndexSource, /updateBuildLumineModelPreference/);
  assert.match(buildEditorSource, /useLumineModelSelection/);
  assert.match(buildEditorSource, /lumineModelSelectionControl/);
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
