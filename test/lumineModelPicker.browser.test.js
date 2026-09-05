import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));

// Mount the actual Header, selector, preference hook and model catalog. Only
// unrelated header surfaces are stubbed; model saves resolve from a controlled
// server fixture so pending/failure responses exercise canonical state handling.
const fixture = `
import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBolt, faRobot, faGear, faExpand, faCompress, faSparkles, faChevronDown, faChevronUp } from '@fortawesome/pro-solid-svg-icons';
import Header from './src/containers/Build/Editor/ChatPanel/Header';
import useLumineModelSelection from './src/containers/Build/Editor/hooks/useLumineModelSelection';
import { getSelectableLumineModelOptions, getLumineSelectionForMode } from './src/containers/Build/Editor/helpers/lumineModelSelection';
library.add(faBolt, faRobot, faGear, faExpand, faCompress, faSparkles, faChevronDown, faChevronUp);
const modelOptions = getSelectableLumineModelOptions(null);
const initialPolicy = {
  limits: {}, usage: {},
  lumineModelOptions: modelOptions,
  lumineModelPreference: getLumineSelectionForMode({mode:'light',modelOptions})
};
function Fixture() {
  const [minimized, setMinimized] = useState(window.startCompact);
  const [policy, setPolicy] = useState(initialPolicy);
  const policyRef = useRef(policy);
  policyRef.current = policy;
  const replacePolicy = next => {policyRef.current = next; setPolicy(next)};
  window.setFixtureLayout = setMinimized;
  const { lumineModelSelectionControl } = useLumineModelSelection({
    buildId: 1, copilotPolicy: policy, getLatestCopilotPolicy: () => policyRef.current,
    isOwner: true, replaceCopilotPolicy: replacePolicy,
    updateBuildLumineModelPreference: ({model,reasoningEffort}) => new Promise((resolve,reject) => {
      window.pendingModelSave = { model, reasoningEffort };
      window.finishModelSave = success => {
        if (!success) {reject(new Error('Fixture save failed')); return}
        const option = modelOptions.find(item=>item.model===model && item.defaultReasoningEffort===reasoningEffort);
        const selection = {model,reasoningEffort,mode:option.mode,source:'stored'};
        resolve({lumineModelPreference:selection,lumineModelOptions:modelOptions,copilotPolicy:{...policyRef.current,lumineModelPreference:selection}});
      };
    })
  });
  return <Header copilotPolicy={policy} aiUsagePolicy={null} isOwner
    lumineModelSelectionControl={lumineModelSelectionControl}
    pageFeedbackEvents={[]} twinkleCoins={0} purchasingGenerationReset={false}
    generationResetError="" generationResetUi={null} limitsExpanded={false}
    minimized={minimized} onToggleMinimized={()=>setMinimized(value=>!value)}
    onPurchaseGenerationReset={()=>{}} onRequestProjectLimitIncrease={()=>{}}
    onOpenRuntimeUploadsManager={()=>{}} onToggleLimitsExpanded={()=>{}} />;
}
const root=createRoot(document.getElementById('root'));
root.render(<Fixture/>);
window.unmountFixture=()=>root.unmount();
`;

test('the model picker stays open across every mode, save outcome and header layout', { timeout: 45_000 }, async () => {
  const stubs = new Set(['~/components/AiEnergyCard', '~/components/Button', '~/components/Modal', '~/components/ProgressBar']);
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true, write: false, format: 'iife', platform: 'browser',
    jsx: 'transform', define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'isolated-model-picker', setup(builder) {
      builder.onResolve({filter: /.*/}, args => {
        if(stubs.has(args.path)) return { path: args.path, namespace: 'stub' };
        if(args.path.startsWith('~/')) return builder.resolve(path.join(repo,'src',args.path.slice(2)),{resolveDir:repo,kind:args.kind});
      });
      builder.onLoad({filter: /.*/, namespace: 'stub'}, () => ({ contents: 'export default function UnrelatedSurface(){return null}', loader: 'js' }));
    }}]
  });
  let browser;
  const errors = [];
  const outputDirectory = process.env.LUMINE_PICKER_SCREENSHOTS;
  if (outputDirectory) mkdirSync(outputDirectory, { recursive: true });
  try {
    browser = await chromium.launch({ headless: true, timeout: 10_000 });
    for (const compact of [true, false]) {
      const page = await browser.newPage({ viewport: { width: compact ? 375 : 900, height: 400 } });
      page.setDefaultTimeout(3_000);
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => route.abort());
      await page.setContent('<div id="root"></div>');
      await page.addStyleTag({ content: `*{box-sizing:border-box}html{font-size:10px}body{margin:12px;font-family:Arial;background:#f8fafc}#root{--ui-border:rgba(148,163,184,.28);--theme-border:#418ceb;--chat-text:#2f3747;--build-workspace-header-height:4.5rem;--build-workshop-title-font-size:1.6rem;--build-workshop-body-font-size:1.4rem;--build-workshop-small-font-size:1.1rem;--build-workshop-meta-font-size:1.1rem}` });
      await page.evaluate(value => { window.startCompact = value; }, compact);
      await page.addScriptTag({ content: result.outputFiles[0].text });
      const mode = page.getByRole('combobox', { name: 'Mode', exact: true });
      const model = page.getByRole('combobox', { name: 'Model', exact: true });
      const toggle = page.getByRole('button', { name: 'Toggle advanced Lumine model choices' });
      await toggle.click();
      assert.equal(await model.isVisible(), true);
      for (const nextMode of ['medium', 'heavy', 'superheavy', 'light']) {
        const previousMode = await mode.inputValue();
        const previousModel = await model.inputValue();
        await mode.selectOption(nextMode);
        assert.equal(await model.isVisible(), true, `picker disappeared while saving ${nextMode} in ${compact ? 'compact' : 'full'} layout`);
        assert.equal(await model.isDisabled(), true);
        assert.equal(await mode.inputValue(), previousMode, 'mode does not update optimistically');
        assert.equal(await model.inputValue(), previousModel, 'model does not update optimistically');
        await page.evaluate(() => window.finishModelSave(true));
        await page.waitForFunction(expected => document.querySelector('select').value === expected, nextMode);
        assert.equal(await model.isVisible(), true);
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      }
      await mode.selectOption('heavy');
      await page.evaluate(() => window.finishModelSave(false));
      await page.getByText('Fixture save failed', { exact: true }).waitFor();
      assert.equal(await model.isVisible(), true, 'failed saves do not hide the picker');
      assert.equal(await mode.inputValue(), 'light');
      const selectedModel = await model.inputValue();
      const alternative = await model.locator('option').evaluateAll((items, selected) => items.find(item => item.value !== selected).value, selectedModel);
      await model.selectOption(alternative);
      assert.equal(await model.inputValue(), selectedModel);
      await page.evaluate(() => window.finishModelSave(true));
      await page.waitForFunction(expected => [...document.querySelectorAll('select')][1].value === expected, alternative);
      await page.getByRole('button', { name: compact ? 'Expand Lumine header' : 'Minimize Lumine header', exact: true }).click();
      assert.equal(await model.isVisible(), true, 'layout changes preserve the advanced choice');
      await toggle.click();
      assert.equal(await model.count(), 0, 'explicit collapse still works');
      await mode.selectOption('medium');
      await page.evaluate(() => window.finishModelSave(true));
      await page.waitForFunction(() => document.querySelector('select').value === 'medium');
      assert.equal(await model.count(), 0, 'a mode change respects explicit collapse');
      await toggle.click();
      assert.equal(await model.isVisible(), true);
      await page.evaluate(value => window.setFixtureLayout(value), compact);
      await page.evaluate(() => new Promise(requestAnimationFrame));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if(outputDirectory) await page.screenshot({ path: path.join(outputDirectory, compact ? 'compact-picker.png' : 'full-picker.png') });
      await page.evaluate(() => window.unmountFixture());
      await page.close();
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
  }
});
