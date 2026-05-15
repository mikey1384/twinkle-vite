import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL(
    '../src/components/RecommendationInterface/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const priceTextSource = readFileSync(
  new URL(
    '../src/components/RecommendationInterface/PriceText.tsx',
    import.meta.url
  ),
  'utf8'
);

assert.match(source, /const recommendLabel = 'Recommend\?';/);
assert.match(source, /const yesLabel = 'Yes';/);
assert.match(source, /const noLabel = 'No';/);
assert.doesNotMatch(source, /gradient/i);
assert.doesNotMatch(source, /background:/);
assert.doesNotMatch(source, /border-left/i);
assert.doesNotMatch(source, /fontSize:/);
assert.match(source, /font-size: 1\.3rem;/);
assert.match(source, /font-size: 1\.1rem;/);
assert.match(source, /min-height: 6rem;/);
assert.match(source, /padding: 1rem;/);
assert.match(source, /justify-content: center;/);
assert.match(source, /column-gap: 1\.4rem;/);
assert.match(source, /row-gap: 0\.8rem;/);
assert.doesNotMatch(source, /justify-content: space-between;/);
assert.match(source, /animation: recommendationBorderGlow 1\.6s ease-out 1;/);
assert.match(source, /@keyframes recommendationBorderGlow/);
assert.match(source, /const recommendationTextGlowClass = css`/);
assert.match(source, /animation: recommendationTextGlow 1\.6s ease-out 1;/);
assert.match(source, /@keyframes recommendationTextGlow/);
assert.match(source, /const recommendationActionGlowClass = css`/);
assert.match(source, /animation: recommendationActionGlow 1\.6s ease-out 1;/);
assert.match(source, /@keyframes recommendationActionGlow/);
assert.match(source, /className={recommendationPromptClass}/);
assert.match(source, /<span className={recommendationTextGlowClass}>/);
assert.equal(
  source.match(/className={recommendationActionGlowClass}/g)?.length,
  2
);
assert.match(source, /color: #fff;/);
assert.match(
  source,
  /background-color: var\(--recommendation-action-start-bg\);/
);
assert.match(source, /border-color: var\(--recommendation-action-start-bg\);/);
assert.match(
  source,
  /background-color: var\(--recommendation-action-soft-bg\);/
);
assert.match(source, /color: Color\.darkBlue\(\)/);
assert.match(source, /softColor: Color\.darkBlue\(0\.08\)/);
assert.match(source, /color: Color\.rose\(\)/);
assert.match(source, /softColor: Color\.rose\(0\.08\)/);
assert.match(source, /color: \$\{Color\.darkGold\(\)\};/);
assert.match(source, /color: \$\{Color\.logoBlue\(\)\};/);
assert.match(source, /border-color: \$\{Color\.darkGold\(0\.72\)\};/);
assert.match(source, /border-color: \$\{Color\.logoBlue\(0\.58\)\};/);
assert.match(source, /background-color: transparent;/);
assert.match(source, /background-color: \$\{Color\.logoBlue\(0\.08\)\};/);
assert.match(source, /background-color: \$\{Color\.darkGold\(0\.11\)\};/);
assert.match(source, /ariaLabel={rewardableLabel}/);
assert.doesNotMatch(source, /label={rewardableLabel}/);
assert.equal(source.match(/variant="outline"/g)?.length, 2);
assert.doesNotMatch(source, /variant="soft"/);
assert.doesNotMatch(source, /tone="raised"/);
assert.match(priceTextSource, /fontSize: '1\.3rem'/);
assert.doesNotMatch(priceTextSource, /switchButtonShown/);

console.log('RecommendationInterface layout guard passed.');
