import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const aiCardsSource = readSource(
  'src/containers/Chat/Body/Collect/AICards/index.tsx'
);
const aiEnergyCardSource = readSource('src/components/AiEnergyCard.tsx');
const chatMainSource = readSource('src/containers/Chat/Main.tsx');
const globalStylesSource = readSource('src/styles.css');

const trayClassMatch = aiCardsSource.match(
  /const aiCardControlTrayCls = css`([\s\S]*?)`;/
);
assert.ok(trayClassMatch, 'Expected a named AI card control tray style.');

const trayStyles = trayClassMatch[1];
assert.match(
  aiCardsSource,
  /const aiCardControlTrayMobileBottomClearance =\s+'calc\(2rem \+ env\(safe-area-inset-bottom, 0px\)\)'/
);
assert.match(trayStyles, /overflow-y: auto;/);
assert.match(
  trayStyles,
  /padding-bottom: \$\{aiCardControlTrayMobileBottomClearance\};/
);
assert.match(
  trayStyles,
  /scroll-padding-bottom: \$\{aiCardControlTrayMobileBottomClearance\};/
);

const trayUsageIndex = aiCardsSource.indexOf('className={aiCardControlTrayCls}');
assert.ok(trayUsageIndex > 0, 'Expected the control tray style to be used.');
assert.ok(
  aiCardsSource.indexOf('<AiEnergyCard', trayUsageIndex) > trayUsageIndex,
  'Expected the recharge control to render inside the tray.'
);
assert.ok(
  aiCardsSource.indexOf('<GenerateCardInterface', trayUsageIndex) >
    trayUsageIndex,
  'Expected the summon control to render inside the tray.'
);
assert.match(aiCardsSource, /resetNeeded=\{energyDepleted\}/);
assert.match(aiCardsSource, /energyDepleted=\{energyDepleted\}/);
assert.match(
  aiCardsSource,
  /energyLoading=\{aiUsagePolicyLoading && !aiUsagePolicy\}/
);

const inlineRowClassMatch = aiEnergyCardSource.match(
  /const inlineRowCls = css`([\s\S]*?)`;/
);
assert.ok(
  inlineRowClassMatch,
  'Expected a named inline AI energy row style.'
);
assert.match(inlineRowClassMatch[1], /position: relative;/);
assert.match(inlineRowClassMatch[1], /min-height: 2rem;/);

const inlineChargeSlotClassMatch = aiEnergyCardSource.match(
  /const inlineChargeSlotCls = css`([\s\S]*?)`;/
);
assert.ok(
  inlineChargeSlotClassMatch,
  'Expected an absolute inline charge slot style.'
);
assert.match(inlineChargeSlotClassMatch[1], /position: absolute;/);
assert.match(inlineChargeSlotClassMatch[1], /top: 50%;/);
assert.match(inlineChargeSlotClassMatch[1], /transform: translateY\(-50%\);/);

const inlineMeterWrapWithChargeClassMatch = aiEnergyCardSource.match(
  /const inlineMeterWrapWithChargeCls = css`([\s\S]*?)`;/
);
assert.ok(
  inlineMeterWrapWithChargeClassMatch,
  'Expected a reserved meter offset when inline charge is visible.'
);
assert.match(inlineMeterWrapWithChargeClassMatch[1], /margin-left: 8\.9rem;/);
assert.match(inlineMeterWrapWithChargeClassMatch[1], /min-width: 0;/);
assert.match(
  aiEnergyCardSource,
  /<div className=\{inlineChargeSlotCls\}>\s*<GameCTAButton/
);
assert.match(
  aiEnergyCardSource,
  /chargeCtaType \? inlineMeterWrapWithChargeCls : ''/
);

assert.match(
  chatMainSource,
  /height: calc\(100% - var\(--mobile-nav-total-height\)\);/
);
assert.match(
  globalStylesSource,
  /--mobile-nav-total-height: calc\(\s*var\(--mobile-nav-height, 7rem\) \+ env\(safe-area-inset-bottom, 0px\)\s*\);/
);

console.log('AI card mobile controls layout verifier passed.');
