import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const aiCardsSource = readSource(
  'src/containers/Chat/Body/Collect/AICards/index.tsx'
);
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

assert.match(
  chatMainSource,
  /height: calc\(100% - var\(--mobile-nav-total-height\)\);/
);
assert.match(
  globalStylesSource,
  /--mobile-nav-total-height: calc\(\s*var\(--mobile-nav-height, 7rem\) \+ env\(safe-area-inset-bottom, 0px\)\s*\);/
);

console.log('AI card mobile controls layout verifier passed.');
