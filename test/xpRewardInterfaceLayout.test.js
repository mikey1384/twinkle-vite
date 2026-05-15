import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL(
    '../src/components/XPRewardInterface/SelectRewardAmount.tsx',
    import.meta.url
  ),
  'utf8'
);

assert.match(source, /const rewardAmountPickerClass = css`/);
assert.match(source, /const rewardAmountMarkClass = css`/);
assert.match(source, /const glowingRewardAmountMarkClass = css`/);
assert.match(source, /className={rewardAmountPickerClass}/);
assert.match(
  source,
  /className={`\$\{rewardAmountMarkClass\} \$\{glowingRewardAmountMarkClass\}`}/
);
assert.match(source, /animation: rewardAmountMarkGlow 1\.6s ease-out 1;/);
assert.match(source, /@keyframes rewardAmountMarkGlow/);
assert.match(source, /color: \$\{Color\.darkGold\(\)\};/);
assert.match(source, /color: \$\{Color\.black\(\)\};/);
assert.doesNotMatch(source, /filter:/);
assert.doesNotMatch(source, /gradient/i);
assert.doesNotMatch(source, /background:/);
assert.doesNotMatch(source, /border/i);

console.log('XPRewardInterface layout guard passed.');
