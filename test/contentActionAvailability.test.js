import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function extractSetMembers(source, name) {
  const match = source.match(
    new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\);`)
  );
  assert.ok(match, `Expected ${name} set`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
}

const actionAvailabilitySource = readSource(
  'src/helpers/contentActionAvailability.ts'
);
const feedCardSource = readSource(
  'src/containers/Home/Stories/FeedCard/index.tsx'
);
const feedCardActionsSource = readSource(
  'src/containers/Home/Stories/FeedCard/Actions.tsx'
);
const feedActionStateSource = readSource(
  'src/containers/Home/Stories/FeedCard/helpers/actionState.ts'
);
const contentPanelBodySource = readSource(
  'src/components/ContentPanel/Body/index.tsx'
);
const bottomInterfaceSource = readSource(
  'src/components/ContentPanel/Body/BottomInterface.tsx'
);
const rewardButtonSource = readSource(
  'src/components/Buttons/RewardButton.tsx'
);
const homeFeedActionIntentSource = readSource(
  'src/helpers/homeFeedActionIntent.ts'
);
const scrollAnchorRestorationSource = readSource(
  'src/helpers/hooks/useScrollAnchorRestoration.ts'
);
const contentPageSource = readSource('src/containers/ContentPage.tsx');
const linkPageSource = readSource('src/containers/LinkPage/index.tsx');
const videoPageSource = readSource('src/containers/VideoPage/index.tsx');
const videoDetailsSource = readSource(
  'src/containers/VideoPage/Details/index.tsx'
);
const clearHomeFeedActionIntentStateSource = homeFeedActionIntentSource.match(
  /export function clearHomeFeedActionIntentState[\s\S]*?\n}/
)?.[0];

assert.deepEqual(
  extractSetMembers(
    actionAvailabilitySource,
    'contentPanelNoRewardContentTypes'
  ).sort(),
  ['aiStory', 'build', 'dailyReflection', 'pass', 'sharedTopic', 'xpChange']
);
assert.deepEqual(
  extractSetMembers(
    actionAvailabilitySource,
    'homeFeedUnsupportedRecommendContentTypes'
  ),
  ['build']
);
assert.doesNotMatch(actionAvailabilitySource, /NoRecommend/);
assert.match(
  actionAvailabilitySource,
  /isContentPanelRecommendActionEnabled[\s\S]*actionsReady && !secretHidden/
);
assert.match(
  actionAvailabilitySource,
  /isContentPanelCommentActionEnabled[\s\S]*actionsReady && !secretHidden/
);
assert.match(
  actionAvailabilitySource,
  /isContentPanelRewardActionEnabled[\s\S]*isContentPanelRewardActionSupported\(contentType\)/
);
assert.match(actionAvailabilitySource, /isContentPanelRewardActionSupported/);
assert.match(actionAvailabilitySource, /isHomeFeedRecommendActionSupported/);
assert.match(
  actionAvailabilitySource,
  /getContentPanelRewardActionBlockedReason/
);
assert.match(actionAvailabilitySource, /getXpRewardActionBlockedReason/);
assert.match(actionAvailabilitySource, /Log in to reward this\./);
assert.match(actionAvailabilitySource, /Open this first to reward it\./);
assert.match(actionAvailabilitySource, /Reveal the secret before rewarding\./);
assert.match(actionAvailabilitySource, /You can't reward your own content\./);
assert.match(
  actionAvailabilitySource,
  /This has already received all available Twinkles\./
);
assert.match(
  actionAvailabilitySource,
  /You already rewarded the maximum amount\./
);

assert.match(feedCardSource, /isContentPanelLikeActionEnabled/);
assert.match(feedCardSource, /isContentPanelCommentActionEnabled/);
assert.match(feedCardSource, /isContentPanelRewardActionEnabled/);
assert.match(feedCardSource, /getContentPanelRewardActionBlockedReason/);
assert.match(feedCardSource, /isContentPanelRecommendActionEnabled/);
assert.match(feedCardSource, /isContentPanelRewardActionSupported/);
assert.match(feedCardSource, /isHomeFeedRecommendActionSupported/);
assert.match(
  feedCardSource,
  /const rewardShown = isContentPanelRewardActionSupported\(contentType\);/
);
assert.match(
  feedCardSource,
  /const recommendShown = isHomeFeedRecommendActionSupported\(contentType\);/
);
assert.match(feedCardSource, /rewardShown={rewardShown}/);
assert.match(feedCardSource, /rewardDisableReason={rewardDisableReason}/);
assert.match(feedCardSource, /recommendShown={recommendShown}/);
assert.match(feedCardSource, /const signInRequired = !userId;/);
assert.match(
  feedCardSource,
  /const actionsReady = Boolean\(appliedContent\.loaded\);/
);
assert.match(feedCardSource, /signInRequired={signInRequired}/);
assert.match(feedCardSource, /onOpenSigninModal/);
assert.match(
  feedCardSource,
  /if \(signInRequired\) \{[\s\S]*?onOpenSigninModal\(\);[\s\S]*?return;[\s\S]*?\}/
);
assert.match(
  feedCardSource,
  /homeFeedActionIntent: createHomeFeedActionIntent\(\{[\s\S]*action,[\s\S]*contentId,[\s\S]*contentType/
);
assert.match(feedCardSource, /createHomeFeedNavigationState/);
assert.match(
  feedCardSource,
  /homeFeedNavigation: createHomeFeedNavigationState/
);
assert.doesNotMatch(feedCardSource, /homeFeedNoRecommendContentTypes/);
assert.doesNotMatch(feedCardSource, /homeFeedNoRewardContentTypes/);
assert.doesNotMatch(feedCardSource, /homeFeedNonLikeContentTypes/);
assert.doesNotMatch(feedCardSource, /Boolean\(disableReason\)/);
assert.match(feedCardActionsSource, /rewardShown = true/);
assert.match(feedCardActionsSource, /recommendShown = true/);
assert.match(feedCardActionsSource, /{rewardShown && \(/);
assert.match(feedCardActionsSource, /{recommendShown && \(/);
assert.match(feedCardActionsSource, /rewardDisableReason\?: string/);
assert.match(feedCardActionsSource, /signInRequired\?: boolean/);
assert.match(
  feedCardActionsSource,
  /disabled={likeLoading \|\| \(!signInRequired && likeDisabled\)}/
);
assert.match(
  feedCardActionsSource,
  /disabled={!signInRequired && commentDisabled}/
);
assert.match(
  feedCardActionsSource,
  /disabled={!signInRequired && recommendDisabled}/
);
assert.match(
  feedCardActionsSource,
  /!signInRequired && rewardDisabled && rewardBlockedReason/
);
assert.match(
  feedCardActionsSource,
  /aria-disabled={rewardIsBlocked \|\| undefined}/
);
assert.doesNotMatch(feedCardActionsSource, /disabled={rewardDisabled}/);
assert.match(feedCardActionsSource, /FullTextReveal/);
assert.match(feedCardActionsSource, /home-feed-card__action-button reward/);
assert.match(feedCardActionsSource, /rewardIsBlocked \? 'blocked' : ''/);
assert.match(
  feedCardActionsSource,
  /&:not\(:disabled\):not\(\.blocked\):hover/
);

assert.doesNotMatch(feedActionStateSource, /homeFeedNo/);
assert.doesNotMatch(feedActionStateSource, /homeFeedNonLikeContentTypes/);
assert.doesNotMatch(feedActionStateSource, /getHomeFeedDisableReason/);

assert.match(contentPanelBodySource, /isContentPanelCommentActionEnabled/);
assert.match(contentPanelBodySource, /isContentPanelRewardActionEnabled/);
assert.match(contentPanelBodySource, /isContentPanelRecommendActionEnabled/);
assert.match(contentPanelBodySource, /centerHomeFeedActionIntentTarget/);
assert.match(contentPanelBodySource, /RecommendationInterfaceRef/);
assert.doesNotMatch(
  contentPanelBodySource,
  /contentPanelNoRecommendContentTypes/
);
assert.doesNotMatch(
  contentPanelBodySource,
  /intent\.action === 'recommend'[\s\S]{0,260}contentType !== 'pass'/
);
assert.doesNotMatch(
  contentPanelBodySource,
  /intent\.action === 'comment'[\s\S]{0,220}!disableReason/
);

assert.match(bottomInterfaceSource, /getContentPanelCommentActionLabel/);
assert.match(bottomInterfaceSource, /getContentPanelRewardActionBlockedReason/);
assert.match(bottomInterfaceSource, /isContentPanelRewardActionEnabled/);
assert.match(bottomInterfaceSource, /isContentPanelRewardActionSupported/);
assert.match(
  bottomInterfaceSource,
  /disableReason={rewardActionBlockedReason}/
);
assert.doesNotMatch(bottomInterfaceSource, /const noRewardContentTypes/);
assert.match(rewardButtonSource, /getXpRewardActionBlockedReason/);
assert.match(rewardButtonSource, /const blockedRewardButtonClass = css`/);
assert.match(rewardButtonSource, /cursor: default;/);
assert.match(rewardButtonSource, /if \(isBlocked\)/);
assert.match(rewardButtonSource, /event\?\.stopPropagation\(\);/);
assert.doesNotMatch(rewardButtonSource, /disabled={!!disableReason}/);
assert.match(rewardButtonSource, /text={blockedReason}/);
assert.match(rewardButtonSource, /{rewardLabel}/);
assert.match(homeFeedActionIntentSource, /centerHomeFeedActionIntentTarget/);
assert.match(
  homeFeedActionIntentSource,
  /scrollHomeFeedActionIntentTargetIfNeeded/
);
assert.match(homeFeedActionIntentSource, /homeFeedNavigationStateKey/);
assert.match(homeFeedActionIntentSource, /createHomeFeedNavigationState/);
assert.match(homeFeedActionIntentSource, /getMatchingHomeFeedNavigationState/);
assert.match(homeFeedActionIntentSource, /clearHomeFeedNavigationState/);
assert.match(homeFeedActionIntentSource, /homeFeedNavigationKeyShouldClear/);
assert.match(homeFeedActionIntentSource, /suppressScrollAnchorSaves/);
assert.doesNotMatch(homeFeedActionIntentSource, /scrollIntoView/);
assert.match(homeFeedActionIntentSource, /scrollAdjustment = -120/);
assert.match(
  homeFeedActionIntentSource,
  /homeFeedActionIntentTargetIsAlreadyVisible/
);
assert.match(homeFeedActionIntentSource, /elementHasMeasurableLayout/);
assert.match(homeFeedActionIntentSource, /documentHasMeaningfulScrollRoom/);
assert.match(
  homeFeedActionIntentSource,
  /elementIsComfortablyVisibleInViewport/
);
assert.ok(clearHomeFeedActionIntentStateSource);
assert.match(
  clearHomeFeedActionIntentStateSource,
  /delete nextState\[homeFeedActionIntentStateKey\]/
);
assert.match(
  clearHomeFeedActionIntentStateSource,
  /const navigationState = nextState\[homeFeedNavigationStateKey\]/
);
assert.match(
  clearHomeFeedActionIntentStateSource,
  /isHomeFeedNavigationState\(navigationState\) && navigationState\.action/
);
assert.match(
  clearHomeFeedActionIntentStateSource,
  /delete nextState\[homeFeedNavigationStateKey\]/
);
assert.match(scrollAnchorRestorationSource, /ignoreSavedAnchor = false/);
assert.match(scrollAnchorRestorationSource, /ignoredSavedAnchorKeyRef/);
assert.match(scrollAnchorRestorationSource, /scrollAnchorSavesAreSuppressed/);
assert.match(
  scrollAnchorRestorationSource,
  /if \(scrollAnchorSavesAreSuppressed\(\)\) return;/
);
assert.match(contentPageSource, /getMatchingHomeFeedNavigationState/);
assert.match(
  contentPageSource,
  /ignoreSavedAnchor: Boolean\(homeFeedNavigationState\)/
);
assert.match(contentPageSource, /clearHomeFeedNavigationState/);
assert.match(contentPageSource, /homeFeedNavigationState\.action/);
assert.match(contentPageSource, /addHomeFeedNavigationClearListeners/);
assert.match(contentPageSource, /homeFeedNavigationKeyShouldClear/);
assert.match(linkPageSource, /centerHomeFeedActionIntentTarget/);
assert.match(linkPageSource, /getMatchingHomeFeedNavigationState/);
assert.match(
  linkPageSource,
  /ignoreSavedAnchor: Boolean\(homeFeedNavigationState\)/
);
assert.match(linkPageSource, /clearHomeFeedNavigationState/);
assert.match(linkPageSource, /homeFeedNavigationState\.action/);
assert.match(linkPageSource, /addHomeFeedNavigationClearListeners/);
assert.match(linkPageSource, /homeFeedNavigationKeyShouldClear/);
assert.match(linkPageSource, /RecommendationInterfaceRef/);
assert.match(videoPageSource, /getMatchingHomeFeedNavigationState/);
assert.match(
  videoPageSource,
  /ignoreSavedAnchor: Boolean\(homeFeedNavigationState\)/
);
assert.match(videoPageSource, /clearHomeFeedNavigationState/);
assert.match(videoPageSource, /homeFeedNavigationState\.action/);
assert.match(videoPageSource, /addHomeFeedNavigationClearListeners/);
assert.match(videoPageSource, /homeFeedNavigationKeyShouldClear/);
assert.match(videoDetailsSource, /centerHomeFeedActionIntentTarget/);
assert.match(videoDetailsSource, /RecommendationInterfaceRef/);

console.log('Content action availability guard passed.');
