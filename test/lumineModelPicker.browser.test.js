import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const {
  chromium
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));

// Mount the actual Header, selector, preference hook and model catalog. Only
// unrelated header surfaces are stubbed; model saves resolve from a controlled
// server fixture so pending/failure responses exercise canonical state handling.
const fixture = `
import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBolt, faRobot, faGear, faExpand, faCompress, faSparkles, faChevronDown, faChevronUp, faExclamationCircle, faLock, faGlobe } from '@fortawesome/pro-solid-svg-icons';
import Header from './src/containers/Build/Editor/ChatPanel/Header';
import useLumineModelSelection from './src/containers/Build/Editor/hooks/useLumineModelSelection';
import { getSelectableLumineModelOptions, getLumineSelectionForMode } from './src/containers/Build/Editor/helpers/lumineModelSelection';
library.add(faBolt, faRobot, faGear, faExpand, faCompress, faSparkles, faChevronDown, faChevronUp, faExclamationCircle, faLock, faGlobe);
const modelOptions = getSelectableLumineModelOptions(null).map(option => ({...option, typicalCallEnergyUnits:60000}));
const initialPolicy = {
  limits: {}, usage: {},
  lumineModelOptions: modelOptions,
  lumineModelPreference: getLumineSelectionForMode({mode:window.startMode || 'light',modelOptions})
};
function Fixture() {
  const [minimized, setMinimized] = useState(window.startCompact);
  const [policy, setPolicy] = useState(initialPolicy);
  const [energyPolicy, setEnergyPolicy] = useState({energyPercent:80,energyRemaining:680000,baseEnergyUnitsPerDay:850000,dayKey:'2026-09-05'});
  const [resetUi,setResetUi] = useState(null);
  const policyRef = useRef(policy);
  policyRef.current = policy;
  const replacePolicy = next => {policyRef.current = next; setPolicy(next)};
  window.setFixtureLayout = setMinimized;
  window.setFixtureEnergy = setEnergyPolicy;
  window.setFixtureReset = setResetUi;
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
  return <Header copilotPolicy={policy} aiUsagePolicy={energyPolicy} isOwner
    lumineChatVisibilityControl={{value:'private',savedValue:'private',loading:false,error:'',onSave:()=>true}}
    lumineModelSelectionControl={lumineModelSelectionControl}
    pageFeedbackEvents={[]} twinkleCoins={0} purchasingGenerationReset={false}
    generationResetError="" generationResetUi={resetUi} limitsExpanded={false}
    minimized={minimized} onToggleMinimized={()=>setMinimized(value=>!value)}
    onPurchaseGenerationReset={()=>{}} onRequestProjectLimitIncrease={()=>{}}
    onOpenRuntimeUploadsManager={()=>{}} onToggleLimitsExpanded={()=>{}} />;
}
const root=createRoot(document.getElementById('root'));
root.render(<Fixture/>);
window.unmountFixture=()=>root.unmount();
`;

let fixtureBundle;
function compileFixture() {
  if (fixtureBundle) return fixtureBundle;
  const stubs = new Set([
    '~/components/Button',
    '~/components/Modal',
    '~/components/ProgressBar',
    '~/components/LumineRescueEntry',
    '~/components/AiEnergyDashboardModal',
    '~/components/Modals/RechargeAiEnergyConfirmModal',
    '~/theme/hooks/useRoleColor'
  ]);
  fixtureBundle = build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'transform',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'isolated-model-picker',
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, (args) => {
            if (stubs.has(args.path))
              return { path: args.path, namespace: 'stub' };
            if (args.path.startsWith('~/'))
              return builder.resolve(
                path.join(repo, 'src', args.path.slice(2)),
                { resolveDir: repo, kind: args.kind }
              );
          });
          builder.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({
            contents:
              args.path === '~/theme/hooks/useRoleColor'
                ? 'export function useRoleColor(){return {getColor:()=>"#418ceb"}}'
                : args.path === '~/components/AiEnergyDashboardModal'
                  ? 'import React from "react";export default function Dashboard({onHide}){return <div role="dialog" aria-label="AI Energy dashboard"><button onClick={onHide}>Close dashboard</button></div>}'
                  : 'export default function UnrelatedSurface(){return null}',
            loader: 'jsx',
            resolveDir: repo
          }));
        }
      }
    ]
  });
  return fixtureBundle;
}

test(
  'the model picker stays open across every mode, save outcome and header layout',
  { timeout: 45_000 },
  async () => {
    const result = await compileFixture();
    let browser;
    const errors = [];
    const outputDirectory = process.env.LUMINE_PICKER_SCREENSHOTS;
    if (outputDirectory) mkdirSync(outputDirectory, { recursive: true });
    try {
      browser = await chromium.launch({ headless: true, timeout: 10_000 });
      for (const compact of [true, false]) {
        const page = await browser.newPage({
          viewport: { width: compact ? 375 : 900, height: 400 }
        });
        page.setDefaultTimeout(3_000);
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/*', (route) => route.abort());
        await page.setContent('<div id="root"></div>');
        await page.addStyleTag({
          content: `*{box-sizing:border-box}html{font-size:10px}body{margin:12px;font-family:Arial;background:#f8fafc}#root{--ui-border:rgba(148,163,184,.28);--theme-border:#418ceb;--chat-text:#2f3747;--build-workspace-header-height:4.5rem;--build-workshop-title-font-size:1.6rem;--build-workshop-body-font-size:1.4rem;--build-workshop-small-font-size:1.1rem;--build-workshop-meta-font-size:1.1rem}`
        });
        await page.evaluate((value) => {
          window.startCompact = value;
        }, compact);
        await page.evaluate(() => {
          Date.now = () => Date.parse('2026-09-05T10:00:00Z');
        });
        await page.addScriptTag({ content: result.outputFiles[0].text });
        const mode = page.getByRole('combobox', { name: 'Mode', exact: true });
        const model = page.getByRole('combobox', {
          name: 'Model',
          exact: true
        });
        const toggle = page.getByRole('button', {
          name: 'Toggle advanced Lumine model choices'
        });
        await toggle.click();
        assert.equal(await model.isVisible(), true);
        for (const nextMode of ['medium', 'heavy', 'superheavy', 'light']) {
          const previousMode = await mode.inputValue();
          const previousModel = await model.inputValue();
          await mode.selectOption(nextMode);
          assert.equal(
            await model.isVisible(),
            true,
            `picker disappeared while saving ${nextMode} in ${compact ? 'compact' : 'full'} layout`
          );
          assert.equal(await model.isDisabled(), true);
          assert.equal(
            await mode.inputValue(),
            previousMode,
            'mode does not update optimistically'
          );
          assert.equal(
            await model.inputValue(),
            previousModel,
            'model does not update optimistically'
          );
          await page.evaluate(() => window.finishModelSave(true));
          await page.waitForFunction(
            (expected) => document.querySelector('select').value === expected,
            nextMode
          );
          assert.equal(await model.isVisible(), true);
          assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        }
        await mode.selectOption('heavy');
        await page.evaluate(() => window.finishModelSave(false));
        await page.getByText('Fixture save failed', { exact: true }).waitFor();
        assert.equal(
          await model.isVisible(),
          true,
          'failed saves do not hide the picker'
        );
        assert.equal(await mode.inputValue(), 'light');
        const selectedModel = await model.inputValue();
        const alternative = await model
          .locator('option')
          .evaluateAll(
            (items, selected) =>
              items.find((item) => item.value !== selected).value,
            selectedModel
          );
        await model.selectOption(alternative);
        assert.equal(await model.inputValue(), selectedModel);
        await page.evaluate(() => window.finishModelSave(true));
        await page.waitForFunction(
          (expected) =>
            [...document.querySelectorAll('select')][1].value === expected,
          alternative
        );
        await page
          .getByRole('button', {
            name: compact ? 'Expand Lumine header' : 'Minimize Lumine header',
            exact: true
          })
          .click();
        assert.equal(
          await model.isVisible(),
          true,
          'layout changes preserve the advanced choice'
        );
        await toggle.click();
        assert.equal(await model.count(), 0, 'explicit collapse still works');
        await mode.selectOption('medium');
        await page.evaluate(() => window.finishModelSave(true));
        await page.waitForFunction(
          () => document.querySelector('select').value === 'medium'
        );
        assert.equal(
          await model.count(),
          0,
          'a mode change respects explicit collapse'
        );
        await toggle.click();
        assert.equal(await model.isVisible(), true);
        await page.evaluate((value) => window.setFixtureLayout(value), compact);
        await page.evaluate(() => new Promise(requestAnimationFrame));
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          true
        );
        if (outputDirectory)
          await page.screenshot({
            path: path.join(
              outputDirectory,
              compact ? 'compact-picker.png' : 'full-picker.png'
            )
          });
        await page.evaluate(() => window.unmountFixture());
        await page.close();
      }
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
    }
  }
);

test(
  'real workspace Energy stays compact and refill details are a bounded click/tap popover',
  { timeout: 60_000 },
  async () => {
    const result = await compileFixture();
    let browser;
    const errors = [];
    const outputDirectory = process.env.LUMINE_PICKER_SCREENSHOTS;
    if (outputDirectory) mkdirSync(outputDirectory, { recursive: true });
    try {
      browser = await chromium.launch({ headless: true, timeout: 10000 });
      for (const [width, fontSize, desktopWidth] of [
        [320, 10],
        [375, 10],
        [425, 16],
        [600, 16],
        [900, 10],
        [320, 10, 1400],
        [425, 16, 1400]
      ]) {
        for (const compact of [true, false]) {
          const viewportWidth = desktopWidth || width;
          const page = await browser.newPage({
            viewport: { width: viewportWidth, height: 700 },
            timezoneId: 'Asia/Bangkok',
            locale: 'en-US',
            hasTouch: true
          });
          page.setDefaultTimeout(3000);
          page.on('pageerror', (error) => errors.push(error.message));
          await page.route('**/*', (route) => route.abort());
          await page.setContent(
            '<div id="root"></div><div id="outer-layer"></div>'
          );
          await page.addStyleTag({
            content: `*{box-sizing:border-box}html{font-size:${fontSize}px}body{margin:0;font-family:Arial;background:#f8fafc}#root{--ui-border:rgba(148,163,184,.28);--theme-border:#418ceb;--chat-text:#2f3747;--build-workspace-header-height:4.5rem;--build-workshop-title-font-size:1.6rem;--build-workshop-body-font-size:1.4rem;--build-workshop-small-font-size:1.1rem;--build-workshop-meta-font-size:1.1rem}#outer-layer{pointer-events:none}`
          });
          await page.addStyleTag({ content: `#root{width:${width}px}` });
          await page.evaluate(
            ({ compact }) => {
              window.startCompact = compact;
              window.startMode = 'heavy';
              window.fixtureNow = Date.parse('2026-09-05T10:00:00Z');
              Date.now = () => window.fixtureNow;
            },
            { compact }
          );
          await page.addScriptTag({ content: result.outputFiles[0].text });
          const info = page.getByRole('button', {
            name: 'AI Energy refill details',
            exact: true
          });
          const panel = page.getByRole('dialog', {
            name: 'AI Energy refill details',
            exact: true
          });
          const meter = page.getByRole('meter', {
            name: 'Energy',
            exact: true
          });
          await info.waitFor();
          assert.equal(
            await page
              .getByText('Refills daily at 00:00 UTC.', { exact: true })
              .count(),
            0
          );
          assert.equal(await meter.getAttribute('aria-valuetext'), '80%');
          const header = page.locator('#root > div');
          const before = await header.boundingBox();
          if (outputDirectory)
            await page.screenshot({
              path: path.join(
                outputDirectory,
                `energy-${width}-${fontSize}-${compact ? 'compact' : 'full'}.png`
              )
            });
          assert.ok(
            before.height < (compact ? 10 : 22) * fontSize,
            `header too tall: ${width}px/${fontSize}px/compact=${compact}, ${before.height}px`
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth
            ),
            true
          );
          for (const item of [
            info,
            meter,
            page.getByRole('combobox', { name: 'Mode', exact: true }),
            page.getByRole('button', {
              name: 'Toggle advanced Lumine model choices'
            })
          ]) {
            const box = await item.boundingBox();
            assert.ok(
              box.width > 15 && box.x >= 0 && box.x + box.width <= width + 1,
              'controls and meter remain visible inside pane'
            );
          }
          await info.tap();
          await panel.waitFor();
          assert.equal(await info.getAttribute('aria-expanded'), 'true');
          assert.equal(
            await panel.evaluate(
              (element) => element === document.activeElement
            ),
            true,
            'opened details receive keyboard focus'
          );
          assert.match(
            await panel.innerText(),
            /Next daily refill:.*Sep 6.*7:00 AM GMT\+7/s
          );
          assert.doesNotMatch(
            await panel.innerText(),
            /Refills daily at 00:00 UTC/
          );
          const popup = await panel.boundingBox();
          assert.ok(
            popup.width >= Math.min(260, width - 24),
            'popover must not inherit the meter width'
          );
          assert.ok(
            popup.x >= 0 &&
              popup.x + popup.width <= viewportWidth + 1 &&
              popup.y >= 0 &&
              popup.y + popup.height <= 700
          );
          assert.equal(
            (await header.boundingBox()).height,
            before.height,
            'opening details does not reflow the header'
          );
          if (outputDirectory && compact && width === 425)
            await page.screenshot({
              path: path.join(outputDirectory, 'narrow-refill-popover.png')
            });
          await page.keyboard.press('Escape');
          assert.equal(await panel.count(), 0);
          assert.equal(
            await info.evaluate(
              (element) => element === document.activeElement
            ),
            true
          );
          await page.keyboard.press('Enter');
          await panel.waitFor();
          await page.mouse.click(5, 690);
          assert.equal(
            await panel.count(),
            0,
            'outside click dismisses details'
          );
          await info.click();
          await panel.waitFor();
          await page.setViewportSize({ width: viewportWidth + 1, height: 700 });
          await panel.waitFor({ state: 'hidden' });
          assert.equal(
            await panel.count(),
            0,
            'viewport changes do not leave detached popovers'
          );
          await page.evaluate(() =>
            window.setFixtureEnergy({
              energyPercent: 0,
              energyRemaining: 4553,
              baseEnergyUnitsPerDay: 850000,
              dayKey: '2026-09-05'
            })
          );
          await page.waitForFunction(
            () =>
              document
                .querySelector('[role="meter"]')
                .getAttribute('aria-valuetext') === 'Less than 1%'
          );
          await info.click();
          await page.evaluate(() => {
            window.fixtureNow = Date.parse('2026-09-06T00:00:01Z');
            document.dispatchEvent(new Event('visibilitychange'));
          });
          await panel.getByText(/Refill time has passed/).waitFor();
          assert.equal(
            await meter.getAttribute('aria-valuetext'),
            'Less than 1%',
            'reaching refill time does not invent a fresh balance'
          );
          await panel.getByRole('button', { name: 'Check balance' }).click();
          await page
            .getByRole('dialog', { name: 'AI Energy dashboard', exact: true })
            .waitFor();
          assert.equal(await panel.count(), 0);
          await page.getByRole('button', { name: 'Close dashboard' }).click();
          if (outputDirectory && compact && width === 425)
            await page.screenshot({
              path: path.join(outputDirectory, 'narrow-energy-header.png')
            });
          await page.evaluate(() => {
            window.setFixtureEnergy({
              energyPercent: 0,
              energyRemaining: 0,
              baseEnergyUnitsPerDay: 850000,
              dayKey: '2026-09-06'
            });
            window.setFixtureReset({ resetCost: 100, resetPurchasesToday: 0 });
          });
          const charge = page.getByRole('button', {
            name: 'Charge',
            exact: true
          });
          await charge.waitFor();
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth
            ),
            true,
            'Charge state does not overflow'
          );
          const chargeBox = await charge.boundingBox();
          const infoBox = await info.boundingBox();
          assert.ok(
            chargeBox.x + chargeBox.width < infoBox.x,
            'Charge and refill buttons do not overlap'
          );
          await charge.click();
          await page
            .getByRole('dialog', { name: 'AI Energy dashboard', exact: true })
            .waitFor();
          await page.getByRole('button', { name: 'Close dashboard' }).click();
          await info.click();
          await panel.waitFor();
          await page.evaluate(() => window.unmountFixture());
          assert.equal(await panel.count(), 0);
          await page.close();
        }
      }
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
    }
  }
);
