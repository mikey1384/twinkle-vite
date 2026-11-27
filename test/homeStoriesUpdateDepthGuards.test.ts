import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getClearedCardMeasurementState,
  getNextCardMeasurementState,
  resolveCardWindowMeasuredWidth,
  shouldInvalidateCardWindowMeasurement
} from '../src/containers/Home/Stories/hooks/cardWindowState';
import {
  getFullTextRevealComputedWidth,
  getNextFullTextRevealPosition
} from '../src/components/Texts/fullTextRevealState';

const srcDir = fileURLToPath(new URL('../src', import.meta.url));

function readSource(relativePath: string) {
  return readFileSync(resolve(srcDir, relativePath), 'utf8');
}

test('useCardWindow keeps outer container width space and avoids inner/outer width ping-pong', () => {
  const measuredWidth = resolveCardWindowMeasuredWidth(360, 358);
  assert.equal(measuredWidth, 360);
  assert.equal(resolveCardWindowMeasuredWidth(0, 358), 358);

  const recorded = { height: 240, width: measuredWidth };
  assert.equal(shouldInvalidateCardWindowMeasurement(recorded, 360), false);
  assert.equal(shouldInvalidateCardWindowMeasurement(recorded, 360.8), false);
  assert.equal(shouldInvalidateCardWindowMeasurement(recorded, 0), false);
  assert.equal(shouldInvalidateCardWindowMeasurement(undefined, 360), false);
  assert.equal(shouldInvalidateCardWindowMeasurement(recorded, 600), true);
});

test('useCardWindow state updaters preserve object identity when measurement is unchanged', () => {
  const empty = { key: 'card-1' };
  assert.strictEqual(getClearedCardMeasurementState(empty, 'card-1'), empty);

  const populated = { key: 'card-1', size: { height: 300, width: 360 } };
  const cleared = getClearedCardMeasurementState(populated, 'card-1');
  assert.deepEqual(cleared, { key: 'card-1' });
  assert.strictEqual(getClearedCardMeasurementState(cleared, 'card-1'), cleared);

  const nextSame = getNextCardMeasurementState(populated, 'card-1', {
    height: 300,
    width: 360
  });
  assert.strictEqual(nextSame, populated);

  const nextChangedHeight = getNextCardMeasurementState(populated, 'card-1', {
    height: 320,
    width: 360
  });
  assert.deepEqual(nextChangedHeight, {
    key: 'card-1',
    size: { height: 320, width: 360 }
  });

  const nextChangedKey = getNextCardMeasurementState(populated, 'card-2', {
    height: 300,
    width: 360
  });
  assert.deepEqual(nextChangedKey, {
    key: 'card-2',
    size: { height: 300, width: 360 }
  });
});

test('FullTextReveal position updater preserves identity on equal coordinates and transitions cleanly', () => {
  assert.equal(getNextFullTextRevealPosition(null, null), null);

  const first = { arrowLeft: 40, left: 16, placement: 'bottom' as const, top: 120 };
  assert.strictEqual(getNextFullTextRevealPosition(null, first), first);
  assert.strictEqual(
    getNextFullTextRevealPosition(first, {
      arrowLeft: 40,
      left: 16,
      placement: 'bottom',
      top: 120
    }),
    first
  );

  const moved = { arrowLeft: 40, left: 16, placement: 'top' as const, top: 80 };
  assert.strictEqual(getNextFullTextRevealPosition(first, moved), moved);
  assert.equal(getNextFullTextRevealPosition(moved, null), null);
});

test('FullTextReveal percentage width helper computes widths purely without setState side effects', () => {
  assert.equal(getFullTextRevealComputedWidth('50%', 200), '100px');
  assert.equal(getFullTextRevealComputedWidth('max-content', 200), undefined);
  assert.equal(getFullTextRevealComputedWidth(240, 200), undefined);
  assert.equal(getFullTextRevealComputedWidth('bad%', 200), undefined);
  assert.equal(getFullTextRevealComputedWidth(undefined, 200), undefined);
});

test('Home/Stories hooks and components guard against unstable-dep and unconditional-setState loops', () => {
  const useCardWindowSrc = readSource('containers/Home/Stories/hooks/useCardWindow.ts');
  assert.match(useCardWindowSrc, /setMeasurement\(\s*\(prev\)\s*=>\s*getClearedCardMeasurementState/);
  assert.match(useCardWindowSrc, /setMeasurement\(\s*\(prev\)\s*=>\s*getNextCardMeasurementState/);
  assert.match(useCardWindowSrc, /resolveCardWindowMeasuredWidth\(/);

  const fullTextRevealSrc = readSource('components/Texts/FullTextReveal.tsx');
  assert.match(fullTextRevealSrc, /getNextFullTextRevealPosition\(/);
  assert.doesNotMatch(fullTextRevealSrc, /\[alignment,\s*anchorRef,\s*direction,\s*style\]/);

  const actionsSrc = readSource('containers/Home/Stories/FeedCard/Actions.tsx');
  assert.match(actionsSrc, /const\s+REWARD_REASON_TOOLTIP_STYLE/);

  const infiniteScrollSrc = readSource('helpers/hooks/useInfiniteScroll.ts');
  assert.match(infiniteScrollSrc, /onScrollToBottomRef\.current\s*=\s*onScrollToBottom/);
  assert.doesNotMatch(infiniteScrollSrc, /\[\s*onScrollToBottom\s*,\s*scrollable\s*\]/);

  const userPopupTriggerSrc = readSource('components/UserPopup/useUserPopupTrigger.tsx');
  assert.match(userPopupTriggerSrc, /onShownChangeRef\.current\s*=\s*onShownChange/);
  assert.doesNotMatch(userPopupTriggerSrc, /\[\s*popupContext\s*,\s*onShownChange\s*\]/);

  const dropdownButtonSrc = readSource('components/Buttons/DropdownButton.tsx');
  assert.match(dropdownButtonSrc, /onDropdownShownRef\.current\s*=\s*onDropdownShown/);
  assert.doesNotMatch(dropdownButtonSrc, /\[\s*dropdownContext\s*,\s*onDropdownShown\s*\]/);

  const liveNowSrc = readSource('components/Notification/TodayStats/LiveNow.tsx');
  assert.match(liveNowSrc, /onPopupOpenChangeRef\.current\s*=\s*onPopupOpenChange/);
  assert.doesNotMatch(liveNowSrc, /\[\s*onPopupOpenChange\s*,\s*popupOpen\s*\]/);

  const markdownSrc = readSource('components/Texts/RichText/Markdown/index.tsx');
  assert.doesNotMatch(markdownSrc, /setHasLongWord\(/);
  assert.match(markdownSrc, /onSetIsParsedRef\.current\s*=\s*onSetIsParsed/);

  const subjectsSrc = readSource('containers/Home/Stories/Featured/Subjects.tsx');
  assert.match(subjectsSrc, /currentFeaturedIndex\s*>\s*0\s*&&\s*currentFeaturedIndex\s*>=\s*featureds\.length/);

  const callAssistantSrc = readSource('containers/Home/Stories/Featured/useHomeCallAssistant.ts');
  assert.match(callAssistantSrc, /!Object\.is\(\s*selection\.userId\s*,\s*userId\s*\)/);

  const contentListItemSrc = readSource('components/ContentListItem/index.tsx');
  const guardedHeightCalls = contentListItemSrc.match(
    /setPlaceholderHeightState\(\s*\(prev\)\s*=>/g
  );
  assert.equal(guardedHeightCalls?.length, 2);

  const activityBadgeSrc = readSource('components/ProfilePic/ActivityBadge.tsx');
  assert.match(activityBadgeSrc, /setPosition\(\s*\(prev\)\s*=>/);

  const contentReducerSrc = readSource('contexts/Content/reducer.ts');
  assert.match(
    contentReducerSrc,
    /case\s+'SET_PREV_URL':[\s\S]*?prevContentState\.prevUrl\s*===\s*action\.prevUrl/
  );

  const homeReducerSrc = readSource('contexts/Home/reducer.ts');
  assert.match(
    homeReducerSrc,
    /case\s+'SET_CURRENT_FEATURED_INDEX':[\s\S]*?state\.currentFeaturedIndex\s*===\s*action\.index/
  );
});
