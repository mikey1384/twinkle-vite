import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FavoriteButton from '~/containers/Build/shared/components/FavoriteButton';
import { ForkHistoryTrigger } from '~/containers/Build/shared/components/ForkHistoryModal';
import CollaborationRequestModal from '~/containers/Build/shared/components/CollaborationRequestModal';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import { User } from '~/types';
import {
  type BuildRelationshipLabel,
  getBuildDisplayTitle,
  getBuildRelationshipLabels
} from '~/containers/Build/shared/domain/buildRelationshipLabels';
import { formatVisitLabel } from '~/containers/Build/shared/components/ProjectListItem/domain';
import { useCollaborationDirectMessageUpdater } from '~/containers/Build/shared/hooks/useCollaborationDirectMessageUpdater';
import { useContributionInviteStatusUpdater } from '~/containers/Build/shared/hooks/useContributionInviteStatusUpdater';

type BuildCollaborationMode = 'private' | 'open_source';

interface BuildCollaborationRequest {
  id: number;
  inviteId?: number;
  status: 'pending' | 'invited' | 'accepted' | 'rejected' | 'canceled';
  message?: string;
  ownerHidden?: number;
}

export default function BuildDetails({
  buildId,
  buildUserId,
  collaboratorCount,
  collaborationMode,
  description,
  forkCount,
  isFavorited,
  isPublic,
  sourceBuildId,
  contributionStatus,
  rootBuildSourceBuildId,
  title,
  uploader,
  viewCount
}: {
  buildId: number;
  buildUserId?: number | null;
  collaboratorCount?: number;
  collaborationMode?: BuildCollaborationMode | 'contribution' | null;
  description: string;
  favoritedAt?: number | null;
  forkCount?: number;
  isFavorited?: boolean;
  isPublic?: number | boolean | null;
  sourceBuildId?: number | null;
  contributionStatus?: string | null;
  rootBuildSourceBuildId?: number | null;
  title: string;
  uploader: User;
  viewCount?: number;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const forkBuild = useAppContext((v) => v.requestHelpers.forkBuild);
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
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');
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
  const normalizedCollaboratorCount = Math.max(
    0,
    Math.floor(Number(collaboratorCount) || 0)
  );
  const normalizedForkCount = Math.max(0, Math.floor(Number(forkCount) || 0));
  const buildRelationship = {
    title,
    sourceBuildId,
    contributionStatus,
    rootBuildSourceBuildId
  };
  const displayTitle = getBuildDisplayTitle(buildRelationship);
  const relationshipLabels = getBuildRelationshipLabels(buildRelationship);
  const ownerId = Number(buildUserId || uploader?.id || 0);
  const isOwner = Boolean(userId && ownerId && Number(userId) === ownerId);
  const normalizedCollaborationMode =
    normalizeCollaborationMode(collaborationMode);
  const buildIsPublic = isPublic === true || Number(isPublic || 0) === 1;
  const favorited = Boolean(isFavorited);
  const showOpenSourceBadge = normalizedCollaborationMode === 'open_source';
  const showForkCountBadge = showOpenSourceBadge;
  const showForkAction =
    !isOwner && buildIsPublic && normalizedCollaborationMode === 'open_source';
  const showCollaborationRequestAction = !isOwner && Boolean(buildId);
  const showBuildWorkspaceAction = isOwner && Boolean(buildId);
  const showFavoriteAction = buildIsPublic && Boolean(buildId);
  const collaborationStatus = collaborationRequest?.status || '';
  const collaborationRequestActionLabel = !userId
    ? 'Ask to join'
    : collaborationStatus === 'pending'
      ? 'Request sent'
      : collaborationStatus === 'invited'
        ? 'Join team'
        : collaborationStatus === 'accepted'
          ? 'Work together'
          : 'Ask to join';
  const collaborationRequestActionIcon =
    collaborationStatus === 'pending'
      ? 'clock'
      : collaborationStatus === 'accepted'
        ? 'users'
        : 'user-plus';

  useEffect(() => {
    if (!showCollaborationRequestAction || !buildId || !userId) {
      setCollaborationRequest(null);
      return;
    }
    let canceled = false;
    loadMyBuildCollaborationRequest(buildId)
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
  }, [buildId, showCollaborationRequestAction, userId]);

  return (
    <div className="build-details">
      {collaborationRequestModalShown
        ? renderCollaborationRequestModal()
        : null}
      <div className="title">
        <div className="build-badge">
          <Icon icon="rocket" />
          <span>Lumine App</span>
        </div>
        <p>{displayTitle || 'Lumine App'}</p>
        {uploader.username && <small>Published by {uploader.username}</small>}
      </div>
      <div className="build-status-row">
        {relationshipLabels.map((label) =>
          label === 'fork' ? (
            <ForkHistoryTrigger
              key={label}
              buildId={buildId}
              className="build-collaborator-badge build-fork-badge"
            >
              <Icon icon="code-branch" />
              <span>Fork</span>
            </ForkHistoryTrigger>
          ) : (
            <div
              key={label}
              className="build-collaborator-badge"
              style={{
                borderColor: getRelationshipBadgeBorder(label),
                background: getRelationshipBadgeBackground(label),
                color: getRelationshipBadgeColor(label)
              }}
            >
              <Icon icon="users" />
              <span>Branch</span>
            </div>
          )
        )}
        {showOpenSourceBadge ? (
          <div className="build-collaborator-badge build-open-source-badge">
            <Icon icon="code-branch" />
            <span>Open Source</span>
          </div>
        ) : null}
        {showForkCountBadge ? (
          <div className="build-collaborator-badge build-fork-count-badge">
            <Icon icon="code-branch" />
            <span>{formatForkCount(normalizedForkCount)}</span>
          </div>
        ) : null}
        <div className="build-collaborator-badge build-visit-count-badge">
          <Icon icon="eye" />
          <span>{formatVisitLabel(viewCount)}</span>
        </div>
        {normalizedCollaboratorCount > 0 ? (
          <div className="build-collaborator-badge">
            <Icon icon="users" />
            <span>{formatCollaboratorCount(normalizedCollaboratorCount)}</span>
          </div>
        ) : null}
      </div>
      {description && <div className="description">{description}</div>}
      {actionError ? (
        <div className="build-action-error">{actionError}</div>
      ) : null}
      <div className="build-action-row">
        {showForkAction ? (
          <button
            type="button"
            className="build-card-action fork"
            disabled={Boolean(actionLoading)}
            onClick={handleFork}
          >
            <Icon
              icon={actionLoading === 'fork' ? 'spinner' : 'code-branch'}
              {...(actionLoading === 'fork' ? { pulse: true } : {})}
            />
            <span>{actionLoading === 'fork' ? 'Forking...' : 'Fork'}</span>
          </button>
        ) : null}
        {showCollaborationRequestAction ? (
          <button
            type="button"
            className="build-card-action collaboration"
            disabled={
              Boolean(actionLoading) || collaborationStatus === 'pending'
            }
            onClick={handleCollaborationActionClick}
          >
            <Icon
              icon={
                actionLoading === 'collaborationRequest'
                  ? 'spinner'
                  : collaborationRequestActionIcon
              }
              {...(actionLoading === 'collaborationRequest'
                ? { pulse: true }
                : {})}
            />
            <span>{collaborationRequestActionLabel}</span>
          </button>
        ) : null}
        {showBuildWorkspaceAction ? (
          <button
            type="button"
            className="build-card-action workspace"
            disabled={Boolean(actionLoading)}
            onClick={handleOpenWorkspace}
          >
            <Icon icon="wrench" />
            <span>Build</span>
          </button>
        ) : null}
        <button
          type="button"
          className="build-card-action open-app"
          disabled={Boolean(actionLoading)}
          onClick={handleOpenApp}
        >
          <span>Open app</span>
          <Icon icon="external-link-alt" />
        </button>
        {showFavoriteAction ? (
          <FavoriteButton
            buildId={buildId}
            favorited={favorited}
            label={favorited ? 'Favorited' : 'Favorite'}
            size="pill"
            preventDefault
            stopPropagation
            onError={(error: any) =>
              setActionError(
                error?.response?.data?.error ||
                  error?.message ||
                  'Favorite could not be updated.'
              )
            }
            onStart={() => setActionError('')}
          />
        ) : null}
      </div>
    </div>
  );

  function handleOpenApp(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!buildId) return;
    navigate(`/app/${buildId}`);
  }

  function handleOpenWorkspace(event?: React.MouseEvent<HTMLButtonElement>) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!buildId) return;
    navigate(`/build/${buildId}`);
  }

  function handleOpenCollaborationWorkspace() {
    if (!buildId) return;
    navigate(`/build/${buildId}`, {
      state: {
        openVersionsPanel: true
      }
    });
  }

  function handleCollaborationActionClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();
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
      void handleAcceptContributorInvite();
      return;
    }
    void handleOpenCollaborationRequestModal();
  }

  async function handleOpenCollaborationRequestModal() {
    if (!buildId || actionLoading) return;
    if (!userId) {
      onOpenSigninModal();
      return;
    }
    setActionLoading('collaborationRequest');
    setActionError('');
    setCollaborationRequestError('');
    setCollaborationRequestModalShown(true);
    try {
      const result = await loadMyBuildCollaborationRequest(buildId);
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
      setActionLoading('');
    }
  }

  async function handleSubmitCollaborationRequest() {
    if (!buildId || collaborationRequestLoading) return;
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await createBuildCollaborationRequest({
        buildId,
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
    if (!buildId || !collaborationRequest?.id || collaborationRequestLoading) {
      return;
    }
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await cancelBuildCollaborationRequest({
        buildId,
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
    if (!buildId || !inviteId || collaborationRequestLoading) return;
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await acceptBuildContributorInvite({
        buildId,
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
    if (!buildId || !inviteId || collaborationRequestLoading) return;
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await declineBuildContributorInvite({
        buildId,
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

  async function handleFork(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!buildId || actionLoading) return;
    if (!userId) {
      onOpenSigninModal();
      return;
    }
    setActionLoading('fork');
    setActionError('');
    try {
      const result = await forkBuild(buildId);
      const forkedBuildId = Number(result?.build?.id || 0);
      if (!forkedBuildId) {
        throw new Error('Unable to fork Build');
      }
      navigate(`/build/${forkedBuildId}`);
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error || error?.message || 'Unable to fork Build'
      );
    } finally {
      setActionLoading('');
    }
  }

  function renderCollaborationRequestModal() {
    return (
      <CollaborationRequestModal
        buildId={buildId}
        error={collaborationRequestError}
        loading={collaborationRequestLoading}
        message={collaborationRequestMessage}
        modalKey={`BuildDetailsCollaborationRequestModal-${buildId}`}
        request={collaborationRequest}
        onAcceptInvite={handleAcceptContributorInvite}
        onCancelRequest={handleCancelCollaborationRequest}
        onClose={() => setCollaborationRequestModalShown(false)}
        onDeclineInvite={handleDeclineContributorInvite}
        onMessageChange={setCollaborationRequestMessage}
        onOpenWorkspace={handleOpenCollaborationWorkspace}
        onSubmitRequest={handleSubmitCollaborationRequest}
      />
    );
  }
}

function normalizeCollaborationMode(value: unknown): BuildCollaborationMode {
  return value === 'open_source' ? value : 'private';
}

function formatCollaboratorCount(count: number) {
  return count === 1
    ? '1 team member'
    : `${count.toLocaleString()} team members`;
}

function formatForkCount(count: number) {
  return count === 1 ? '1 fork' : `${count.toLocaleString()} forks`;
}

function getRelationshipBadgeBorder(label: BuildRelationshipLabel) {
  return label === 'fork'
    ? 'rgba(147, 51, 234, 0.3)'
    : 'rgba(59, 130, 246, 0.3)';
}

function getRelationshipBadgeBackground(label: BuildRelationshipLabel) {
  return label === 'fork'
    ? 'rgba(147, 51, 234, 0.12)'
    : 'rgba(59, 130, 246, 0.12)';
}

function getRelationshipBadgeColor(label: BuildRelationshipLabel) {
  return label === 'fork' ? '#6b21a8' : '#1d4ed8';
}
