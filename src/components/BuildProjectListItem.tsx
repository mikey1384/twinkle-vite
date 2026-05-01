import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import Textarea from '~/components/Texts/Textarea';
import { css } from '@emotion/css';
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
  position: relative;
  align-self: stretch;
  min-width: 0;
  min-height: 12rem;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border: 1px solid rgba(20, 35, 60, 0.14);
  border-radius: calc(${borderRadius} - 2px);
  background:
    linear-gradient(135deg, rgba(65, 140, 235, 0.12), rgba(41, 171, 135, 0.14)),
    #111827;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 700px) {
    align-self: start;
    min-height: 0;
  }
`;

const buildPreviewToolbarClass = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.38rem;
  height: 1.9rem;
  padding: 0 0.75rem;
  background: rgba(255, 255, 255, 0.88);

  span {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: rgba(50, 65, 90, 0.42);
  }
`;

const buildPreviewFallbackClass = css`
  height: 100%;
  min-height: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 2.4rem 1rem 1rem;
  color: rgba(255, 255, 255, 0.88);
  text-align: center;

  svg {
    font-size: 2.4rem;
  }

  span {
    font-size: 1.05rem;
    font-weight: 800;
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
  collaboratorCount?: number;
  thumbnailUrl?: string | null;
  pendingCollaborationRequestCount?: number;
  latestPendingCollaborationRequestAt?: number | null;
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
  onAddDescription,
  onDelete
}: {
  build: BuildProjectListItemData;
  to?: string;
  navigationState?: Record<string, any>;
  isOwner?: boolean;
  themeName?: string;
  primaryActionLabel?: string;
  primaryActionIcon?: string;
  showCollaborationRequestAction?: boolean;
  onAddDescription?: (build: BuildProjectListItemData) => void;
  onDelete?: (build: BuildProjectListItemData) => void;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
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
  const createBuildContributionFork = useAppContext(
    (v) => v.requestHelpers.createBuildContributionFork
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
    Boolean(userId) &&
    !isOwner &&
    !isCurrentUserOwner &&
    Boolean(build.id);
  const listCollaborationActionLabel = 'Offer Collaboration';
  const listCollaborationActionIcon = 'user-plus';
  const pendingRequestCount = Number(
    build.pendingCollaborationRequestCount || 0
  );
  const collaboratorCount = Math.max(
    0,
    Math.floor(Number(build.collaboratorCount) || 0)
  );
  const previewLabel = primaryActionLabel || (isOwner ? 'Build' : 'Open app');
  const previewIcon =
    primaryActionIcon || (isOwner ? 'wrench' : 'external-link-alt');
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
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
  const thumbnailShown = Boolean(thumbnailUrl) && !thumbnailFailed;

  useEffect(() => {
    setThumbnailFailed(false);
  }, [thumbnailUrl]);

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
            {buildForkUiEnabled && !!build.sourceBuildId && (
              <span
                className={buildTagClass}
                style={toTagStyle({
                  background: 'rgba(147, 51, 234, 0.14)',
                  border: 'rgba(147, 51, 234, 0.36)',
                  color: '#6b21a8'
                })}
              >
                <Icon icon="code-branch" /> Fork
              </span>
            )}
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
        <div
          className={buildPreviewClass}
          aria-label={`${displayTitle} preview`}
        >
          <div className={buildPreviewToolbarClass} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          {thumbnailShown ? (
            <img
              src={thumbnailUrl}
              alt={`${displayTitle} screenshot`}
              onError={() => setThumbnailFailed(true)}
            />
          ) : (
            <div className={buildPreviewFallbackClass}>
              <Icon icon="laptop-code" />
              <span>Preview not captured</span>
            </div>
          )}
          <div className={buildPreviewActionsClass}>
            {showListCollaborationAction ? (
              <button
                type="button"
                className={buildPreviewCollabButtonClass}
                disabled={Boolean(actionLoading)}
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
        </div>
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
    void handleOpenCollaborationRequestModal();
  }

  async function handleOpenCollaborationRequestModal() {
    if (!build.id || actionLoading) return;
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
        await startContributionFromAcceptedInvite();
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

  async function handleContribute() {
    if (!build.id || actionLoading) return;
    setActionLoading('contribute');
    setActionError('');
    try {
      const result = await createBuildContributionFork(build.id);
      if (result?.success && result?.build?.id) {
        navigate(`/build/${result.build.id}`, {
          state: {
            openPeoplePanel: true
          }
        });
      }
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to start contribution'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function startContributionFromAcceptedInvite() {
    try {
      const result = await createBuildContributionFork(build.id);
      if (result?.success && result?.build?.id) {
        navigate(`/build/${result.build.id}`, {
          state: {
            openPeoplePanel: true
          }
        });
        return;
      }
      setCollaborationRequest((current) =>
        current ? { ...current, status: 'accepted' } : current
      );
    } catch (error: any) {
      setCollaborationRequest((current) =>
        current ? { ...current, status: 'accepted' } : current
      );
      setCollaborationRequestError(
        error?.response?.data?.error ||
          error?.message ||
          'Invite accepted, but failed to start contribution'
      );
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
                onClick={handleContribute}
              >
                Start Contributing
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
              Your request is pending.
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
              Your request was accepted. You can start a project-scoped
              contribution fork.
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
