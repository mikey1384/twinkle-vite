import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import BuildPreviewFrame from '~/components/BuildPreviewFrame';
import Modal from '~/components/Modal';
import Textarea from '~/components/Texts/Textarea';
import { css, cx } from '@emotion/css';
import { borderRadius, Color } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useThemedCardVars } from '~/theme/useThemedCardVars';
import { getBuildDisplayTitle } from '~/containers/Build/BuildEditor/buildRelationshipLabels';
import { useAppContext, useKeyContext } from '~/contexts';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";
const buildForkUiEnabled = true;

const buildCardClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 34%);
  gap: 1.2rem;
  align-items: stretch;
  cursor: pointer;
  padding: 1.1rem;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-left: 4px solid #418ceb;
  border-radius: ${borderRadius};
  text-decoration: none;
  color: inherit;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    border-color: rgba(65, 140, 235, 0.28);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    text-decoration: none;
  }
  &:focus-visible,
  &:active {
    text-decoration: none;
  }
  @media (max-width: 700px) {
    grid-template-columns: minmax(0, 1fr) minmax(10.5rem, 38%);
    gap: 0.75rem;
    padding: 0.85rem;
  }
  @media (max-width: 430px) {
    grid-template-columns: minmax(0, 1fr) minmax(8.5rem, 36%);
    gap: 0.65rem;
    padding: 0.75rem;
  }
`;

const buildCardMainClass = css`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0.25rem 0.1rem 0.15rem 0.15rem;
`;

const buildCardHeaderClass = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;

  @media (max-width: 700px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const buildHeaderAsideClass = css`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;

  @media (max-width: 700px) {
    align-items: flex-start;
    gap: 0.45rem;
  }
`;

const buildTitleClass = css`
  margin: 0 0 0.45rem 0;
  color: var(--chat-text);
  font-size: 1.7rem;
  font-weight: 900;
  font-family: ${displayFontFamily};
  line-height: 1.15;
  overflow-wrap: anywhere;

  @media (max-width: 700px) {
    font-size: 1.25rem;
  }
`;

const buildDescriptionClass = css`
  margin: 0;
  color: var(--chat-text);
  opacity: 0.72;
  font-size: 1.35rem;
  line-height: 1.45;

  @media (max-width: 700px) {
    font-size: 1rem;
  }
`;

const buildBylineClass = css`
  margin: -0.15rem 0 0.45rem;
  color: var(--chat-text);
  opacity: 0.68;
  font-size: 1.05rem;
  font-weight: 700;

  @media (max-width: 700px) {
    font-size: 0.95rem;
  }
`;

const detailsButtonClass = css`
  border: 0;
  background: transparent;
  padding: 0;
  margin-top: 0.3rem;
  display: inline-flex;
  color: var(--chat-text);
  opacity: 0.7;
  font-size: 1.35rem;
  line-height: 1.45;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dashed;
  &:hover {
    opacity: 1;
  }

  @media (max-width: 700px) {
    font-size: 1rem;
  }
`;

const buildUpdatedClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.1rem;
  color: var(--chat-text);
  opacity: 0.65;
  white-space: nowrap;

  @media (max-width: 700px) {
    font-size: 0.9rem;
  }
`;

const buildDeleteButtonClass = css`
  border: 1px solid rgba(220, 38, 38, 0.18);
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  border-radius: 999px;
  padding: 0.52rem 0.9rem;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
  &:hover {
    background: rgba(220, 38, 38, 0.12);
    border-color: rgba(220, 38, 38, 0.28);
    transform: translateY(-1px);
  }
`;

const buildTagRowClass = css`
  margin-top: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

const buildPreviewActionsClass = css`
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
  max-width: calc(100% - 1.5rem);

  @media (max-width: 700px) {
    right: 0.5rem;
    bottom: 0.5rem;
    max-width: calc(100% - 1rem);
  }
`;

const buildActionErrorClass = css`
  margin-top: 0.7rem;
  color: #be123c;
  font-size: 0.95rem;
  font-weight: 800;
`;

const buildTagClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 1rem;
  padding: 0.42rem 0.78rem;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.02em;

  @media (max-width: 700px) {
    padding: 0.34rem 0.56rem;
    font-size: 0.86rem;
  }
`;

const clickableBuildTagClass = css`
  appearance: none;
  font-family: inherit;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    filter 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    filter: saturate(1.08);
  }

  &:focus-visible {
    outline: 2px solid rgba(147, 51, 234, 0.45);
    outline-offset: 2px;
  }
`;

const buildMetaRowClass = css`
  margin-top: auto;
  padding-top: 0.85rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const buildMetaItemClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 1.1rem;
  color: var(--chat-text);
  opacity: 0.72;

  @media (max-width: 700px) {
    font-size: 0.9rem;
  }
`;

const buildPreviewClass = css`
  align-self: stretch;
  min-height: 12rem;
  aspect-ratio: 16 / 10;
  border-radius: calc(${borderRadius} - 2px);

  @media (max-width: 700px) {
    align-self: start;
    min-height: 0;
  }
`;

const buildPreviewActionButtonClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    transform 0.16s ease,
    border-color 0.16s ease;

  &:hover {
    transform: translateY(-1px);
  }

  @media (max-width: 700px) {
    padding: 0.55rem 0.78rem;
    font-size: 1.05rem;
  }
  @media (max-width: 430px) {
    padding: 0.48rem 0.65rem;
    font-size: 0.95rem;
  }
`;

const buildPreviewAppButtonClass = css`
  ${buildPreviewActionButtonClass};
  background: rgba(15, 23, 42, 0.76);

  &:hover {
    background: rgba(15, 23, 42, 0.88);
  }
`;

const buildPreviewCollabButtonClass = css`
  ${buildPreviewActionButtonClass};
  background: rgba(190, 24, 93, 0.88);

  &:hover {
    background: rgba(190, 24, 93, 0.98);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    cursor: default;
    opacity: 0.65;
    transform: none;
  }
`;

interface BuildTone {
  background: string;
  border: string;
  color: string;
}

interface BuildProjectListItemReleaseStatus {
  state?: string;
  hasUnpublishedChanges?: boolean;
  diff?: {
    total?: number;
    added?: number;
    updated?: number;
    deleted?: number;
  } | null;
}

interface BuildCollaborationRequest {
  id: number;
  inviteId?: number;
  status: 'pending' | 'invited' | 'accepted' | 'rejected' | 'canceled';
  message?: string;
  ownerHidden?: number;
}

export interface BuildProjectListItemData {
  id: number;
  userId?: number;
  username?: string;
  profilePicUrl?: string | null;
  title: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: number;
  createdAt: number;
  hasCode?: boolean;
  viewCount?: number;
  publishedAt?: number | null;
  sourceBuildId?: number | null;
  collaborationMode?: 'private' | 'contribution' | 'open_source';
  contributionAccess?: 'anyone' | 'invite_only';
  contributionRootBuildId?: number | null;
  contributionBranchNumber?: number | null;
  contributionStatus?: string | null;
  rootBuildUsername?: string | null;
  rootBuildSourceBuildId?: number | null;
  rootBuildTitle?: string | null;
  collaboratorCount?: number;
  thumbnailUrl?: string | null;
  pendingCollaborationRequestCount?: number;
  latestPendingCollaborationRequestAt?: number | null;
  releaseStatus?: BuildProjectListItemReleaseStatus | null;
}

export default function BuildProjectListItem({
  build,
  to,
  navigationState,
  isOwner = false,
  themeName,
  primaryActionLabel,
  primaryActionIcon,
  showCollaborationRequestAction = true,
  showForkBadge = true,
  onAddDescription,
  onDelete,
  onOpenForkHistory
}: {
  build: BuildProjectListItemData;
  to?: string;
  navigationState?: Record<string, any>;
  isOwner?: boolean;
  themeName?: string;
  primaryActionLabel?: string;
  primaryActionIcon?: string;
  showCollaborationRequestAction?: boolean;
  showForkBadge?: boolean;
  onAddDescription?: (build: BuildProjectListItemData) => void;
  onDelete?: (build: BuildProjectListItemData) => void;
  onOpenForkHistory?: (buildId: number) => void;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
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
  const { accentColor: buildAccentColor } = useThemedCardVars({
    role: 'sectionPanel',
    themeName
  });
  const visibilityTone = getVisibilityTone(build.isPublic);
  const description = build.description?.trim() || '';
  const detailsActionLabel = isOwner ? 'Edit Details' : '';
  const targetPath = to || `/build/${build.id}`;
  const thumbnailUrl = String(build.thumbnailUrl || '').trim();
  const displayTitle = getBuildDisplayTitle(build);
  const collaborationMode = normalizeCollaborationMode(build.collaborationMode);
  const isCurrentUserOwner =
    Boolean(userId) && Number(userId) === Number(build.userId || 0);
  const showListCollaborationAction =
    showCollaborationRequestAction &&
    !isOwner &&
    !isCurrentUserOwner &&
    Boolean(build.id);
  const pendingRequestCount = Number(
    build.pendingCollaborationRequestCount || 0
  );
  const collaboratorCount = Math.max(
    0,
    Math.floor(Number(build.collaboratorCount) || 0)
  );
  const releaseStatus = normalizeReleaseStatus(build.releaseStatus);
  const showUnpublishedChangesBadge =
    isOwner &&
    build.isPublic &&
    Boolean(releaseStatus?.hasUnpublishedChanges);
  const previewLabel = primaryActionLabel || (isOwner ? 'Build' : 'Open app');
  const previewIcon =
    primaryActionIcon || (isOwner ? 'wrench' : 'external-link-alt');
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
  const collaborationStatus = collaborationRequest?.status || '';
  const listCollaborationActionLabel =
    !userId
      ? 'Collaborate'
      : collaborationStatus === 'pending'
        ? 'Pending Approval'
        : collaborationStatus === 'invited'
          ? 'Accept Invitation'
          : collaborationStatus === 'accepted'
            ? 'Collaborate'
            : 'Offer Collaboration';
  const listCollaborationActionIcon =
    collaborationStatus === 'pending'
      ? 'clock'
      : collaborationStatus === 'accepted'
        ? 'users'
        : 'user-plus';

  useEffect(() => {
    if (!showListCollaborationAction || !build.id || !userId) {
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
  }, [build.id, showListCollaborationAction, userId]);

  return (
    <>
      <div
        role="link"
        tabIndex={0}
        className={buildCardClass}
        style={{ borderLeftColor: buildAccentColor }}
        onClick={handleNavigate}
        onKeyDown={handleKeyDown}
      >
        <div className={buildCardMainClass}>
          <div className={buildCardHeaderClass}>
            <div>
              <h3 className={buildTitleClass}>{displayTitle}</h3>
              {!isOwner && build.username ? (
                <div className={buildBylineClass}>by {build.username}</div>
              ) : null}
              {(description || detailsActionLabel) &&
                (description ? (
                  <>
                    <p className={buildDescriptionClass}>{description}</p>
                    {isOwner && onAddDescription && (
                      <button
                        type="button"
                        className={detailsButtonClass}
                        onClick={handleAddDescriptionClick}
                      >
                        {detailsActionLabel}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className={detailsButtonClass}
                      onClick={handleAddDescriptionClick}
                  >
                    {detailsActionLabel}
                  </button>
                ))}
            </div>
            <div className={buildHeaderAsideClass}>
              <span className={buildUpdatedClass}>
                <Icon icon="clock" />
                Updated {formatRelativeTime(build.updatedAt)}
              </span>
              {isOwner && onDelete && (
                <button
                  type="button"
                  className={buildDeleteButtonClass}
                  onClick={handleDeleteClick}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          <div className={buildTagRowClass}>
            <span className={buildTagClass} style={toTagStyle(visibilityTone)}>
              {build.isPublic ? 'Public' : 'Private'}
            </span>
            {showUnpublishedChangesBadge ? (
              <span
                className={buildTagClass}
                style={toTagStyle({
                  background: 'rgba(245, 158, 11, 0.16)',
                  border: 'rgba(245, 158, 11, 0.38)',
                  color: '#b45309'
                })}
                title={formatReleaseStatusTitle(releaseStatus)}
              >
                <Icon icon="cloud-upload-alt" /> Unpublished changes
              </span>
            ) : null}
            {showForkBadge && buildForkUiEnabled && !!build.sourceBuildId
              ? renderForkBadge()
              : null}
            {collaborationMode === 'open_source' ? (
              <span
                className={buildTagClass}
                style={toTagStyle({
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: 'rgba(59, 130, 246, 0.32)',
                  color: '#1d4ed8'
                })}
              >
                <Icon icon="code-branch" /> Open Source
              </span>
            ) : null}
            {collaboratorCount > 0 ? (
              <span
                className={buildTagClass}
                style={toTagStyle({
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: 'rgba(34, 197, 94, 0.32)',
                  color: '#15803d'
                })}
              >
                <Icon icon="users" />{' '}
                {formatCollaboratorCount(collaboratorCount)}
              </span>
            ) : null}
            {pendingRequestCount > 0 ? (
              <span
                className={buildTagClass}
                style={toTagStyle({
                  background: 'rgba(236, 72, 153, 0.12)',
                  border: 'rgba(236, 72, 153, 0.32)',
                  color: '#be185d'
                })}
              >
                <Icon icon="exclamation-circle" />{' '}
                {pendingRequestCount === 1
                  ? '1 request'
                  : `${pendingRequestCount} requests`}
              </span>
            ) : null}
          </div>
          {actionError ? (
            <div className={buildActionErrorClass}>{actionError}</div>
          ) : null}
          <div className={buildMetaRowClass}>
            <span className={buildMetaItemClass}>
              <Icon icon="clock-rotate-left" />
              Created {formatRelativeTime(build.createdAt)}
            </span>
            <span className={buildMetaItemClass}>
              <Icon icon="eye" />
              {formatViewLabel(build.viewCount)}
            </span>
            {build.isPublic && build.publishedAt ? (
              <span className={buildMetaItemClass}>
                <Icon icon="globe" />
                Published {formatRelativeTime(build.publishedAt)}
              </span>
            ) : (
              <span className={buildMetaItemClass}>
                <Icon icon="lock" />
                Not published yet
              </span>
            )}
          </div>
        </div>
        <BuildPreviewFrame
          className={buildPreviewClass}
          thumbnailUrl={thumbnailUrl}
          alt={`${displayTitle} screenshot`}
          ariaLabel={`${displayTitle} preview`}
        >
          <div className={buildPreviewActionsClass}>
            {showListCollaborationAction ? (
              <button
                type="button"
                className={buildPreviewCollabButtonClass}
                disabled={
                  Boolean(actionLoading) || collaborationStatus === 'pending'
                }
                onClick={handleListCollaborationActionClick}
              >
                <Icon
                  icon={actionLoading ? 'spinner' : listCollaborationActionIcon}
                  {...(actionLoading ? { pulse: true } : {})}
                />
                <span>{listCollaborationActionLabel}</span>
              </button>
            ) : null}
            <button
              type="button"
              className={buildPreviewAppButtonClass}
              onClick={handlePreviewActionClick}
            >
              <Icon icon={previewIcon} />
              <span>{previewLabel}</span>
            </button>
          </div>
        </BuildPreviewFrame>
      </div>
      {collaborationRequestModalShown
        ? renderCollaborationRequestModal()
        : null}
    </>
  );

  function handleNavigate() {
    navigate(
      targetPath,
      navigationState ? { state: navigationState } : undefined
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigate();
    }
  }

  function handleAddDescriptionClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (onAddDescription) {
      onAddDescription(build);
      return;
    }
    navigate(
      targetPath,
      navigationState ? { state: navigationState } : undefined
    );
  }

  function handleDeleteClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onDelete?.(build);
  }

  function handleForkHistoryClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();
    onOpenForkHistory?.(Number(build.id));
  }

  function handlePreviewActionClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    handleNavigate();
  }

  function handleListCollaborationActionClick(
    event?: React.MouseEvent<HTMLButtonElement>
  ) {
    event?.preventDefault();
    event?.stopPropagation();
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

  function renderForkBadge() {
    const forkBadgeStyle = toTagStyle({
      background: 'rgba(147, 51, 234, 0.14)',
      border: 'rgba(147, 51, 234, 0.36)',
      color: '#6b21a8'
    });
    const badgeContent = (
      <>
        <Icon icon="code-branch" /> Fork
      </>
    );
    if (!onOpenForkHistory) {
      return (
        <span className={buildTagClass} style={forkBadgeStyle}>
          {badgeContent}
        </span>
      );
    }
    return (
      <button
        type="button"
        className={cx(buildTagClass, clickableBuildTagClass)}
        style={forkBadgeStyle}
        title="View fork history"
        aria-label="View fork history"
        onClick={handleForkHistoryClick}
      >
        {badgeContent}
      </button>
    );
  }

  function handleOpenCollaborationWorkspace() {
    if (!build.id) return;
    navigate(`/build/${build.id}`, {
      state: {
        openVersionsPanel: true
      }
    });
  }

  async function handleOpenCollaborationRequestModal() {
    if (!build.id || actionLoading) return;
    if (!userId) {
      onOpenSigninModal();
      return;
    }
    setActionLoading('collaborationRequest');
    setActionError('');
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
          'Failed to load collaboration request'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleSubmitCollaborationRequest() {
    if (!build.id || collaborationRequestLoading) return;
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await createBuildCollaborationRequest({
        buildId: build.id,
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
    if (!build.id || !collaborationRequest?.id || collaborationRequestLoading) {
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
          'Failed to cancel collaboration request'
      );
    } finally {
      setCollaborationRequestLoading(false);
    }
  }

  async function handleAcceptContributorInvite() {
    const inviteId = Number(collaborationRequest?.inviteId || 0);
    if (!build.id || !inviteId || collaborationRequestLoading) return;
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await acceptBuildContributorInvite({
        buildId: build.id,
        inviteId
      });
      if (result?.success) {
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
    if (!build.id || !inviteId || collaborationRequestLoading) return;
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await declineBuildContributorInvite({
        buildId: build.id,
        inviteId
      });
      if (result?.success) {
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

  function renderCollaborationRequestModal() {
    const pending = collaborationRequest?.status === 'pending';
    const accepted = collaborationRequest?.status === 'accepted';
    const invited = collaborationRequest?.status === 'invited';
    return (
      <Modal
        modalKey={`BuildListCollaborationRequestModal-${build.id}`}
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
            className={css`
              display: flex;
              justify-content: flex-end;
              gap: 0.65rem;
              flex-wrap: wrap;
            `}
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
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
            width: 100%;
          `}
        >
          {pending ? (
            <div
              className={css`
                color: ${Color.darkGray()};
                font-weight: 800;
                line-height: 1.4;
              `}
            >
              Your request has been sent. The owner can accept or decline it.
            </div>
          ) : invited ? (
            <div
              className={css`
                color: ${Color.logoBlue()};
                font-weight: 800;
                line-height: 1.4;
              `}
            >
              The owner invited you to collaborate on this Build.
            </div>
          ) : accepted ? (
            <div
              className={css`
                color: ${Color.logoBlue()};
                font-weight: 800;
                line-height: 1.4;
              `}
            >
              You&apos;re on the team. Open the workspace to start a branch.
            </div>
          ) : (
            <div
              className={css`
                color: ${Color.darkGray()};
                font-weight: 700;
                line-height: 1.45;
              `}
            >
              Ask the owner to invite you as a contributor.
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
              className={css`
                color: ${Color.darkGray(0.7)};
                font-size: 0.9rem;
                font-weight: 700;
              `}
            >
              This request is saved in the owner&apos;s hidden request list.
            </div>
          ) : null}
          {collaborationRequestError ? (
            <div
              className={css`
                color: #be123c;
                font-weight: 800;
              `}
            >
              {collaborationRequestError}
            </div>
          ) : null}
        </div>
      </Modal>
    );
  }
}

function formatRelativeTime(timestamp?: number | null) {
  if (!timestamp || Number.isNaN(Number(timestamp))) return 'just now';
  return timeSince(Number(timestamp));
}

function formatViewLabel(viewCount?: number | null) {
  const views = Number.isFinite(Number(viewCount)) ? Number(viewCount) : 0;
  if (views <= 0) return 'No views yet';
  if (views === 1) return '1 view';
  return `${views} views`;
}

function formatCollaboratorCount(count: number) {
  return count === 1
    ? '1 collaborator'
    : `${count.toLocaleString()} collaborators`;
}

function normalizeReleaseStatus(
  value?: BuildProjectListItemReleaseStatus | null
): BuildProjectListItemReleaseStatus | null {
  if (!value || typeof value !== 'object') return null;
  return {
    state: typeof value.state === 'string' ? value.state : '',
    hasUnpublishedChanges: Boolean(value.hasUnpublishedChanges),
    diff: value.diff || null
  };
}

function formatReleaseStatusTitle(
  releaseStatus: BuildProjectListItemReleaseStatus | null
) {
  const changedFiles = Math.max(
    0,
    Math.floor(Number(releaseStatus?.diff?.total) || 0)
  );
  if (changedFiles <= 0) {
    return 'This public app has unpublished workspace changes.';
  }
  return changedFiles === 1
    ? '1 file has not been released yet.'
    : `${changedFiles.toLocaleString()} files have not been released yet.`;
}

function getVisibilityTone(isPublic: boolean): BuildTone {
  if (isPublic) {
    return {
      background: 'rgba(65, 140, 235, 0.14)',
      border: 'rgba(65, 140, 235, 0.34)',
      color: '#1d4ed8'
    };
  }
  return {
    background: 'rgba(100, 116, 139, 0.14)',
    border: 'rgba(100, 116, 139, 0.3)',
    color: '#334155'
  };
}

function normalizeCollaborationMode(
  value?: string | null
): 'private' | 'open_source' {
  return value === 'open_source' ? value : 'private';
}

function toTagStyle(tone: BuildTone): React.CSSProperties {
  return {
    background: tone.background,
    borderColor: tone.border,
    color: tone.color
  };
}
