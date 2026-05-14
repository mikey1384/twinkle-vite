import React, { useEffect, useMemo, useRef, useState } from 'react';
import Heading from '~/components/ContentPanel/Heading';
import Body from './Body';
import Actions from './Actions';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { placeholderHeights } from '~/constants/state';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import {
  getHomeFeedContentPath,
  normalizeRootType,
  shouldUseExplicitFeedCardNavigation,
  shouldSkipFeedCardNavigation
} from './helpers/navigation';
import { getFeedCardSizing, type FeedCardSizing } from './helpers/sizing';

const HOME_FEED_CARD_LAYOUT_CACHE_LIMIT = 600;
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
  const userId = useKeyContext((v) => v.myState.userId);
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const onLoadComments = useContentContext((v) => v.actions.onLoadComments);
  const contentState = useContentState({ contentId, contentType });
  const loadingRef = useRef(false);
  const previewCommentLoadingRef = useRef(false);
  const PanelRef = useRef<HTMLDivElement | null>(null);
  const commentSlotStateRef = useRef({ key: '', value: false });
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
  const previewCommentCount = getHomeFeedPreviewCommentCount({
    ...feed,
    ...feedPreviewContent,
    ...contentState,
    contentType
  });
  const hasPreviewCommentCandidate =
    previewCommentCount > 0 ||
    feedPreviewComments.length > 0 ||
    contentComments.length > 0;
  const feedIdentity =
    feedAnchorId ||
    feed?.feedId ||
    feed?.id ||
    feed?.timeStamp ||
    feed?.lastInteraction ||
    index;
  const commentSlotKey = `${contentType}:${contentId}:${feedIdentity}`;
  if (commentSlotStateRef.current.key !== commentSlotKey) {
    commentSlotStateRef.current = {
      key: commentSlotKey,
      value: hasPreviewCommentCandidate
    };
  } else if (!commentSlotStateRef.current.value && hasPreviewCommentCandidate) {
    commentSlotStateRef.current = {
      key: commentSlotKey,
      value: true
    };
  }
  const hasPreviewCommentSlot = commentSlotStateRef.current.value;
  const baseFeedContent = {
    ...feed,
    ...feedPreviewContent,
    __homeFeedHasCommentPreview: hasPreviewCommentSlot,
    id: contentId,
    contentId,
    contentType,
    rootType: feedPreviewContent.rootType || feed?.rootType
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
  const normalizedRootType = useMemo(
    () => normalizeRootType(appliedContent.rootType),
    [appliedContent.rootType]
  );
  const rootContentState = useContentState({
    contentType: normalizedRootType || '',
    contentId: appliedContent.rootId || 0
  });
  const rootObj = useMemo(() => {
    const previewRootObj = appliedContent.rootObj || {};
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
  }, [appliedContent.rootObj, rootContentState]);
  const calculatedSizing = getFeedCardSizing({
    content: appliedContent,
    rootObj,
    userId
  });
  const sizingKey = `${contentType}:${contentId}:${feedIdentity}:${
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
    '--home-feed-card-heading-height': sizing.card.headingHeight,
    '--home-feed-card-height': sizing.card.desktopHeight,
    '--home-feed-card-mobile-body-height': sizing.card.mobileBodyHeight,
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
  const previewCommentLoaded = Boolean(
    contentState.previewLoaded || previewComments.length
  );
  const shouldLoadPreviewComment =
    contentShown &&
    hasPreviewCommentSlot &&
    contentId > 0 &&
    Boolean(contentType) &&
    commentsCount > 0 &&
    (!contentState.commentsLoaded || contentComments.length === 0) &&
    !previewCommentLoaded;

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
          limit: 1,
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
                commentLabel={contentType === 'subject' ? 'Respond' : 'Comment'}
                commentsCount={commentsCount}
                likesCount={likesCount}
                onOpen={handleOpenButtonClick}
                rewardsCount={rewardsCount}
              />
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
    navigate(contentPath);
  }

  function handleOpenButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    navigate(contentPath);
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
    navigate(contentPath);
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
      contentState?.targetObj
    )
  };
}

function mergePreviewTargetSecretState(
  previewTargetObj: any,
  loadedTargetObj: any
) {
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
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      border-color: var(--ui-border-strong);
      background: ${Color.whiteGray(0.45)};
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
    flex: 0 0 1.6rem;
    height: 1.6rem;
    min-height: 0;
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
    padding: 0.9rem 0 0.75rem 0;
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
      font-size: 1.45rem;
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
  }
`;
