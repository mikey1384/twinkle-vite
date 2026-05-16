import React, { useEffect, useMemo, useRef, useState } from 'react';
import Heading from '~/components/ContentPanel/Heading';
import Body, {
  HomeFeedCommentPreview,
  getRenderableHomeFeedPreviewComments
} from './Body';
import Actions from './Actions';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { placeholderHeights } from '~/constants/state';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { useContentState, useLazyLoad, useMyLevel } from '~/helpers/hooks';
import {
  determineUserCanRewardThis,
  determineXpButtonDisabled
} from '~/helpers';
import {
  getContentPanelCommentActionLabel,
  getContentPanelRewardActionBlockedReason,
  isContentPanelCommentActionEnabled,
  isContentPanelLikeActionEnabled,
  isContentPanelRecommendActionEnabled,
  isContentPanelRewardActionEnabled,
  isContentPanelRewardActionSupported,
  isHomeFeedRecommendActionSupported
} from '~/helpers/contentActionAvailability';
import {
  getHomeFeedContentPath,
  normalizeRootType,
  shouldUseExplicitFeedCardNavigation,
  shouldSkipFeedCardNavigation
} from './helpers/navigation';
import { getFeedCardSizing, type FeedCardSizing } from './helpers/sizing';
import {
  getHomeFeedFinalRewardLevel,
  type HomeFeedActionType
} from './helpers/actionState';
import {
  createHomeFeedActionIntent,
  createHomeFeedNavigationState
} from '~/helpers/homeFeedActionIntent';

const HOME_FEED_CARD_LAYOUT_CACHE_LIMIT = 600;
const HOME_FEED_CARD_LAYOUT_VERSION = 'root-user-target-preview-v1';
const HOME_FEED_PRIMARY_TEXT_SELECTOR = '.home-feed-card__primary-preview-text';
const HOME_FEED_CARD_TAP_MOVEMENT_THRESHOLD_PX = 10;
const HOME_FEED_CARD_TAP_SCROLL_THRESHOLD_PX = 2;
const homeFeedCardSizingCache = new Map<string, FeedCardSizing>();

export default function HomeFeedCard({
  feed,
  feedAnchorId,
  index,
  totalCount,
  theme
}: {
  feed: any;
  feedAnchorId?: string;
  index: number;
  totalCount: number;
  theme?: string;
}) {
  const contentId = Number(feed?.contentId || 0);
  const contentType = String(feed?.contentType || '');
  const [VisibilityRef, inView] = useInView();
  const navigate = useNavigate();
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const level = useKeyContext((v) => v.myState.level);
  const userId = useKeyContext((v) => v.myState.userId);
  const { canReward } = useMyLevel();
  const likeContent = useAppContext((v) => v.requestHelpers.likeContent);
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const onLikeContent = useContentContext((v) => v.actions.onLikeContent);
  const onLoadComments = useContentContext((v) => v.actions.onLoadComments);
  const contentState = useContentState({ contentId, contentType });
  const [likeLoading, setLikeLoading] = useState(false);
  const [primaryTextTruncated, setPrimaryTextTruncated] = useState(false);
  const loadingRef = useRef(false);
  const previewCommentLoadingRef = useRef(false);
  const PanelRef = useRef<HTMLDivElement | null>(null);
  const tapNavigationRef = useRef<{
    moved: boolean;
    pointerId: number;
    scrollLeft: number;
    scrollTop: number;
    startX: number;
    startY: number;
  } | null>(null);
  const feedPreviewContent = feed?.previewContent || {};
  const feedPreviewComments = Array.isArray(feed?.comments)
    ? feed.comments
    : [];
  const contentComments = Array.isArray(contentState.comments)
    ? contentState.comments
    : [];
  const previewComments = contentComments.length
    ? contentComments
    : feedPreviewComments;
  const renderablePreviewComments =
    getRenderableHomeFeedPreviewComments(previewComments);
  const feedIdentity =
    feedAnchorId ||
    feed?.feedId ||
    feed?.id ||
    feed?.timeStamp ||
    feed?.lastInteraction ||
    index;
  const previewContentForSecretState = {
    ...feed,
    ...feedPreviewContent,
    id: contentId,
    contentId,
    contentType,
    rootType: feedPreviewContent.rootType || feed?.rootType
  };
  const preliminaryRootType = contentState.loaded
    ? contentState.rootType || previewContentForSecretState.rootType
    : previewContentForSecretState.rootType;
  const normalizedRootType = useMemo(
    () => normalizeRootType(preliminaryRootType),
    [preliminaryRootType]
  );
  const rootContentState = useContentState({
    contentType: normalizedRootType || '',
    contentId:
      (contentState.loaded
        ? contentState.rootId || previewContentForSecretState.rootId
        : previewContentForSecretState.rootId) || 0
  });
  const previewRootObjForSecretState = mergePreviewSubjectSecretState(
    previewContentForSecretState.rootObj,
    contentState.rootObj
  );
  const rootObj = useMemo(() => {
    const previewRootObj = previewRootObjForSecretState || {};
    if (!(rootContentState?.id || rootContentState?.notFound)) {
      return previewRootObj;
    }
    return {
      ...previewRootObj,
      ...rootContentState,
      secretShown: Boolean(
        previewRootObj.secretShown || rootContentState.secretShown
      )
    };
  }, [previewRootObjForSecretState, rootContentState]);
  const preliminaryTargetObj = mergePreviewTargetSecretState(
    previewContentForSecretState.targetObj,
    contentState.targetObj,
    preliminaryRootType
  );
  const preliminaryContentForSecretState = contentState.loaded
    ? {
        ...previewContentForSecretState,
        ...contentState,
        targetObj: preliminaryTargetObj
      }
    : {
        ...previewContentForSecretState,
        comments: previewComments,
        loaded: false
      };
  const secretHiddenForPreview = getHomeFeedSecretHidden({
    content: preliminaryContentForSecretState,
    rootObj,
    targetObj: preliminaryTargetObj,
    userId
  });
  const hasPreviewCommentSlot =
    !secretHiddenForPreview && renderablePreviewComments.length > 0;
  const baseFeedContent = {
    ...previewContentForSecretState,
    __homeFeedHasCommentPreview: hasPreviewCommentSlot
  };
  const appliedContent = contentState.loaded
    ? mergeLoadedFeedContentWithPreviewState({
        contentState,
        previewComments,
        previewContent: baseFeedContent
      })
    : {
        ...baseFeedContent,
        comments: previewComments,
        loaded: false,
        previewLoaded: Boolean(
          contentState.previewLoaded || previewComments.length
        )
      };
  const calculatedSizing = getFeedCardSizing({
    content: appliedContent,
    rootObj,
    userId
  });
  const sizingKey = `${HOME_FEED_CARD_LAYOUT_VERSION}:${contentType}:${contentId}:${feedIdentity}:${
    userId || 0
  }:${hasPreviewCommentSlot ? 'comment-preview' : 'no-comment-preview'}:${
    calculatedSizing.flags.secretHidden ? 'secret-hidden' : 'secret-open'
  }`;
  const placeholderHeightKey = `home-feed-${sizingKey}`;
  const previousPlaceholderHeight = useMemo(
    () => placeholderHeights[placeholderHeightKey] || 0,
    [placeholderHeightKey]
  );
  const sizing = getStableHomeFeedCardSizing(sizingKey, calculatedSizing);
  const placeholderHeightRef = useRef(previousPlaceholderHeight);
  const [placeholderHeightState, setPlaceholderHeightState] = useState(() => ({
    height: previousPlaceholderHeight,
    key: placeholderHeightKey
  }));
  const placeholderHeight =
    placeholderHeightState.key === placeholderHeightKey
      ? placeholderHeightState.height
      : previousPlaceholderHeight;
  const sizingStyle = {
    '--home-feed-card-body-height': sizing.card.bodyHeight,
    '--home-feed-card-comment-preview-height': sizing.card.commentPreviewHeight,
    '--home-feed-card-heading-height': sizing.card.headingHeight,
    '--home-feed-card-height': sizing.card.desktopHeight,
    '--home-feed-card-mobile-body-height': sizing.card.mobileBodyHeight,
    '--home-feed-card-mobile-comment-preview-height':
      sizing.card.mobileCommentPreviewHeight,
    '--home-feed-card-mobile-heading-height': sizing.card.mobileHeadingHeight,
    '--home-feed-card-mobile-height': sizing.card.mobileHeight
  } as React.CSSProperties & Record<string, string>;
  const placeholderStyle: React.CSSProperties = placeholderHeight
    ? { ...sizingStyle, height: placeholderHeight }
    : sizingStyle;
  const isVisible = useLazyLoad({
    id: placeholderHeightKey,
    inView,
    PanelRef,
    onSetPlaceholderHeight: (height: number) => {
      const nextHeight = Math.ceil(Number(height) || 0);
      if (nextHeight <= 0) return;
      setPlaceholderHeightState({
        height: nextHeight,
        key: placeholderHeightKey
      });
      placeholderHeightRef.current = nextHeight;
    }
  });
  const contentShown = useMemo(() => inView || isVisible, [inView, isVisible]);
  const shouldHydrate =
    contentShown && contentId > 0 && contentType && !contentState.loaded;
  const commentsCount = getHomeFeedPreviewCommentCount(appliedContent);
  const shouldLoadPreviewComment =
    contentShown &&
    !secretHiddenForPreview &&
    contentId > 0 &&
    Boolean(contentType) &&
    commentsCount > 0 &&
    (!contentState.commentsLoaded || contentComments.length === 0) &&
    !contentState.previewLoaded &&
    renderablePreviewComments.length === 0;

  useEffect(() => {
    placeholderHeightRef.current = previousPlaceholderHeight;
    setPlaceholderHeightState({
      height: previousPlaceholderHeight,
      key: placeholderHeightKey
    });
  }, [placeholderHeightKey, previousPlaceholderHeight]);

  useEffect(() => {
    return function cleanUp() {
      if (placeholderHeightRef.current > 0) {
        placeholderHeights[placeholderHeightKey] = placeholderHeightRef.current;
      }
    };
  }, [placeholderHeightKey]);

  useEffect(() => {
    if (!shouldHydrate || loadingRef.current) return;
    loadingRef.current = true;
    hydrateContent();

    async function hydrateContent() {
      try {
        const data = await loadContent({
          contentId,
          contentType,
          rootType: feed?.rootType
        });
        if (!data) return;
        onInitContent({
          ...(feed?.feedId ? { ...data, feedId: feed.feedId } : data)
        });
        if (data.rootObj) {
          onInitContent({
            contentId: data.rootId,
            contentType: data.rootType,
            ...data.rootObj
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        loadingRef.current = false;
      }
    }
    // loadContent/onInitContent are stable context helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldHydrate, contentId, contentType, feed?.rootType, feed?.feedId]);

  useEffect(() => {
    if (!shouldLoadPreviewComment || previewCommentLoadingRef.current) return;
    previewCommentLoadingRef.current = true;
    loadPreviewComment();

    async function loadPreviewComment() {
      try {
        const data = await loadComments({
          contentId,
          contentType,
          limit: 5,
          isPreview: true
        });
        if (!data) return;
        onLoadComments({
          comments: Array.isArray(data.comments) ? data.comments : [],
          contentId,
          contentType,
          isPreview: true,
          loadMoreButton: Boolean(data.loadMoreButton)
        });
      } catch (error) {
        console.error(error);
      } finally {
        previewCommentLoadingRef.current = false;
      }
    }
    // loadComments/onLoadComments are stable context helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoadPreviewComment, contentId, contentType]);

  useEffect(() => {
    if (!contentShown) {
      setPrimaryTextTruncated(false);
      return;
    }

    const panel = PanelRef.current;
    if (!panel) return;
    const measuredPanel = panel;

    let animationFrame = 0;
    let destroyed = false;
    const resizeObserver =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(schedulePrimaryTextTruncationMeasure)
        : null;
    const mutationObserver =
      typeof MutationObserver === 'function'
        ? new MutationObserver(schedulePrimaryTextTruncationMeasure)
        : null;

    resizeObserver?.observe(measuredPanel);
    mutationObserver?.observe(measuredPanel, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      characterData: true,
      childList: true,
      subtree: true
    });
    window.addEventListener('resize', schedulePrimaryTextTruncationMeasure);
    document.fonts?.ready
      .then(() => {
        if (!destroyed) schedulePrimaryTextTruncationMeasure();
      })
      .catch(() => undefined);
    schedulePrimaryTextTruncationMeasure();

    return function cleanUpPrimaryTextTruncationMeasure() {
      destroyed = true;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener(
        'resize',
        schedulePrimaryTextTruncationMeasure
      );
    };

    function schedulePrimaryTextTruncationMeasure() {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        if (destroyed) return;
        const nextTruncated = hasHomeFeedPrimaryTextTruncation(measuredPanel);
        setPrimaryTextTruncated((current) =>
          current === nextTruncated ? current : nextTruncated
        );
      });
    }
  }, [contentShown, sizingKey]);

  const headingAction = useMemo(() => {
    if (appliedContent.commentId) {
      if (appliedContent.targetObj?.comment?.notFound) {
        return `replied${
          appliedContent.rootType && appliedContent.rootType !== 'user'
            ? ' on'
            : ''
        }`;
      }
      return 'replied to';
    }
    if (appliedContent.rootType === 'subject') return 'responded to';
    if (appliedContent.rootType === 'user') return 'posted a profile message';
    return 'commented on';
  }, [
    appliedContent.commentId,
    appliedContent.rootType,
    appliedContent.targetObj?.comment?.notFound
  ]);

  const contentPath = useMemo(
    () =>
      getHomeFeedContentPath({
        contentId,
        contentType,
        rootType: appliedContent.rootType
      }),
    [appliedContent.rootType, contentId, contentType]
  );
  const likesCount = Number(
    appliedContent.likes?.length || appliedContent.numLikes || 0
  );
  const rewardsCount = Number(
    appliedContent.rewards?.length || appliedContent.numRewards || 0
  );
  const likes = Array.isArray(appliedContent.likes) ? appliedContent.likes : [];
  const rewards = Array.isArray(appliedContent.rewards)
    ? appliedContent.rewards
    : [];
  const recommendations = Array.isArray(appliedContent.recommendations)
    ? appliedContent.recommendations
    : [];
  const recommendationsCount = Number(
    recommendations.length || appliedContent.numRecommendations || 0
  );
  const likedByUser = likes.some(
    (like: any) => Number(like.id) === Number(userId)
  );
  const rewardedByUser = rewards.some(
    (reward: any) => Number(reward.rewarderId) === Number(userId)
  );
  const recommendedByUser = recommendations.some(
    (recommendation: any) => Number(recommendation.userId) === Number(userId)
  );
  const finalRewardLevel = getHomeFeedFinalRewardLevel({
    content: appliedContent,
    rootObj
  });
  const userCanRewardThis = determineUserCanRewardThis({
    userLevel: level,
    canReward,
    recommendations,
    uploader: appliedContent.uploader,
    userId
  });
  const xpButtonDisabled = determineXpButtonDisabled({
    rewardLevel: finalRewardLevel,
    rewards,
    myId: userId,
    xpRewardInterfaceShown: false
  });
  const signInRequired = !userId;
  const actionsReady = Boolean(appliedContent.loaded);
  const secretHidden = sizing.flags.secretHidden;
  const likeDisabled =
    likeLoading ||
    !isContentPanelLikeActionEnabled({
      actionsReady,
      contentType,
      secretHidden
    });
  const commentDisabled = !isContentPanelCommentActionEnabled({
    actionsReady,
    contentType,
    secretHidden
  });
  const rewardShown = isContentPanelRewardActionSupported(contentType);
  const recommendShown = isHomeFeedRecommendActionSupported(contentType);
  const rewardDisableReason = getContentPanelRewardActionBlockedReason({
    actionsReady,
    contentType,
    secretHidden,
    userCanRewardThis,
    userId,
    uploaderId: appliedContent.uploader?.id,
    xpButtonDisabled
  });
  const rewardDisabled =
    rewardShown &&
    !isContentPanelRewardActionEnabled({
      actionsReady,
      contentType,
      secretHidden,
      userCanRewardThis,
      xpButtonDisabled
    });
  const recommendDisabled =
    recommendShown &&
    !isContentPanelRecommendActionEnabled({
      actionsReady,
      contentType,
      secretHidden
    });
  const commentLabel = getContentPanelCommentActionLabel(contentType);
  const appliedTheme = theme || profileTheme;

  if (
    !contentId ||
    !contentType ||
    appliedContent.notFound ||
    appliedContent.isDeleted ||
    appliedContent.isDeleteNotification
  ) {
    return null;
  }

  return (
    <ErrorBoundary componentPath="Home/Stories/FeedCard">
      <div
        ref={VisibilityRef}
        style={{ position: 'relative', zIndex: totalCount - index }}
      >
        {contentShown ? (
          <div ref={PanelRef} className={visiblePanelClass} style={sizingStyle}>
            <article
              className={`${cardClass} ${sizing.card.className}`}
              style={sizingStyle}
              tabIndex={0}
              onClick={handleCardClick}
              onKeyDown={handleCardKeyDown}
              onPointerCancel={handleCardPointerCancel}
              onPointerDown={handleCardPointerDown}
              onPointerMove={handleCardPointerMove}
              onPointerUp={handleCardPointerUp}
            >
              {appliedContent.loaded ? (
                <Heading
                  compactFeed
                  feedActivityType={feed?.feedActivityType}
                  feedTimeStamp={feed?.timeStamp}
                  feedUploader={feed?.feedUploader}
                  showActualDate={false}
                  theme={appliedTheme}
                  contentObj={appliedContent}
                  action={headingAction}
                />
              ) : (
                <div className="heading home-feed-card__heading-skeleton">
                  <div className="home-feed-card__avatar-skeleton" />
                  <div className="home-feed-card__heading-lines">
                    <div />
                    <span />
                  </div>
                </div>
              )}
              <Body
                content={appliedContent}
                loading={!appliedContent.loaded}
                rootObj={rootObj}
                sizing={sizing}
                theme={appliedTheme}
                userId={userId}
              />
              <Actions
                commentDisabled={commentDisabled}
                commentLabel={commentLabel}
                commentsCount={commentsCount}
                likedByUser={likedByUser}
                likeDisabled={likeDisabled}
                likeLoading={likeLoading}
                likesCount={likesCount}
                onComment={handleCommentActionClick}
                onLike={handleLikeActionClick}
                onOpen={handleOpenButtonClick}
                openProminent={primaryTextTruncated}
                onRecommend={handleRecommendActionClick}
                onReward={handleRewardActionClick}
                recommendedByUser={recommendedByUser}
                recommendDisabled={recommendDisabled}
                recommendShown={recommendShown}
                recommendationsCount={recommendationsCount}
                rewardedByUser={rewardedByUser}
                rewardDisableReason={rewardDisableReason}
                rewardDisabled={rewardDisabled}
                rewardShown={rewardShown}
                rewardsCount={rewardsCount}
                signInRequired={signInRequired}
              />
              {appliedContent.loaded && sizing.card.hasCommentPreview ? (
                <HomeFeedCommentPreview
                  comments={appliedContent.comments}
                  contentType={contentType}
                  theme={appliedTheme}
                />
              ) : null}
            </article>
          </div>
        ) : (
          <div className={placeholderClass} style={placeholderStyle} />
        )}
      </div>
    </ErrorBoundary>
  );

  function handleCardClick(event: React.MouseEvent<HTMLElement>) {
    if (
      shouldSkipFeedCardNavigation({
        currentTarget: event.currentTarget,
        defaultPrevented: event.defaultPrevented,
        target: event.target
      })
    ) {
      return;
    }
    if (shouldUseExplicitFeedCardNavigation()) return;
    navigateToContentPageFromHomeFeed();
  }

  function handleOpenButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    navigateToContentPageFromHomeFeed();
  }

  function handleCardPointerDown(event: React.PointerEvent<HTMLElement>) {
    tapNavigationRef.current = null;
    if (!shouldUseExplicitFeedCardNavigation()) return;
    if (event.pointerType === 'mouse' || event.button !== 0) return;
    if (
      shouldSkipFeedCardNavigation({
        currentTarget: event.currentTarget,
        defaultPrevented: event.defaultPrevented,
        target: event.target
      })
    ) {
      return;
    }

    tapNavigationRef.current = {
      moved: false,
      pointerId: event.pointerId,
      ...getHomeFeedScrollPosition(),
      startX: event.clientX,
      startY: event.clientY
    };
  }

  function handleCardPointerMove(event: React.PointerEvent<HTMLElement>) {
    const tapNavigation = tapNavigationRef.current;
    if (!tapNavigation || tapNavigation.pointerId !== event.pointerId) return;

    const xDelta = event.clientX - tapNavigation.startX;
    const yDelta = event.clientY - tapNavigation.startY;
    const scrollDelta = getHomeFeedScrollDelta(tapNavigation);
    if (
      xDelta * xDelta + yDelta * yDelta >
        HOME_FEED_CARD_TAP_MOVEMENT_THRESHOLD_PX *
          HOME_FEED_CARD_TAP_MOVEMENT_THRESHOLD_PX ||
      scrollDelta >
        HOME_FEED_CARD_TAP_SCROLL_THRESHOLD_PX *
          HOME_FEED_CARD_TAP_SCROLL_THRESHOLD_PX
    ) {
      tapNavigation.moved = true;
    }
  }

  function handleCardPointerCancel(event: React.PointerEvent<HTMLElement>) {
    if (tapNavigationRef.current?.pointerId !== event.pointerId) return;
    tapNavigationRef.current = null;
  }

  function handleCardPointerUp(event: React.PointerEvent<HTMLElement>) {
    const tapNavigation = tapNavigationRef.current;
    tapNavigationRef.current = null;
    if (!tapNavigation || tapNavigation.pointerId !== event.pointerId) return;
    if (
      getHomeFeedScrollDelta(tapNavigation) >
      HOME_FEED_CARD_TAP_SCROLL_THRESHOLD_PX *
        HOME_FEED_CARD_TAP_SCROLL_THRESHOLD_PX
    ) {
      return;
    }
    if (tapNavigation.moved) return;
    if (
      shouldSkipFeedCardNavigation({
        currentTarget: event.currentTarget,
        defaultPrevented: event.defaultPrevented,
        target: event.target
      })
    ) {
      return;
    }

    navigateToContentPageFromHomeFeed();
  }

  async function handleLikeActionClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (signInRequired) {
      onOpenSigninModal();
      return;
    }
    if (likeDisabled) return;

    try {
      setLikeLoading(true);
      const newLikes = await likeContent({
        id: contentId,
        contentType,
        rootType: appliedContent.rootType || feed?.rootType
      });
      onLikeContent({ likes: newLikes, contentId, contentType });
    } catch (error) {
      console.error(error);
    } finally {
      setLikeLoading(false);
    }
  }

  function handleCommentActionClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    handleNavigationActionClick(event, 'comment');
  }

  function handleRewardActionClick(event: React.MouseEvent<HTMLButtonElement>) {
    handleNavigationActionClick(event, 'reward');
  }

  function handleRecommendActionClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    handleNavigationActionClick(event, 'recommend');
  }

  function handleNavigationActionClick(
    event: React.MouseEvent<HTMLButtonElement>,
    action: HomeFeedActionType
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (signInRequired) {
      onOpenSigninModal();
      return;
    }
    if (action === 'comment' && commentDisabled) return;
    if (action === 'reward' && (!rewardShown || rewardDisabled)) return;
    if (action === 'recommend' && (!recommendShown || recommendDisabled)) {
      return;
    }
    navigateToContentPageFromHomeFeed(action);
  }

  function handleCardKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Enter') return;
    if (
      shouldSkipFeedCardNavigation({
        currentTarget: event.currentTarget,
        defaultPrevented: event.defaultPrevented,
        target: event.target
      })
    ) {
      return;
    }
    if (shouldUseExplicitFeedCardNavigation()) return;
    navigateToContentPageFromHomeFeed();
  }

  function navigateToContentPageFromHomeFeed(action?: HomeFeedActionType) {
    navigate(contentPath, {
      state: {
        homeFeedNavigation: createHomeFeedNavigationState({
          action,
          contentId,
          contentType
        }),
        ...(action
          ? {
              homeFeedActionIntent: createHomeFeedActionIntent({
                action,
                contentId,
                contentType
              })
            }
          : {})
      }
    });
  }
}

function mergeLoadedFeedContentWithPreviewState({
  contentState,
  previewComments,
  previewContent
}: {
  contentState: any;
  previewComments: any[];
  previewContent: any;
}) {
  const loadedContent = {
    ...previewContent,
    ...contentState,
    comments: previewComments
  };
  return {
    ...loadedContent,
    secretShown: Boolean(
      previewContent?.secretShown || contentState?.secretShown
    ),
    rootObj: mergePreviewSubjectSecretState(
      previewContent?.rootObj,
      contentState?.rootObj
    ),
    targetObj: mergePreviewTargetSecretState(
      previewContent?.targetObj,
      contentState?.targetObj,
      contentState?.rootType || previewContent?.rootType
    )
  };
}

function mergePreviewTargetSecretState(
  previewTargetObj: any,
  loadedTargetObj: any,
  rootType?: string
) {
  if (normalizeRootType(rootType) === 'user') {
    return mergeProfileTargetObj(previewTargetObj, loadedTargetObj);
  }

  if (!previewTargetObj && !loadedTargetObj) return loadedTargetObj;
  return {
    ...(previewTargetObj || {}),
    ...(loadedTargetObj || {}),
    subject: mergePreviewSubjectSecretState(
      previewTargetObj?.subject,
      loadedTargetObj?.subject
    )
  };
}

function mergeProfileTargetObj(previewTargetObj: any, loadedTargetObj: any) {
  const previewProfile = getProfileTargetObj(previewTargetObj);
  const loadedProfile = getProfileTargetObj(loadedTargetObj);
  const profile = {
    ...(previewProfile || {}),
    ...(loadedProfile || {})
  };
  const id =
    Number(profile.id || profile.contentId || 0) ||
    Number(previewTargetObj?.id || loadedTargetObj?.id || 0);
  const username =
    profile.username ||
    previewTargetObj?.username ||
    loadedTargetObj?.username ||
    previewTargetObj?.content ||
    loadedTargetObj?.content ||
    '';

  if (!id && !username) {
    return previewTargetObj?.contentType === 'user' ||
      loadedTargetObj?.contentType === 'user'
      ? { contentType: 'user' }
      : undefined;
  }

  const mergedProfile = {
    ...profile,
    content: username,
    contentId: id || profile.contentId,
    contentType: 'user',
    id: id || profile.id,
    username
  };

  return {
    ...mergedProfile,
    user: mergedProfile
  };
}

function getProfileTargetObj(targetObj: any) {
  if (!targetObj) return null;
  if (targetObj.user) return targetObj.user;
  if (targetObj.contentType === 'user') return targetObj;
  return null;
}

function mergePreviewSubjectSecretState(
  previewSubject: any,
  loadedSubject: any
) {
  if (!previewSubject && !loadedSubject) return loadedSubject;
  const mergedSubject = {
    ...(previewSubject || {}),
    ...(loadedSubject || {})
  };
  if (
    previewSubject?.secretShown !== undefined ||
    loadedSubject?.secretShown !== undefined
  ) {
    mergedSubject.secretShown = Boolean(
      previewSubject?.secretShown || loadedSubject?.secretShown
    );
  }
  return mergedSubject;
}

function getStableHomeFeedCardSizing(
  key: string,
  calculatedSizing: FeedCardSizing
) {
  const cachedSizing = homeFeedCardSizingCache.get(key);
  if (cachedSizing) {
    if (shouldUpgradeHomeFeedCardSizing(cachedSizing, calculatedSizing)) {
      rememberHomeFeedLayoutCacheEntry(
        homeFeedCardSizingCache,
        key,
        calculatedSizing
      );
      return calculatedSizing;
    }
    rememberHomeFeedLayoutCacheEntry(
      homeFeedCardSizingCache,
      key,
      cachedSizing
    );
    return cachedSizing;
  }
  rememberHomeFeedLayoutCacheEntry(
    homeFeedCardSizingCache,
    key,
    calculatedSizing
  );
  return calculatedSizing;
}

function shouldUpgradeHomeFeedCardSizing(
  cachedSizing: FeedCardSizing,
  calculatedSizing: FeedCardSizing
) {
  const cachedDesktopHeight = getFixedRemValue(cachedSizing.card.desktopHeight);
  const calculatedDesktopHeight = getFixedRemValue(
    calculatedSizing.card.desktopHeight
  );
  const cachedMobileHeight = getFixedRemValue(cachedSizing.card.mobileHeight);
  const calculatedMobileHeight = getFixedRemValue(
    calculatedSizing.card.mobileHeight
  );

  return (
    calculatedDesktopHeight > cachedDesktopHeight + 0.01 ||
    calculatedMobileHeight > cachedMobileHeight + 0.01
  );
}

function getFixedRemValue(cssValue: string) {
  const match = cssValue.match(/max\(([\d.]+)rem/);
  return match ? Number(match[1]) || 0 : 0;
}

function rememberHomeFeedLayoutCacheEntry<T>(
  cache: Map<string, T>,
  key: string,
  value: T
) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  if (cache.size <= HOME_FEED_CARD_LAYOUT_CACHE_LIMIT) return;

  const oldestKey = cache.keys().next().value;
  if (typeof oldestKey === 'string') cache.delete(oldestKey);
}

function getHomeFeedPreviewCommentCount(content: any) {
  const count = Number(
    content?.numComments ??
      content?.commentCount ??
      content?.numReplies ??
      content?.replyCount ??
      content?.numAnswers ??
      content?.answerCount ??
      0
  );
  if (count > 0) return count;

  return Array.isArray(content?.comments) ? content.comments.length : 0;
}

function getHomeFeedSecretHidden({
  content,
  rootObj,
  targetObj,
  userId
}: {
  content: any;
  rootObj: any;
  targetObj: any;
  userId?: number | string;
}) {
  const contentUploaderId =
    content?.uploader?.id || content?.userId || content?.uploaderId || 0;
  const contentSecretHidden =
    content?.contentType === 'subject' &&
    hasHomeFeedSubjectSecret(content) &&
    !content?.secretShown &&
    String(contentUploaderId) !== String(userId || '');
  const subjectUploaderId =
    targetObj?.subject?.uploader?.id || targetObj?.subject?.userId || 0;
  const targetSecretHidden =
    content?.contentType === 'comment' &&
    hasHomeFeedSubjectSecret(targetObj?.subject) &&
    !targetObj?.subject?.secretShown &&
    String(subjectUploaderId) !== String(userId || '');
  const rootSecretHidden =
    content?.contentType === 'comment' &&
    hasHomeFeedSubjectSecret(rootObj) &&
    !rootObj?.secretShown &&
    String(
      rootObj?.uploader?.id || rootObj?.userId || rootObj?.uploaderId || 0
    ) !== String(userId || '');

  return Boolean(contentSecretHidden || targetSecretHidden || rootSecretHidden);
}

function hasHomeFeedSubjectSecret(subject: any) {
  return Boolean(
    subject?.hasSecretAnswer ||
      subject?.hasSecretAttachment ||
      subject?.secretAnswer ||
      subject?.secretAttachment
  );
}

function getHomeFeedScrollPosition() {
  if (typeof document === 'undefined') {
    return { scrollLeft: 0, scrollTop: 0 };
  }
  const scrollingElement = document.scrollingElement || document.documentElement;
  const appElement = document.getElementById('App');
  return {
    scrollLeft:
      Number(scrollingElement?.scrollLeft || 0) +
      Number(appElement?.scrollLeft || 0),
    scrollTop:
      Number(scrollingElement?.scrollTop || 0) +
      Number(appElement?.scrollTop || 0)
  };
}

function getHomeFeedScrollDelta({
  scrollLeft,
  scrollTop
}: {
  scrollLeft: number;
  scrollTop: number;
}) {
  const current = getHomeFeedScrollPosition();
  const xDelta = current.scrollLeft - scrollLeft;
  const yDelta = current.scrollTop - scrollTop;
  return xDelta * xDelta + yDelta * yDelta;
}

function hasHomeFeedPrimaryTextTruncation(panel: HTMLElement) {
  const mainPreview = panel.querySelector<HTMLElement>(
    '.home-feed-card__panel-preview'
  );
  if (!mainPreview) return false;

  const primaryTextElements = Array.from(
    mainPreview.querySelectorAll<HTMLElement>(HOME_FEED_PRIMARY_TEXT_SELECTOR)
  );

  return primaryTextElements.some((element) =>
    isHomeFeedPrimaryTextElementTruncated(element, mainPreview)
  );
}

function isHomeFeedPrimaryTextElementTruncated(
  element: HTMLElement,
  mainPreview: HTMLElement
) {
  if (!element.textContent?.trim()) return false;

  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  if (element.scrollHeight > element.clientHeight + 1) {
    return true;
  }

  const clipRect = getHomeFeedPrimaryTextClipRect(element, mainPreview);
  return rect.bottom > clipRect.bottom + 1 || rect.top < clipRect.top - 1;
}

function getHomeFeedPrimaryTextClipRect(
  element: HTMLElement,
  mainPreview: HTMLElement
) {
  const rootRect = mainPreview.getBoundingClientRect();
  const clipRect = {
    bottom: rootRect.bottom,
    left: rootRect.left,
    right: rootRect.right,
    top: rootRect.top
  };
  let current: HTMLElement | null = element.parentElement;

  while (current) {
    if (doesElementClipContent(current)) {
      const currentRect = current.getBoundingClientRect();
      clipRect.bottom = Math.min(clipRect.bottom, currentRect.bottom);
      clipRect.left = Math.max(clipRect.left, currentRect.left);
      clipRect.right = Math.min(clipRect.right, currentRect.right);
      clipRect.top = Math.max(clipRect.top, currentRect.top);
    }

    if (current === mainPreview) break;
    current = current.parentElement;
  }

  return clipRect;
}

function doesElementClipContent(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  return [style.overflow, style.overflowX, style.overflowY].some(
    (overflow) =>
      overflow === 'hidden' || overflow === 'clip' || overflow === 'auto'
  );
}

const placeholderClass = css`
  box-sizing: border-box;
  width: 100%;
  height: var(--home-feed-card-height);
  @media (max-width: ${mobileMaxWidth}) {
    height: var(--home-feed-card-mobile-height);
  }
`;

const visiblePanelClass = css`
  box-sizing: border-box;
  width: 100%;
  height: var(--home-feed-card-height);
  @media (max-width: ${mobileMaxWidth}) {
    height: var(--home-feed-card-mobile-height);
  }
`;

const cardClass = css`
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  height: var(--home-feed-card-height);
  min-height: var(--home-feed-card-height);
  max-height: var(--home-feed-card-height);
  padding: 1rem 1rem 0.85rem 1.2rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: #fff;
  cursor: pointer;
  overflow: hidden;
  content-visibility: auto;
  contain-intrinsic-size: auto var(--home-feed-card-height);
  transition: border-color 0.18s ease;
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      border-color: var(--ui-border-strong);
    }
  }
  @media (hover: none), (pointer: coarse), (max-width: ${mobileMaxWidth}) {
    cursor: default;
  }
  &:focus-visible {
    outline: 2px solid ${Color.logoBlue(0.45)};
    outline-offset: 2px;
  }
  .heading {
    box-sizing: border-box;
    display: flex;
    flex: 0 0 var(--home-feed-card-heading-height);
    align-items: center;
    gap: 0.9rem;
    width: 100%;
    height: var(--home-feed-card-heading-height);
    padding: 0.2rem 0.2rem 0.4rem 0.2rem;
    overflow: hidden;
  }
  .heading.compact-feed {
    gap: 0.75rem;
    padding-bottom: 0.2rem;
  }
  .title {
    font-size: 1.6rem;
    font-weight: 700;
    line-height: 1.35;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .heading.compact-feed .title {
    font-weight: 800;
    line-height: 1.18;
  }
  .home-feed-heading-action {
    color: ${Color.green()};
    font-weight: 850;
  }
  .timestamp {
    display: inline-block;
    color: ${Color.gray()};
    font-size: 1.2rem;
  }
  .home-feed-card__heading-skeleton {
    min-height: var(--home-feed-card-heading-height);
  }
  .home-feed-card__body {
    box-sizing: border-box;
    flex: 0 0 var(--home-feed-card-body-height);
    height: var(--home-feed-card-body-height);
    min-height: 0;
    overflow: hidden;
  }
  .home-feed-card__actions {
    box-sizing: border-box;
    flex: 0 0 2.95rem;
    height: 2.95rem;
    min-height: 0;
    overflow: hidden;
  }
  .home-feed-card__comment-preview-slot {
    box-sizing: border-box;
    flex: 0 0 var(--home-feed-card-comment-preview-height);
    height: var(--home-feed-card-comment-preview-height);
    min-height: 0;
    margin-top: 0.1rem;
    overflow: hidden;
  }
  .home-feed-card__avatar-skeleton,
  .home-feed-card__heading-lines > div,
  .home-feed-card__heading-lines > span {
    background: linear-gradient(90deg, #f2f4f7, #e8ecf2, #f2f4f7);
    background-size: 200% 100%;
    animation: homeFeedCardHeaderSkeleton 1.2s ease-in-out infinite;
  }
  .home-feed-card__avatar-skeleton {
    width: 3.8rem;
    height: 3.8rem;
    flex-shrink: 0;
    border-radius: 999px;
  }
  .home-feed-card__heading-lines {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 0.5rem;
  }
  .home-feed-card__heading-lines > div {
    width: 58%;
    height: 1.5rem;
    border-radius: 0.6rem;
  }
  .home-feed-card__heading-lines > span {
    width: 24%;
    height: 1rem;
    border-radius: 0.5rem;
  }
  @keyframes homeFeedCardHeaderSkeleton {
    0% {
      background-position: 0% 50%;
    }
    100% {
      background-position: -200% 50%;
    }
  }
  @media (max-width: ${mobileMaxWidth}) {
    height: var(--home-feed-card-mobile-height);
    min-height: var(--home-feed-card-mobile-height);
    max-height: var(--home-feed-card-mobile-height);
    gap: max(0.75rem, 7.5px);
    padding: max(0.75rem, 7.5px) 0 max(0.2rem, 2px) 0;
    border-left: 0;
    border-right: 0;
    border-radius: 0;
    .heading,
    > div,
    > section {
      padding-left: 1rem;
      padding-right: 1rem;
    }
    .title {
      font-size: 1.94rem;
    }
    .heading {
      flex-basis: var(--home-feed-card-mobile-heading-height);
      height: var(--home-feed-card-mobile-heading-height);
    }
    .home-feed-card__heading-skeleton {
      min-height: var(--home-feed-card-mobile-heading-height);
    }
    .home-feed-card__body {
      flex-basis: var(--home-feed-card-mobile-body-height);
      height: var(--home-feed-card-mobile-body-height);
    }
    .home-feed-card__actions {
      flex-basis: max(3.1rem, 31px);
      height: max(3.1rem, 31px);
    }
    .home-feed-card__comment-preview-slot {
      flex-basis: var(--home-feed-card-mobile-comment-preview-height);
      height: var(--home-feed-card-mobile-comment-preview-height);
      margin-top: -0.5rem;
    }
  }
`;
