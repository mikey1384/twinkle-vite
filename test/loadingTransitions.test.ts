import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

test('text loading states use the shared modern accessible treatment', () => {
  const loading = source('src/components/Loading.tsx');
  const spinner = source('src/components/Spinner.tsx');

  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /aria-live=\{text \? 'polite' : undefined\}/);
  assert.match(loading, /role=\{text \? 'status' : undefined\}/);
  assert.match(loading, /text \? \([\s\S]*?statusSurfaceClass/);
  assert.match(loading, /box-sizing: border-box/);
  assert.match(loading, /background-color: \$\{Color\.white\(0\.96\)\}/);
  assert.match(loading, /<Spinner size=\{20\} theme=\{theme\} \/>/);
  assert.match(spinner, /size = 28/);
  assert.match(spinner, /prefers-reduced-motion: reduce/);
});

test('daily reward launch waits for its shared chunk before opening the modal', () => {
  const launcher = source(
    'src/components/Modals/DailyRewardModal/useDailyRewardModalLauncher.ts'
  );
  const lazyModule = source(
    'src/components/Modals/DailyRewardModal/lazy.ts'
  );
  const rewardButton = source(
    'src/components/Buttons/CollectRewardsButton.tsx'
  );
  const bonusButton = source('src/components/Buttons/DailyBonusButton.tsx');

  assert.match(lazyModule, /let importPromise:/);
  assert.match(lazyModule, /LazyDailyRewardModal = lazyWithRetry/);
  assert.match(
    launcher,
    /await Promise\.race\([\s\S]*?loadDailyRewardModal\(\)[\s\S]*?OPEN_RECOVERY_SHELL_AFTER_MS[\s\S]*?onSetModalShown\(true\);/
  );
  assert.match(launcher, /void loadDailyRewardModal\(\)\.catch/);
  assert.match(rewardButton, /useDailyRewardModalLauncher/);
  assert.match(rewardButton, /isOpening \? \([\s\S]*?'Opening…'/);
  assert.match(bonusButton, /useDailyRewardModalLauncher/);
  assert.match(bonusButton, /isOpening \? 'Opening…' : 'Bonus!'/);
  assert.doesNotMatch(
    `${rewardButton}\n${bonusButton}`,
    /onClick=\{\(\) => onSetDaily(?:Reward|Bonus)ModalShown\(true\)\}/
  );
});

test('daily modal fallback is delayed and preserves the final modal footprint', () => {
  const app = source('src/containers/App/index.tsx');
  const fallback = source('src/components/Modals/LazyModalFallback.tsx');
  const content = source(
    'src/components/Modals/DailyRewardModal/Content.tsx'
  );
  const dailyRewardModal = source(
    'src/components/Modals/DailyRewardModal/index.tsx'
  );
  const bonus = source(
    'src/components/Modals/DailyRewardModal/BonusView.tsx'
  );

  assert.match(app, /<LazyDailyRewardModal/);
  assert.match(app, /title="Daily Reward"/);
  assert.match(app, /title="Daily Bonus"/);
  assert.match(fallback, /const SHOW_FALLBACK_AFTER_MS = 250/);
  assert.match(fallback, /if \(!isVisible\) return null/);
  assert.match(fallback, /size="lg"/);
  assert.match(fallback, /minHeight: '30vh'/);
  assert.match(content, /Preparing your daily reward/);
  assert.match(content, /Preparing your daily bonus/);
  assert.match(bonus, /Preparing your bonus question/);
  assert.match(
    dailyRewardModal,
    /const \[loading, setLoading\] = useState\(!openBonus\)/
  );
  assert.match(
    dailyRewardModal,
    /const \[bonusLoading, setBonusLoading\] = useState\(!!openBonus\)[\s\S]*?finally \{[\s\S]*?if \(!ignore\)[\s\S]*?setBonusLoading\(false\)/
  );
  assert.match(
    dailyRewardModal,
    /onOpenBonusSummary=\{\(\) => \{[\s\S]*?bonusQuestions\.length === 0[\s\S]*?setBonusLoading\(true\)[\s\S]*?setShowBonusUI\(true\)/
  );
});
