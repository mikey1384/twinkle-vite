import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import { BuildForkHistoryTrigger } from '~/components/BuildForkHistoryModal';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import Textarea from '~/components/Texts/Textarea';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { User } from '~/types';
import {
  type BuildRelationshipLabel,
  getBuildDisplayTitle,
  getBuildRelationshipLabels
} from '~/containers/Build/BuildEditor/buildRelationshipLabels';
import { useBuildContributionInviteStatusUpdater } from '~/helpers/hooks/useBuildContributionInviteStatusUpdater';

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
  isPublic,
  sourceBuildId,
  contributionStatus,
  rootBuildSourceBuildId,
  title,
  uploader
}: {
  buildId: number;
  buildUserId?: number | null;
  collaboratorCount?: number;
  collaborationMode?: BuildCollaborationMode | 'contribution' | null;
  description: string;
  forkCount?: number;
  isPublic?: number | boolean | null;
  sourceBuildId?: number | null;
  contributionStatus?: string | null;
  rootBuildSourceBuildId?: number | null;
  title: string;
  uploader: User;
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
    useBuildContributionInviteStatusUpdater();
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');
  const [
    collaborationRequestModalShown,
    setCollaborationRequestModalShown
  ] = useState(false);
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
  const normalizedForkCount = Math.max(
    0,
    Math.floor(Number(forkCount) || 0)
  );
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
  const showOpenSourceBadge = normalizedCollaborationMode === 'open_source';
  const showForkCountBadge = showOpenSourceBadge;
  const showForkAction =
    !isOwner && buildIsPublic && normalizedCollaborationMode === 'open_source';
  const showCollaborationRequestAction = !isOwner && Boolean(buildId);
  const showBuildWorkspaceAction = isOwner && Boolean(buildId);
  const collaborationStatus = collaborationRequest?.status || '';
  const collaborationRequestActionLabel =
    !userId
      ? 'Collaborate'
      : collaborationStatus === 'pending'
        ? 'Pending Approval'
        : collaborationStatus === 'invited'
          ? 'Accept Invitation'
          : collaborationStatus === 'accepted'
            ? 'Collaborate'
            : 'Offer Collaboration';
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
      {collaborationRequestModalShown ? renderCollaborationRequestModal() : null}
      <div className="title">
        <div className="build-badge">
          <Icon icon="rocket" />
          <span>Lumine App</span>
        </div>
        <p>{displayTitle || 'Lumine App'}</p>
        {uploader.username && (
          <small>Published by {uploader.username}</small>
        )}
      </div>
      <div className="build-status-row">
        {relationshipLabels.map((label) =>
          label === 'fork' ? (
            <BuildForkHistoryTrigger
              key={label}
              buildId={buildId}
              className="build-collaborator-badge build-fork-badge"
            >
              <Icon icon="code-branch" />
              <span>Fork</span>
            </BuildForkHistoryTrigger>
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
            disabled={Boolean(actionLoading) || collaborationStatus === 'pending'}
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
          className="build-card-action"
          disabled={Boolean(actionLoading)}
          onClick={handleOpenApp}
        >
          <span>Open app</span>
          <Icon icon="external-link-alt" />
        </button>
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
          'Failed to load collaboration request'
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
      if (result?.request) {
        setCollaborationRequest(result.request);
        setCollaborationRequestMessage(String(result.request.message || ''));
      }
    } catch (error: any) {
      setCollaborationRequestError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to send collaboration request'
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
          'Failed to cancel collaboration request'
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
        error?.response?.data?.error ||
          error?.message ||
          'Unable to fork Build'
      );
    } finally {
      setActionLoading('');
    }
  }

  function renderCollaborationRequestModal() {
    const pending = collaborationRequest?.status === 'pending';
    const accepted = collaborationRequest?.status === 'accepted';
    const invited = collaborationRequest?.status === 'invited';
    return (
      <Modal
        modalKey={`BuildDetailsCollaborationRequestModal-${buildId}`}
        isOpen
        onClose={
          collaborationRequestLoading
            ? () => {}
            : () => setCollaborationRequestModalShown(false)
        }
        closeOnBackdropClick={!collaborationRequestLoading}
        title="Offer Collaboration"
        size="sm"
        footer={
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.65rem',
              flexWrap: 'wrap'
            }}
          >
            <Button
              variant="ghost"
              disabled={collaborationRequestLoading}
              onClick={() => setCollaborationRequestModalShown(false)}
            >
              Close
            </Button>
            {pending ? (
              <Button
                color="darkerGray"
                variant="outline"
                loading={collaborationRequestLoading}
                disabled={collaborationRequestLoading}
                onClick={handleCancelCollaborationRequest}
              >
                Cancel Request
              </Button>
            ) : invited ? (
              <>
                <Button
                  color="darkerGray"
                  variant="outline"
                  loading={collaborationRequestLoading}
                  disabled={collaborationRequestLoading}
                  onClick={handleDeclineContributorInvite}
                >
                  Decline
                </Button>
                <Button
                  color="logoBlue"
                  loading={collaborationRequestLoading}
                  disabled={collaborationRequestLoading}
                  onClick={handleAcceptContributorInvite}
                >
                  Accept Invite
                </Button>
              </>
            ) : accepted ? (
              <Button
                color="logoBlue"
                loading={collaborationRequestLoading}
                disabled={collaborationRequestLoading}
                onClick={handleOpenCollaborationWorkspace}
              >
                Open Workspace
              </Button>
            ) : (
              <Button
                color="pink"
                loading={collaborationRequestLoading}
                disabled={collaborationRequestLoading}
                onClick={handleSubmitCollaborationRequest}
              >
                Send Request
              </Button>
            )}
          </div>
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.9rem',
            width: '100%'
          }}
        >
          {pending ? (
            <div
              style={{
                color: Color.darkGray(),
                fontWeight: 800,
                lineHeight: 1.4
              }}
            >
              Your request has been sent. The owner can accept or decline it.
            </div>
          ) : invited ? (
            <div
              style={{
                color: Color.logoBlue(),
                fontWeight: 800,
                lineHeight: 1.4
              }}
            >
              The owner invited you to collaborate on this Build.
            </div>
          ) : accepted ? (
            <div
              style={{
                color: Color.logoBlue(),
                fontWeight: 800,
                lineHeight: 1.4
              }}
            >
              You&apos;re on the team. Open the workspace to start a branch.
            </div>
          ) : (
            <div
              style={{
                color: Color.darkGray(),
                fontWeight: 700,
                lineHeight: 1.45
              }}
            >
              Ask the owner to invite you as a collaborator.
            </div>
          )}
          {!accepted && !invited ? (
            <Textarea
              value={collaborationRequestMessage}
              onChange={(event) =>
                setCollaborationRequestMessage(event.target.value)
              }
              disabled={pending || collaborationRequestLoading}
              maxLength={1000}
              minRows={4}
              maxRows={8}
              placeholder="Optional message"
            />
          ) : null}
          {collaborationRequest?.ownerHidden ? (
            <div
              style={{
                color: Color.darkGray(0.7),
                fontSize: '0.9rem',
                fontWeight: 700
              }}
            >
              This request is saved in the owner&apos;s hidden request list.
            </div>
          ) : null}
          {collaborationRequestError ? (
            <div
              style={{
                color: '#be123c',
                fontWeight: 800
              }}
            >
              {collaborationRequestError}
            </div>
          ) : null}
        </div>
      </Modal>
    );
  }
}

function normalizeCollaborationMode(
  value: unknown
): BuildCollaborationMode {
  return value === 'open_source' ? value : 'private';
}

function formatCollaboratorCount(count: number) {
  return count === 1
    ? '1 collaborator'
    : `${count.toLocaleString()} collaborators`;
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
