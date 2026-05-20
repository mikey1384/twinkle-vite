import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  type Location,
  useLocation,
  useNavigate,
  useParams
} from 'react-router-dom';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import FavoriteButton from '~/components/Build/FavoriteButton';
import AiEnergyCard from '~/components/AiEnergyCard';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import UsernameText from '~/components/Texts/UsernameText';
import { mobileMaxWidth } from '~/constants/css';
import { isCommunityFundRechargeAvailable } from '~/helpers/aiEnergy';
import {
  useAppContext,
  useContentContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { useCollaborationDirectMessageUpdater } from '~/helpers/hooks/useCollaborationDirectMessageUpdater';
import { useContributionInviteStatusUpdater } from '~/helpers/hooks/useContributionInviteStatusUpdater';
import {
  clearHomeFeedActionIntentState,
  focusHomeFeedCommentIntentTarget,
  getMatchingHomeFeedActionIntent
} from '~/helpers/homeFeedActionIntent';
import type { Content } from '~/types';
import PreviewPanel from '../PreviewPanel';
import type { PreviewMountContext } from '../PreviewPanel/types';
import { BUILD_TRENDING_SHOWCASE_VIEW_SOURCE } from '../constants/runtimeViewSources';
import { formatVisitLabel } from '~/helpers/stringHelpers';
import CommentsDrawer from './CommentsDrawer';
import CollaborationRequestModal from '~/components/Modals/BuildCollaborationRequestModal';
import type {
  AiUsagePolicy,
  BuildCollaborationRequest,
  RuntimeBuild
} from './types';

function parseRuntimeMountContext(search: string): PreviewMountContext | null {
  const params = new URLSearchParams(search);
  const mountType = String(params.get('mountType') || '').trim();
  const mountId = Number(params.get('mountId') || 0);
  if (mountType === 'subject' && Number.isFinite(mountId) && mountId > 0) {
    return { type: 'subject', id: Math.floor(mountId) };
  }

  const subjectId = Number(params.get('subjectId') || 0);
  if (Number.isFinite(subjectId) && subjectId > 0) {
    return { type: 'subject', id: Math.floor(subjectId) };
  }

  const mount = String(params.get('mount') || '').trim();
  const match = mount.match(/^subject:(\d+)$/i);
  if (match) {
    return { type: 'subject', id: Number(match[1]) };
  }

  return null;
}

function normalizeRuntimeBackTo(value: string) {
  const normalized = value.trim();
  if (!normalized.startsWith('/') || normalized.startsWith('//')) return '';
  return normalized;
}

const RUNTIME_COMMENTS_LOAD_LIMIT = 20;

const shellClass = css`
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  background: #fff;
  @supports (height: 100dvh) {
    height: 100dvh;
    min-height: 100dvh;
  }
`;

const headerClass = css`
  position: relative;
  border-bottom: 1px solid var(--ui-border);
  background: #fff;
  padding: 1.1rem 1.3rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: calc(env(safe-area-inset-top, 0px) + 0.8rem) 0.95rem 0.75rem;
    gap: 0.3rem;
  }
`;

const headerTopRowClass = css`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  min-width: 0;
  flex-wrap: wrap;
`;

const headerButtonGroupClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
  flex-wrap: wrap;
`;

const headerEnergySlotClass = css`
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(36rem, 38vw);
  min-width: 18rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  @media (max-width: 900px) {
    position: static;
    width: min(100%, 36rem);
    min-width: 0;
    margin: 0.1rem auto 0.2rem;
    transform: none;
  }
`;

const runtimeEnergyCardClass = css`
  width: 100%;
`;

const runtimeCreatorUsernameTextStyle: React.CSSProperties = {
  color: 'inherit',
  fontSize: 'inherit',
  fontWeight: 800
};

const titleRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  flex: 1;
  color: var(--chat-text);
`;

const titleClass = css`
  margin: 0;
  font-size: 1.55rem;
  font-weight: 900;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.1rem;
  }
`;

const metaClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  color: var(--chat-text);
  opacity: 0.72;
  flex-wrap: wrap;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.1rem;
    gap: 0.35rem;
  }
`;

const metaCreatorClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
`;

const metaDescriptionClass = css`
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

const backButtonClass = css`
  border: 1px solid var(--ui-border);
  background: rgba(65, 140, 235, 0.08);
  color: var(--chat-text);
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
  &:hover {
    background: rgba(65, 140, 235, 0.14);
    border-color: rgba(65, 140, 235, 0.24);
    transform: translateY(-1px);
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.48rem 0.72rem;
    font-size: 1.1rem;
    max-width: 46vw;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const contributionCtaRowClass = css`
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: min(42rem, 42vw);
  margin-left: auto;

  @media (max-width: 1100px) {
    max-width: 100%;
    margin-left: auto;
  }

  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
    justify-content: flex-start;
    margin-left: 0;
  }
`;

const titleSectionClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-width: 0;
  flex-wrap: wrap;
`;

const titleTextStackClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
  flex: 1 1 18rem;
`;

const commentsCtaSlotClass = css`
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  align-self: center;

  @media (max-width: ${mobileMaxWidth}) {
    align-self: flex-start;
  }
`;

const runtimeActionButtonClass = css`
  border: 1px solid rgba(34, 197, 94, 0.36);
  background: rgba(34, 197, 94, 0.12);
  color: #166534;
  border-radius: 8px;
  padding: 0.58rem 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
  &:hover:not(:disabled) {
    background: rgba(34, 197, 94, 0.18);
    border-color: rgba(34, 197, 94, 0.5);
    transform: translateY(-1px);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const runtimeActionBlueClass = css`
  ${runtimeActionButtonClass};
  border-color: rgba(65, 140, 235, 0.34);
  background: rgba(65, 140, 235, 0.12);
  color: #1d4ed8;

  &:hover:not(:disabled) {
    background: rgba(65, 140, 235, 0.18);
    border-color: rgba(65, 140, 235, 0.5);
  }
`;

const runtimeActionPinkClass = css`
  ${runtimeActionButtonClass};
  border-color: rgba(236, 72, 153, 0.34);
  background: rgba(236, 72, 153, 0.12);
  color: #be185d;

  &:hover:not(:disabled) {
    background: rgba(236, 72, 153, 0.18);
    border-color: rgba(236, 72, 153, 0.5);
  }
`;

const runtimeActionPurpleClass = css`
  ${runtimeActionButtonClass};
  border-color: rgba(147, 51, 234, 0.34);
  background: rgba(147, 51, 234, 0.12);
  color: #6b21a8;

  &:hover:not(:disabled) {
    background: rgba(147, 51, 234, 0.18);
    border-color: rgba(147, 51, 234, 0.5);
  }
`;

const contributionErrorClass = css`
  color: #be123c;
  font-weight: 800;
  font-size: 1.1rem;
`;

const panelWrapClass = css`
  min-height: 0;
  overflow: hidden;
  padding: 0;
`;

const runtimeBodyClass = css`
  --runtime-comments-drawer-width: clamp(24rem, 31vw, 31rem);
  --runtime-comments-drawer-height: 42vh;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 0rem;
  grid-template-rows: minmax(0, 1fr);
  overflow: hidden;
  transition: grid-template-columns 0.24s cubic-bezier(0.22, 1, 0.36, 1);

  &[data-comments-open='true'] {
    grid-template-columns: minmax(0, 1fr) var(--runtime-comments-drawer-width);
  }

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) 0rem;
    transition: grid-template-rows 0.24s cubic-bezier(0.22, 1, 0.36, 1);

    &[data-comments-open='true'] {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr) var(--runtime-comments-drawer-height);
    }
  }
`;

const previewShellClass = css`
  height: 100%;
  min-height: 0;
  display: grid;
  overflow: hidden;
  background: #fff;
`;

interface BuildRuntimeProps {
  buildIdOverride?: number | null;
  locationOverride?: Location;
  onRuntimeBuildLoaded?: (build: RuntimeBuild) => void;
  runtimeIsActive?: boolean;
}

export default function BuildRuntime({
  buildIdOverride = null,
  locationOverride,
  onRuntimeBuildLoaded,
  runtimeIsActive = true
}: BuildRuntimeProps = {}) {
  const { buildId: routeBuildId } = useParams();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const buildId =
    typeof buildIdOverride === 'number' && buildIdOverride > 0
      ? String(buildIdOverride)
      : routeBuildId;
  const location = locationOverride || routeLocation;
  const loadRuntimeBuild = useAppContext(
    (v) => v.requestHelpers.loadRuntimeBuild
  );
  const publishBuild = useAppContext((v) => v.requestHelpers.publishBuild);
  const forkBuild = useAppContext((v) => v.requestHelpers.forkBuild);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const loadMyBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.loadMyBuildCollaborationRequest
  );
  const createBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.createBuildCollaborationRequest
  );
  const cancelBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.cancelBuildCollaborationRequest
  );
  const acceptBuildContributorInvite = useAppContext(
    (v) => v.requestHelpers.acceptBuildContributorInvite
  );
  const declineBuildContributorInvite = useAppContext(
    (v) => v.requestHelpers.declineBuildContributorInvite
  );
  const updateBuildContributionInviteStatus =
    useContributionInviteStatusUpdater();
  const updateBuildCollaborationDirectMessage =
    useCollaborationDirectMessageUpdater();
  const getAiEnergyPolicy = useAppContext(
    (v) => v.requestHelpers.getAiEnergyPolicy
  );
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const onDeleteComment = useContentContext((v) => v.actions.onDeleteComment);
  const onEditComment = useContentContext((v) => v.actions.onEditComment);
  const onEditRewardComment = useContentContext(
    (v) => v.actions.onEditRewardComment
  );
  const onLikeComment = useContentContext((v) => v.actions.onLikeComment);
  const onLoadComments = useContentContext((v) => v.actions.onLoadComments);
  const onLoadMoreComments = useContentContext(
    (v) => v.actions.onLoadMoreComments
  );
  const onLoadMoreReplies = useContentContext(
    (v) => v.actions.onLoadMoreReplies
  );
  const onLoadRepliesOfReply = useContentContext(
    (v) => v.actions.onLoadRepliesOfReply
  );
  const onUploadComment = useContentContext((v) => v.actions.onUploadComment);
  const onUploadReply = useContentContext((v) => v.actions.onUploadReply);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const userId = useKeyContext((v) => v.myState.userId);
  const communityFunds = useKeyContext((v) => v.myState.communityFunds);
  const communityFundsLoaded = useKeyContext(
    (v) => v.myState.communityFundsLoaded
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [build, setBuild] = useState<RuntimeBuild | null>(null);
  const [publishingRuntimeUpdate, setPublishingRuntimeUpdate] = useState(false);
  const [publishRuntimeUpdateError, setPublishRuntimeUpdateError] =
    useState('');
  const [forkingBuild, setForkingBuild] = useState(false);
  const [openingCollaborationRequest, setOpeningCollaborationRequest] =
    useState(false);
  const [collaborationRequestModalShown, setCollaborationRequestModalShown] =
    useState(false);
  const [collaborationRequestMessage, setCollaborationRequestMessage] =
    useState('');
  const [collaborationRequest, setCollaborationRequest] =
    useState<BuildCollaborationRequest | null>(null);
  const [collaborationRequestLoading, setCollaborationRequestLoading] =
    useState(false);
  const [collaborationRequestError, setCollaborationRequestError] =
    useState('');
  const [contributionForkError, setContributionForkError] = useState('');
  const [runtimeFavoriteError, setRuntimeFavoriteError] = useState('');
  const [runtimeHostVisible, setRuntimeHostVisible] = useState(true);
  const [commentsDrawerShown, setCommentsDrawerShown] = useState(false);
  const [runtimeCommentsLoading, setRuntimeCommentsLoading] = useState(false);
  const [runtimeCommentsError, setRuntimeCommentsError] = useState('');
  const [aiUsagePolicyLoadAttempted, setAiUsagePolicyLoadAttempted] =
    useState(false);
  const getAiEnergyPolicyRef = useRef(getAiEnergyPolicy);
  const onUpdateTodayStatsRef = useRef(onUpdateTodayStats);
  const runtimeCommentsLoadTokenRef = useRef(0);
  const RuntimeCommentInputAreaRef = useRef<any>(null);
  const consumedHomeFeedActionIntentRef = useRef<string | null>(null);
  const aiUsagePolicy = todayStats?.aiUsagePolicy as AiUsagePolicy | null;
  const {
    comments: runtimeComments,
    commentsLoaded: runtimeCommentsLoaded,
    commentsLoadMoreButton: runtimeCommentsLoadMoreButton
  } = useContentState({
    contentType: 'build',
    contentId: build?.id || 0
  });
  const runtimeCommentsParent = useMemo<Content | null>(() => {
    if (!build?.id) return null;
    return {
      id: build.id,
      contentId: build.id,
      contentType: 'build',
      rootId: build.id,
      rootType: 'build',
      pinnedCommentId: Number(build.pinnedCommentId || 0) || undefined,
      title: build.title,
      description: build.description || '',
      uploader: {
        id: build.userId,
        username: build.username || '',
        profilePicUrl: build.profilePicUrl || ''
      }
    };
  }, [
    build?.description,
    build?.id,
    build?.pinnedCommentId,
    build?.profilePicUrl,
    build?.title,
    build?.userId,
    build?.username
  ]);

  const numericBuildId = useMemo(() => {
    const id = parseInt(buildId || '', 10);
    return Number.isNaN(id) ? null : id;
  }, [buildId]);
  const homeFeedActionIntent = useMemo(
    () =>
      numericBuildId
        ? getMatchingHomeFeedActionIntent({
            contentId: numericBuildId,
            contentType: 'build',
            state: location.state
          })
        : null,
    [location.state, numericBuildId]
  );
  const canUseHistoryBack =
    typeof window !== 'undefined' &&
    Number.isFinite(Number(window.history.state?.idx)) &&
    Number(window.history.state?.idx) > 0;
  const isEmbedded = useMemo(() => {
    return new URLSearchParams(location.search).get('embedded') === '1';
  }, [location.search]);
  const runtimeViewSource = useMemo(() => {
    const source = new URLSearchParams(location.search).get('viewSource');
    return source === BUILD_TRENDING_SHOWCASE_VIEW_SOURCE ? source : '';
  }, [location.search]);
  const runtimeMountContext = useMemo(
    () => parseRuntimeMountContext(location.search),
    [location.search]
  );
  const explicitBackTo =
    typeof location.state?.runtimeBackTo === 'string'
      ? normalizeRuntimeBackTo(location.state.runtimeBackTo)
      : '';
  const explicitBackLabel =
    typeof location.state?.runtimeBackLabel === 'string'
      ? location.state.runtimeBackLabel
      : '';
  const backTo = useMemo(() => {
    return explicitBackTo || '/';
  }, [explicitBackTo]);
  const backLabel = useMemo(() => {
    return explicitBackLabel
      ? explicitBackLabel
      : canUseHistoryBack
        ? 'Go back'
        : 'Back to Twinkle';
  }, [canUseHistoryBack, explicitBackLabel]);
  const showAiEnergy = !!userId && !!aiUsagePolicy;
  const energyPercent = Math.max(
    0,
    Math.min(100, Number(aiUsagePolicy?.energyPercent ?? 0))
  );
  const energySegments = Math.max(
    1,
    Number(aiUsagePolicy?.energySegments || 5)
  );
  const energyIsEmpty =
    !!aiUsagePolicy && Number(aiUsagePolicy.energyRemaining || 0) <= 0;
  const communityChargeAvailable = isCommunityFundRechargeAvailable({
    aiUsagePolicy,
    communityFunds,
    communityFundsKnown: communityFundsLoaded
  });
  const energyChargeAttentionKey = aiUsagePolicy
    ? [
        'runtime-app',
        aiUsagePolicy.dayIndex || 'unknown',
        energyIsEmpty ? 'empty' : 'available',
        communityChargeAvailable ? 'free' : 'paid',
        aiUsagePolicy.resetCost || 0
      ].join(':')
    : '';
  const buildAcceptsStandaloneForks =
    build?.collaborationMode === 'open_source';
  const isBuildOwner =
    !!build && !!userId && Number(build.userId) === Number(userId);
  const collaborationRequestActionLabel = 'Ask to join';
  const collaborationStatus =
    collaborationRequest?.status ||
    (build?.hasActiveContributionInvite ? 'accepted' : '');
  const showCollaborationButton = !!build && !isBuildOwner;
  const collaborationButtonLabel = !userId
    ? 'Ask to join'
    : collaborationStatus === 'pending'
      ? 'Request sent'
      : collaborationStatus === 'invited'
        ? 'Join team'
        : collaborationStatus === 'accepted'
          ? 'Work together'
          : collaborationRequestActionLabel;
  const showStandaloneForkButton =
    !!build && !isBuildOwner && buildAcceptsStandaloneForks;
  const showWorkspaceButton = !!build && isBuildOwner;
  const showRuntimePublishUpdateButton = Boolean(
    build?.isPublic &&
    isBuildOwner &&
    build.releaseStatus?.hasUnpublishedChanges
  );
  const showRuntimeFavoriteButton = Boolean(build?.id && build.isPublic);
  const showRuntimeActions =
    showWorkspaceButton ||
    showRuntimePublishUpdateButton ||
    showCollaborationButton ||
    showStandaloneForkButton ||
    showRuntimeFavoriteButton;
  const runtimeActionBusy =
    forkingBuild || openingCollaborationRequest || collaborationRequestLoading;
  const runtimeCommentsCount = Math.max(
    0,
    Number(build?.numComments ?? runtimeComments.length ?? 0)
  );
  const runtimeCommentsCountLabel =
    runtimeCommentsCount > 99 ? '99+' : String(runtimeCommentsCount);
  const runtimeCommentsButtonLabel = `${
    runtimeCommentsCount === 1 ? 'Comment' : 'Comments'
  } (${runtimeCommentsCountLabel})`;

  function applyRuntimeBuildPayload(data: any) {
    if (!data?.build) return false;
    const nextBuild = {
      ...data.build,
      capabilitySnapshot: data.capabilitySnapshot || null,
      projectFiles: Array.isArray(data.projectFiles) ? data.projectFiles : []
    };
    setBuild(nextBuild);
    onRuntimeBuildLoaded?.(nextBuild);
    return true;
  }

  function handleBack() {
    if (explicitBackTo) {
      navigate(explicitBackTo, { replace: true });
      return;
    }
    if (canUseHistoryBack) {
      navigate(-1);
      return;
    }
    navigate(backTo, { replace: true });
  }

  function handleGoToBuildMenu() {
    navigate('/build');
  }

  function handleGoToWorkspace() {
    if (!build?.id) return;
    navigate(`/build/${build.id}`);
  }

  function handleToggleCommentsDrawer() {
    const shouldOpen = !commentsDrawerShown;
    setCommentsDrawerShown(shouldOpen);
    if (shouldOpen && !runtimeCommentsLoaded) {
      void loadRuntimeComments();
    }
  }

  function handleConsumeHomeFeedActionIntent() {
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash
      },
      {
        replace: true,
        state: clearHomeFeedActionIntentState(location.state)
      }
    );
  }

  function scrollRuntimePageToTop() {
    const scrollingElement =
      document.scrollingElement || document.documentElement;
    if (scrollingElement) {
      scrollingElement.scrollTop = 0;
    }
    const appElement = document.getElementById('App');
    if (appElement) {
      appElement.scrollTop = 0;
    }
  }

  function handleRetryLoadComments() {
    void loadRuntimeComments(true);
  }

  function handleRuntimeCommentSubmit(data: any) {
    onUploadComment(data);
    adjustRuntimeCommentCount(getSubmittedCommentCountDelta(data));
  }

  function handleRuntimeReplySubmit(data: any) {
    onUploadReply(data);
    adjustRuntimeCommentCount(getSubmittedCommentCountDelta(data));
  }

  function handleRuntimeCommentDelete(commentId: number) {
    onDeleteComment(commentId);
    adjustRuntimeCommentCount(-1);
  }

  function adjustRuntimeCommentCount(delta: number) {
    if (!delta) return;
    setBuild((current) =>
      current
        ? {
            ...current,
            numComments: Math.max(0, Number(current.numComments || 0) + delta)
          }
        : current
    );
  }

  function getSubmittedCommentCountDelta(data: any) {
    return 1 + (Array.isArray(data?.replies) ? data.replies.length : 0);
  }

  async function loadRuntimeComments(force = false) {
    if (
      !build?.id ||
      runtimeCommentsLoading ||
      (!force && runtimeCommentsLoaded)
    ) {
      return;
    }
    const requestedBuildId = build.id;
    const requestToken = runtimeCommentsLoadTokenRef.current + 1;
    runtimeCommentsLoadTokenRef.current = requestToken;
    setRuntimeCommentsLoading(true);
    setRuntimeCommentsError('');
    try {
      const { comments, loadMoreButton } = await loadComments({
        contentType: 'build',
        contentId: requestedBuildId,
        limit: RUNTIME_COMMENTS_LOAD_LIMIT
      });
      if (runtimeCommentsLoadTokenRef.current !== requestToken) return;
      onLoadComments({
        comments,
        contentId: requestedBuildId,
        contentType: 'build',
        isPreview: false,
        loadMoreButton
      });
    } catch (error: any) {
      if (runtimeCommentsLoadTokenRef.current !== requestToken) return;
      console.error('Failed to load runtime comments:', error);
      setRuntimeCommentsError(
        error?.response?.data?.error ||
          error?.message ||
          'Unable to load comments.'
      );
    } finally {
      if (runtimeCommentsLoadTokenRef.current === requestToken) {
        setRuntimeCommentsLoading(false);
      }
    }
  }

  async function handleUpdatePublishedApp() {
    if (
      !build?.id ||
      publishingRuntimeUpdate ||
      !build.releaseStatus?.hasUnpublishedChanges
    ) {
      return;
    }
    const requestedBuildId = build.id;
    setPublishingRuntimeUpdate(true);
    setPublishRuntimeUpdateError('');
    try {
      const result = await publishBuild({ buildId: requestedBuildId });
      if (result?.success) {
        try {
          const runtimePayload = await loadRuntimeBuild(requestedBuildId, {
            fromWriter: true
          });
          if (applyRuntimeBuildPayload(runtimePayload)) return;
        } catch (reloadError) {
          console.error(
            'Published app updated but runtime refresh failed:',
            reloadError
          );
        }
        if (result?.build) {
          setBuild((current) =>
            current
              ? {
                  ...current,
                  ...result.build,
                  releaseStatus: result.build.releaseStatus || null
                }
              : current
          );
        }
        setPublishRuntimeUpdateError(
          'App updated, but this page could not refresh the preview.'
        );
        return;
      }
      setPublishRuntimeUpdateError('Unable to update app right now.');
    } catch (error: any) {
      console.error('Failed to update published app:', error);
      const releaseStatus = error?.response?.data?.releaseStatus;
      if (releaseStatus) {
        setBuild((current) =>
          current
            ? {
                ...current,
                releaseStatus
              }
            : current
        );
      }
      if (error?.response?.data?.code === 'build_release_up_to_date') {
        setPublishRuntimeUpdateError('');
        return;
      }
      setPublishRuntimeUpdateError(
        error?.response?.data?.error ||
          error?.message ||
          'Unable to update app right now.'
      );
    } finally {
      setPublishingRuntimeUpdate(false);
    }
  }

  function handleOpenCollaborationWorkspace() {
    if (!build?.id) return;
    navigate(`/build/${build.id}`, {
      state: {
        openVersionsPanel: true
      }
    });
  }

  async function handleCollaborateClick() {
    if (!build?.id || runtimeActionBusy) return;
    if (!userId) {
      onOpenSigninModal();
      return;
    }
    if (collaborationStatus === 'pending') return;
    if (collaborationStatus === 'accepted') {
      handleOpenCollaborationWorkspace();
      return;
    }
    if (collaborationStatus === 'invited') {
      await handleAcceptContributorInvite();
      return;
    }
    await handleOpenCollaborationRequestModal();
  }

  useEffect(() => {
    if (!build?.id || !userId || isBuildOwner) {
      setCollaborationRequest(null);
      return;
    }
    let canceled = false;
    loadMyBuildCollaborationRequest(build.id)
      .then((result: any) => {
        if (canceled) return;
        const nextRequest = result?.request || null;
        setCollaborationRequest(nextRequest);
        setCollaborationRequestMessage(String(nextRequest?.message || ''));
      })
      .catch(() => {
        if (!canceled) {
          setCollaborationRequest(null);
        }
      });
    return () => {
      canceled = true;
    };
    // loadMyBuildCollaborationRequest is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build?.id, isBuildOwner, userId]);

  useEffect(() => {
    if (runtimeIsActive) return;
    setCollaborationRequestModalShown(false);
    setCommentsDrawerShown(false);
  }, [runtimeIsActive]);

  async function handleCreateStandaloneFork() {
    if (!build || forkingBuild) return;
    if (!userId) {
      onOpenSigninModal();
      return;
    }
    setForkingBuild(true);
    setContributionForkError('');
    try {
      const result = await forkBuild(build.id);
      if (result?.build?.id) {
        navigate(`/build/${result.build.id}`);
      }
    } catch (error: any) {
      console.error('Failed to fork open source build:', error);
      setContributionForkError(
        error?.response?.data?.error || error?.message || 'Unable to fork Build'
      );
    } finally {
      setForkingBuild(false);
    }
  }

  async function handleOpenCollaborationRequestModal() {
    if (!build?.id || openingCollaborationRequest) return;
    setOpeningCollaborationRequest(true);
    setContributionForkError('');
    setCollaborationRequestError('');
    setCollaborationRequestModalShown(true);
    try {
      const result = await loadMyBuildCollaborationRequest(build.id);
      const nextRequest = result?.request || null;
      setCollaborationRequest(nextRequest);
      setCollaborationRequestMessage(String(nextRequest?.message || ''));
    } catch (error: any) {
      setCollaborationRequestError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to load join request'
      );
    } finally {
      setOpeningCollaborationRequest(false);
    }
  }

  async function handleSubmitCollaborationRequest() {
    if (!build?.id || collaborationRequestLoading) return;
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await createBuildCollaborationRequest({
        buildId: build.id,
        message: collaborationRequestMessage
      });
      updateBuildCollaborationDirectMessage({
        directMessage: result?.directMessage
      });
      if (result?.request) {
        setCollaborationRequest(result.request);
        setCollaborationRequestMessage(String(result.request.message || ''));
      }
    } catch (error: any) {
      setCollaborationRequestError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to send join request'
      );
    } finally {
      setCollaborationRequestLoading(false);
    }
  }

  async function handleCancelCollaborationRequest() {
    if (
      !build?.id ||
      !collaborationRequest?.id ||
      collaborationRequestLoading
    ) {
      return;
    }
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await cancelBuildCollaborationRequest({
        buildId: build.id,
        requestId: collaborationRequest.id
      });
      if (result?.success) {
        setCollaborationRequest(null);
        setCollaborationRequestMessage('');
      }
    } catch (error: any) {
      setCollaborationRequestError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to cancel join request'
      );
    } finally {
      setCollaborationRequestLoading(false);
    }
  }

  async function handleAcceptContributorInvite() {
    const inviteId = Number(collaborationRequest?.inviteId || 0);
    if (!build?.id || !inviteId || collaborationRequestLoading) return;
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await acceptBuildContributorInvite({
        buildId: build.id,
        inviteId
      });
      if (result?.success) {
        updateBuildContributionInviteStatus({
          invite: result.invite,
          inviteId,
          eventTimeMs: result.eventTimeMs,
          status: 'accepted'
        });
        setCollaborationRequest((current) =>
          current ? { ...current, status: 'accepted' } : current
        );
        setBuild((current) =>
          current ? { ...current, hasActiveContributionInvite: true } : current
        );
        handleOpenCollaborationWorkspace();
      }
    } catch (error: any) {
      setCollaborationRequestError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to accept contributor invite'
      );
    } finally {
      setCollaborationRequestLoading(false);
    }
  }

  async function handleDeclineContributorInvite() {
    const inviteId = Number(collaborationRequest?.inviteId || 0);
    if (!build?.id || !inviteId || collaborationRequestLoading) return;
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await declineBuildContributorInvite({
        buildId: build.id,
        inviteId
      });
      if (result?.success) {
        updateBuildContributionInviteStatus({
          invite: result.invite,
          inviteId,
          eventTimeMs: result.eventTimeMs,
          status: 'declined'
        });
        setCollaborationRequest(null);
        setCollaborationRequestMessage('');
      }
    } catch (error: any) {
      setCollaborationRequestError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to decline contributor invite'
      );
    } finally {
      setCollaborationRequestLoading(false);
    }
  }

  function applyRuntimeAiUsagePolicyUpdate(
    nextAiUsagePolicy?: Record<string, any> | null
  ) {
    if (!nextAiUsagePolicy || typeof nextAiUsagePolicy !== 'object') return;
    onUpdateTodayStatsRef.current({
      newStats: {
        aiUsagePolicy: nextAiUsagePolicy
      }
    });
  }

  function renderRuntimeUnavailable({
    title,
    text
  }: {
    title?: string;
    text: string;
  }) {
    return (
      <ErrorBoundary componentPath="Build/Runtime">
        <div
          className={shellClass}
          style={{ gridTemplateRows: isEmbedded ? '1fr' : undefined }}
        >
          {!isEmbedded && (
            <div className={headerClass}>
              <div className={headerTopRowClass}>
                <div className={headerButtonGroupClass}>
                  <button
                    type="button"
                    className={backButtonClass}
                    onClick={handleBack}
                  >
                    <Icon icon="arrow-left" />
                    <span>{backLabel}</span>
                  </button>
                  <button
                    type="button"
                    className={backButtonClass}
                    onClick={handleGoToBuildMenu}
                    title="Go to build main menu"
                  >
                    <Icon icon="rocket-launch" />
                    <span>Build Menu</span>
                  </button>
                </div>
              </div>
              <div className={titleRowClass}>
                <Icon icon="laptop-code" />
                <h1 className={titleClass}>Build App</h1>
              </div>
            </div>
          )}
          <div className={panelWrapClass}>
            <InvalidPage
              title={title}
              text={text}
              style={{ paddingTop: isEmbedded ? '6rem' : '12rem' }}
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  useEffect(() => {
    getAiEnergyPolicyRef.current = getAiEnergyPolicy;
    onUpdateTodayStatsRef.current = onUpdateTodayStats;
  });

  useEffect(() => {
    if (userId) return;
    setAiUsagePolicyLoadAttempted(false);
  }, [userId]);

  useEffect(() => {
    if (!userId || aiUsagePolicy || aiUsagePolicyLoadAttempted) return;
    let cancelled = false;
    setAiUsagePolicyLoadAttempted(true);

    async function loadAiEnergyPolicy() {
      try {
        const result = await getAiEnergyPolicyRef.current();
        if (!cancelled && result?.aiUsagePolicy) {
          onUpdateTodayStatsRef.current({
            newStats: {
              aiUsagePolicy: result.aiUsagePolicy
            }
          });
        }
      } catch {
        // AI Energy is non-critical chrome on public app pages.
      }
    }

    void loadAiEnergyPolicy();
    return () => {
      cancelled = true;
    };
  }, [userId, aiUsagePolicy, aiUsagePolicyLoadAttempted]);

  useEffect(() => {
    if (!numericBuildId) return;
    void handleLoad();

    async function handleLoad() {
      setLoading(true);
      setError('');
      try {
        const data = await loadRuntimeBuild(numericBuildId, {
          viewSource: runtimeViewSource
        });
        if (!applyRuntimeBuildPayload(data)) {
          setError('Build not found');
        }
      } catch (error: any) {
        console.error('Failed to load runtime build:', error);
        setError(error?.message || 'Failed to load app');
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericBuildId, runtimeViewSource, userId]);

  useEffect(() => {
    if (!isEmbedded) return;

    function handleMessage(event: MessageEvent) {
      if (event.source !== window.parent) return;
      const data = event.data;
      if (
        !data ||
        data.source !== 'twinkle-content-panel' ||
        data.type !== 'runtime-visibility:update'
      ) {
        return;
      }
      setRuntimeHostVisible(data.payload?.visible !== false);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEmbedded]);

  useEffect(() => {
    runtimeCommentsLoadTokenRef.current += 1;
    setCommentsDrawerShown(false);
    setRuntimeCommentsLoading(false);
    setRuntimeCommentsError('');
  }, [build?.id]);

  useEffect(() => {
    if (!runtimeIsActive) return;
    const intent = homeFeedActionIntent;
    if (!intent || intent.action !== 'comment') return;
    if (consumedHomeFeedActionIntentRef.current === intent.nonce) return;
    if (loading || error || !build?.id) return;
    if (Number(build.id) !== Number(numericBuildId)) return;

    consumedHomeFeedActionIntentRef.current = intent.nonce;
    setCommentsDrawerShown(true);
    scrollRuntimePageToTop();
    focusHomeFeedCommentIntentTarget(RuntimeCommentInputAreaRef, {
      documentScroll: false
    });
    if (!runtimeCommentsLoaded) {
      void loadRuntimeComments();
    }
    handleConsumeHomeFeedActionIntent();
    // loadRuntimeComments/handleConsumeHomeFeedActionIntent use stable route/context state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    build?.id,
    error,
    homeFeedActionIntent?.action,
    homeFeedActionIntent?.nonce,
    loading,
    numericBuildId,
    runtimeIsActive,
    runtimeCommentsLoaded
  ]);

  useEffect(() => {
    if (!commentsDrawerShown) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setCommentsDrawerShown(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commentsDrawerShown]);

  if (!numericBuildId) {
    return renderRuntimeUnavailable({
      text: 'Invalid build ID'
    });
  }

  if (loading) {
    return <Loading />;
  }

  if (!build || error) {
    return renderRuntimeUnavailable({
      text: error || 'Build not found'
    });
  }

  return (
    <ErrorBoundary componentPath="Build/Runtime">
      <div
        className={shellClass}
        style={{ gridTemplateRows: isEmbedded ? '1fr' : undefined }}
      >
        {!isEmbedded && (
          <div className={headerClass}>
            <div className={headerTopRowClass}>
              <div className={headerButtonGroupClass}>
                <button
                  type="button"
                  className={backButtonClass}
                  onClick={handleBack}
                >
                  <Icon icon="arrow-left" />
                  <span>{backLabel}</span>
                </button>
                <button
                  type="button"
                  className={backButtonClass}
                  onClick={handleGoToBuildMenu}
                  title="Go to build main menu"
                >
                  <Icon icon="rocket-launch" />
                  <span>Build Menu</span>
                </button>
              </div>
              {showRuntimeActions ? (
                <div className={contributionCtaRowClass}>
                  {showWorkspaceButton ? (
                    <button
                      type="button"
                      className={runtimeActionBlueClass}
                      onClick={handleGoToWorkspace}
                    >
                      <Icon icon="wrench" />
                      <span>Build</span>
                    </button>
                  ) : null}
                  {showRuntimeFavoriteButton ? (
                    <FavoriteButton
                      buildId={Number(build.id)}
                      favorited={Boolean(build.isFavorited)}
                      label={build.isFavorited ? 'Favorited' : 'Favorite'}
                      size="pill"
                      onChange={({ buildId, favoritedAt, isFavorited }) => {
                        setBuild((current) =>
                          current && Number(current.id) === buildId
                            ? {
                                ...current,
                                favoritedAt,
                                isFavorited
                              }
                            : current
                        );
                      }}
                      onError={(error: any) =>
                        setRuntimeFavoriteError(
                          error?.response?.data?.error ||
                            error?.message ||
                            'Favorite could not be updated.'
                        )
                      }
                      onStart={() => setRuntimeFavoriteError('')}
                    />
                  ) : null}
                  {showRuntimePublishUpdateButton ? (
                    <button
                      type="button"
                      className={runtimeActionButtonClass}
                      onClick={handleUpdatePublishedApp}
                      disabled={publishingRuntimeUpdate}
                      title="Update published app"
                    >
                      <Icon
                        icon={
                          publishingRuntimeUpdate
                            ? 'spinner'
                            : 'cloud-upload-alt'
                        }
                        pulse={publishingRuntimeUpdate}
                      />
                      <span>
                        {publishingRuntimeUpdate ? 'Updating...' : 'Update App'}
                      </span>
                    </button>
                  ) : null}
                  {showCollaborationButton ? (
                    <button
                      type="button"
                      className={
                        collaborationStatus === 'accepted' ||
                        collaborationStatus === 'invited'
                          ? runtimeActionButtonClass
                          : runtimeActionPinkClass
                      }
                      onClick={handleCollaborateClick}
                      disabled={
                        runtimeActionBusy || collaborationStatus === 'pending'
                      }
                    >
                      <Icon
                        icon={
                          runtimeActionBusy
                            ? 'spinner'
                            : collaborationStatus === 'pending'
                              ? 'clock'
                              : collaborationStatus === 'accepted'
                                ? 'users'
                                : 'user-plus'
                        }
                        pulse={runtimeActionBusy}
                      />
                      <span>{collaborationButtonLabel}</span>
                    </button>
                  ) : null}
                  {showStandaloneForkButton ? (
                    <button
                      type="button"
                      className={runtimeActionPurpleClass}
                      onClick={handleCreateStandaloneFork}
                      disabled={runtimeActionBusy}
                    >
                      <Icon
                        icon={forkingBuild ? 'spinner' : 'code-branch'}
                        pulse={forkingBuild}
                      />
                      <span>
                        {forkingBuild ? 'Forking...' : userId ? 'Fork' : 'Fork'}
                      </span>
                    </button>
                  ) : null}
                  {contributionForkError ? (
                    <span className={contributionErrorClass}>
                      {contributionForkError}
                    </span>
                  ) : null}
                  {publishRuntimeUpdateError ? (
                    <span className={contributionErrorClass}>
                      {publishRuntimeUpdateError}
                    </span>
                  ) : null}
                  {runtimeFavoriteError ? (
                    <span className={contributionErrorClass}>
                      {runtimeFavoriteError}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            {showAiEnergy && (
              <div className={headerEnergySlotClass}>
                <AiEnergyCard
                  variant="inline"
                  className={runtimeEnergyCardClass}
                  energyPercent={energyPercent}
                  energySegments={energySegments}
                  portaledUiActive={runtimeIsActive}
                  overflowed={aiUsagePolicy.lastUsageOverflowed}
                  resetNeeded={energyIsEmpty}
                  resetCost={aiUsagePolicy.resetCost || 0}
                  resetPurchaseNumber={
                    typeof aiUsagePolicy.resetPurchasesToday === 'number'
                      ? aiUsagePolicy.resetPurchasesToday + 1
                      : undefined
                  }
                  communityFundsEligible={communityChargeAvailable}
                  chargeCtaAttentionKey={energyChargeAttentionKey}
                />
              </div>
            )}
            <div className={titleSectionClass}>
              <div className={titleTextStackClass}>
                <div className={titleRowClass}>
                  <Icon icon="laptop-code" />
                  <h1 className={titleClass}>{build.title}</h1>
                </div>
                <div className={metaClass}>
                  <div className={metaCreatorClass}>
                    <span>by</span>
                    <UsernameText
                      color="inherit"
                      textStyle={runtimeCreatorUsernameTextStyle}
                      user={{
                        id: build.userId,
                        username: build.username || '',
                        profilePicUrl: build.profilePicUrl || ''
                      }}
                    />
                  </div>
                  <span>
                    <Icon icon="eye" /> {formatVisitLabel(build.viewCount)}
                  </span>
                  {build.description?.trim() ? (
                    <span className={metaDescriptionClass}>
                      {build.description.trim()}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className={commentsCtaSlotClass}>
                <GameCTAButton
                  onClick={handleToggleCommentsDrawer}
                  variant="neutral"
                  size="sm"
                  icon="comments"
                  toggled={commentsDrawerShown}
                >
                  {runtimeCommentsButtonLabel}
                </GameCTAButton>
              </div>
            </div>
            {collaborationRequestModalShown ? (
              <CollaborationRequestModal
                buildId={build.id}
                error={collaborationRequestError}
                loading={collaborationRequestLoading}
                message={collaborationRequestMessage}
                request={collaborationRequest}
                onAcceptInvite={handleAcceptContributorInvite}
                onCancelRequest={handleCancelCollaborationRequest}
                onClose={() => setCollaborationRequestModalShown(false)}
                onDeclineInvite={handleDeclineContributorInvite}
                onMessageChange={setCollaborationRequestMessage}
                onOpenWorkspace={handleOpenCollaborationWorkspace}
                onSubmitRequest={handleSubmitCollaborationRequest}
              />
            ) : null}
          </div>
        )}
        <div
          className={runtimeBodyClass}
          data-comments-open={commentsDrawerShown ? 'true' : 'false'}
        >
          <div className={panelWrapClass}>
            <div className={previewShellClass}>
              <PreviewPanel
                build={build}
                code={build.code}
                projectFiles={build.projectFiles || []}
                isOwner={false}
                runtimeOnly
                runtimeHostVisible={runtimeHostVisible}
                mountContext={runtimeMountContext}
                capabilitySnapshot={build.capabilitySnapshot || null}
                onAiUsagePolicyUpdate={applyRuntimeAiUsagePolicyUpdate}
                onReplaceCode={() => {}}
                onApplyRestoredProjectFiles={() => {}}
                onSaveProjectFiles={async () => ({ success: false })}
              />
            </div>
          </div>
          <CommentsDrawer
            active={runtimeIsActive}
            comments={runtimeComments}
            error={runtimeCommentsError}
            loaded={runtimeCommentsLoaded}
            loading={runtimeCommentsLoading}
            loadMoreButton={runtimeCommentsLoadMoreButton}
            parent={runtimeCommentsParent}
            inputAreaInnerRef={RuntimeCommentInputAreaRef}
            userId={userId}
            visible={commentsDrawerShown}
            onCommentSubmit={handleRuntimeCommentSubmit}
            onDelete={handleRuntimeCommentDelete}
            onEditDone={onEditComment}
            onLikeClick={onLikeComment}
            onLoadMoreComments={onLoadMoreComments}
            onLoadMoreReplies={onLoadMoreReplies}
            onLoadRepliesOfReply={onLoadRepliesOfReply}
            onReplySubmit={handleRuntimeReplySubmit}
            onRetry={handleRetryLoadComments}
            onRewardCommentEdit={onEditRewardComment}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
