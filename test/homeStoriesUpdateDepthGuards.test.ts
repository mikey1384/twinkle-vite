import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createCardWindowMeasurementController,
  getClearedCardMeasurementState,
  getNextCardMeasurementState,
  resolveCardWindowMeasuredWidth,
  resolveCardWindowOuterResize,
  shouldInvalidateCardWindowMeasurement,
  type CardWindowMeasurement,
  type CardWindowSize
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

  assert.deepEqual(resolveCardWindowOuterResize(recorded, 360, true), {
    type: 'noop'
  });
  assert.deepEqual(resolveCardWindowOuterResize(recorded, 0, false), {
    type: 'noop'
  });
  assert.deepEqual(resolveCardWindowOuterResize(recorded, 600, true), {
    type: 'update',
    size: { height: 240, width: 600 }
  });
  assert.deepEqual(resolveCardWindowOuterResize(recorded, 600, false), {
    type: 'clear'
  });
});

test('useCardWindow preserves measured height when panelRef fires before visibilityRef on mount and width resize', () => {
  const sizes = new Map<string, CardWindowSize>();
  let measurement: CardWindowMeasurement = { key: 'card-1' };
  let updateCalls = 0;
  let clearCalls = 0;

  const controller = createCardWindowMeasurementController({
    cacheLimit: 600,
    sizes,
    onUpdate: (key, next) => {
      updateCalls += 1;
      measurement = getNextCardMeasurementState(measurement, key, next);
    },
    onClear: (key) => {
      clearCalls += 1;
      measurement = getClearedCardMeasurementState(measurement, key);
    }
  });
  controller.syncLatestSize(measurement.size);

  // Initial mount with inner/outer width mismatch: child panelRef fires before parent visibilityRef.
  controller.observePanelResize('card-1', 240, 358);
  controller.observeOuterResize('card-1', 360, true);
  assert.equal(clearCalls, 0);
  assert.deepEqual(sizes.get('card-1'), { height: 240, width: 360 });
  assert.deepEqual(measurement, {
    key: 'card-1',
    size: { height: 240, width: 360 }
  });

  // Subsequent observations at the same layout do not ping-pong or churn state.
  const updatesAfterMount = updateCalls;
  controller.observePanelResize('card-1', 240, 358);
  controller.observeOuterResize('card-1', 360, true);
  assert.equal(updateCalls, updatesAfterMount);
  assert.equal(clearCalls, 0);

  // Viewport resize / rotation while mounted (height changes): panelRef fires before visibilityRef.
  controller.observePanelResize('card-1', 200, 598);
  controller.observeOuterResize('card-1', 600, true);
  assert.equal(clearCalls, 0);
  assert.deepEqual(sizes.get('card-1'), { height: 200, width: 600 });
  assert.deepEqual(measurement, {
    key: 'card-1',
    size: { height: 200, width: 600 }
  });

  // Viewport resize / rotation while mounted (height unchanged): panelRef returns early,
  // visibilityRef updates width in place instead of clearing measured height.
  controller.observePanelResize('card-1', 200, 720);
  controller.observeOuterResize('card-1', 720, true);
  assert.equal(clearCalls, 0);
  assert.deepEqual(sizes.get('card-1'), { height: 200, width: 720 });
  assert.deepEqual(measurement, {
    key: 'card-1',
    size: { height: 200, width: 720 }
  });

  // Reverse delivery order while mounted (visibilityRef before panelRef): converges cleanly.
  controller.observeOuterResize('card-1', 420, true);
  controller.observePanelResize('card-1', 260, 418);
  assert.equal(clearCalls, 0);
  assert.deepEqual(sizes.get('card-1'), { height: 260, width: 420 });
  assert.deepEqual(measurement, {
    key: 'card-1',
    size: { height: 260, width: 420 }
  });

  // cacheKey change while visible resets outer width and re-attaches panelRef before visibilityRef.
  controller.resetOuterWidth();
  controller.syncLatestSize(sizes.get('card-2'));
  controller.observePanelResize('card-2', 310, 418);
  controller.observeOuterResize('card-2', 420, true);
  assert.equal(clearCalls, 0);
  assert.deepEqual(sizes.get('card-2'), { height: 310, width: 420 });
  assert.deepEqual(measurement, {
    key: 'card-2',
    size: { height: 310, width: 420 }
  });

  // Hidden page reporting 0px keeps the last usable measurement.
  controller.observePanelResize('card-2', 0, 0);
  controller.observeOuterResize('card-2', 0, true);
  controller.observeOuterResize('card-2', 0, false);
  assert.equal(clearCalls, 0);
  assert.deepEqual(sizes.get('card-2'), { height: 310, width: 420 });

  // Off-screen width change (panel unmounted) still invalidates the stale height.
  controller.observeOuterResize('card-2', 600, false);
  assert.equal(clearCalls, 1);
  assert.equal(sizes.has('card-2'), false);
  assert.deepEqual(measurement, { key: 'card-2' });
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
  assert.match(useCardWindowSrc, /createCardWindowMeasurementController\(/);
  assert.match(
    useCardWindowSrc,
    /controller\.observeOuterResize\(\s*cacheKey,\s*width,\s*Boolean\(panelElementRef\.current\)\s*\)/
  );
  assert.match(useCardWindowSrc, /controller\.observePanelResize\(/);

  const cardWindowStateSrc = readSource(
    'containers/Home/Stories/hooks/cardWindowState.ts'
  );
  assert.match(cardWindowStateSrc, /resolveCardWindowMeasuredWidth\(/);
  assert.match(cardWindowStateSrc, /resolveCardWindowOuterResize\(/);

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
