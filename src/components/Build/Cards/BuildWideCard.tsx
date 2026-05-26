import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, cx } from '@emotion/css';
import EditBuildDetailsButton from '~/components/Build/EditBuildDetailsButton';
import FavoriteButton, { type BuildFavoriteChange } from '~/components/Build/FavoriteButton';
import PreviewFrame from '~/components/Build/PreviewFrame';
import Icon from '~/components/Icon';
import ViewCount from '~/components/ViewCount';
import CollaborationRequestModal from '~/components/Modals/BuildCollaborationRequestModal';
import { BuildForkersTrigger } from '~/components/Modals/BuildForkersModal';
import { BuildTeamMembersTrigger } from '~/components/Modals/BuildTeamMembersModal';
import UsernameText from '~/components/Texts/UsernameText';
import { useAppContext, useBuildContext, useKeyContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import {
  formatBuildCollaboratorCount,
  formatBuildForkCount,
  formatBuildReleaseStatusTitle,
  normalizeBuildCollaborationMode,
  normalizeBuildReleaseStatus
} from '~/helpers/buildProjectHelpers';
import {
  getBuildDisplayTitle,
  getBuildRelationshipLabels
} from '~/helpers/buildRelationshipHelpers';
import { getErrorMessage } from '~/helpers/errorMessageHelpers';
import { useCollaborationDirectMessageUpdater } from '~/helpers/hooks/useCollaborationDirectMessageUpdater';
import { useContributionInviteStatusUpdater } from '~/helpers/hooks/useContributionInviteStatusUpdater';
import { useThemedCardVars } from '~/theme/hooks/useThemedCardVars';
import { useEnsureBuildViewerCollaborationRequest } from '../hooks/useEnsureBuildViewerCollaborationRequest';
import { useBuildCardData } from './useBuildCardData';
import { formatRelativeTime } from '../ProjectListItem/helpers';
import type { BuildProjectListItemData } from '../ProjectListItem/types';

const inheritedUsernameTextStyle: React.CSSProperties = {
  color: 'inherit',
  fontSize: 'inherit',
  fontWeight: 'inherit'
};

const wideCardClass = css`
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(14rem, 22rem);
  gap: 1rem;
  align-items: stretch;
  padding: 1.25rem;
  border: 1px solid var(--ui-border, rgba(20, 35, 60, 0.16));
  border-left: 0.38rem solid var(--build-card-accent, #418ceb);
  border-radius: 8px;
  background: #fff;
  color: var(--chat-text, #1f2937);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.07);

  &.embedded {
    padding: 0;
    border: 0;
    border-left: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  &.clickable {
    cursor: pointer;
  }

  &.no-preview {
    grid-template-columns: minmax(0, 1fr);
  }

  &:focus-visible {
    outline: 2px solid var(--build-card-accent, #418ceb);
    outline-offset: 2px;
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: minmax(0, 1fr) minmax(8rem, 42%);
    grid-template-areas:
      "header preview"
      "badges preview"
      "meta meta"
      "actions actions";
    align-items: start;
    gap: 0.7rem 0.75rem;
    padding: 1rem;

    &.embedded {
      padding: 0;
    }

    &.has-error {
      grid-template-areas:
        "header preview"
        "badges preview"
        "meta meta"
        "error error"
        "actions actions";
    }

    &.no-preview {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "header"
        "badges"
        "meta"
        "actions";
    }

    &.no-preview.has-error {
      grid-template-areas:
        "header"
        "badges"
        "meta"
        "error"
        "actions";
    }
  }
`;

const cardMainClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.82rem;

  @media (max-width: ${mobileMaxWidth}) {
    display: contents;
  }
`;

const cardHeaderClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-area: header;
  }
`;

const appBadgeClass = css`
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 0.48rem;
  padding: 0.34rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(65, 140, 235, 0.3);
  background: rgba(65, 140, 235, 0.12);
  color: #1d4ed8;
  font-size: 1.05rem;
  font-weight: 900;
`;

const titleClass = css`
  margin: 0;
  min-width: 0;
  color: #050505;
  font-size: 2rem;
  font-weight: 900;
  line-height: 1.08;
  overflow-wrap: anywhere;

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.55rem;
  }
`;

const titleRowClass = css`
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

const bylineClass = css`
  min-width: 0;
  color: rgba(31, 41, 55, 0.58);
  font-size: 1.1rem;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const descriptionClass = css`
  margin: 0;
  color: rgba(31, 41, 55, 0.8);
  font-size: 1.1rem;
  line-height: 1.38;
  overflow-wrap: anywhere;
`;

const badgeRowClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem 0.55rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-area: badges;
  }
`;

const badgeClass = css`
  appearance: none;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  padding: 0.32rem 0.62rem;
  border: 1px solid rgba(100, 116, 139, 0.24);
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.1);
  color: #334155;
  font: inherit;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.1;
  white-space: nowrap;

  &.clickable {
    cursor: pointer;
  }
`;

const metaRowClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.85rem;
  color: rgba(31, 41, 55, 0.62);
  font-size: 1rem;
  font-weight: 800;

  @media (max-width: ${mobileMaxWidth}) {
    grid-area: meta;
  }
`;

const metaItemClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

const actionRowClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: auto;

  @media (max-width: ${mobileMaxWidth}) {
    grid-area: actions;
    margin-top: 0;
  }
`;

const actionButtonClass = css`
  appearance: none;
  height: 2.7rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0 0.88rem;
  border: 1px solid rgba(100, 116, 139, 0.22);
  border-radius: 8px;
  background: #fff;
  color: #334155;
  font-size: 1.05rem;
  font-weight: 950;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.64;
  }

  &.primary {
    background: #050505;
    border-color: #050505;
    color: #fff;
  }

  &.blue {
    background: rgba(65, 140, 235, 0.12);
    border-color: rgba(65, 140, 235, 0.32);
    color: #1d4ed8;
  }

  &.purple {
    background: rgba(147, 51, 234, 0.12);
    border-color: rgba(147, 51, 234, 0.32);
    color: #6b21a8;
  }

  &.pink {
    background: rgba(236, 72, 153, 0.12);
    border-color: rgba(236, 72, 153, 0.32);
    color: #be185d;
  }

  &.danger {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.28);
    color: #b91c1c;
  }
`;

const previewClass = css`
  width: 100%;
  min-height: 13rem;
  aspect-ratio: 16 / 10;

  @media (max-width: ${mobileMaxWidth}) {
    grid-area: preview;
    align-self: start;
    min-height: 0;
    aspect-ratio: 16 / 9;
  }
`;

const errorClass = css`
  color: #be123c;
  font-size: 1rem;
  font-weight: 800;

  @media (max-width: ${mobileMaxWidth}) {
    grid-area: error;
  }
`;

export default function BuildWideCard({
  build: buildInput,
  clickable = true,
  isOwner = false,
  navigationState,
  openAppNavigationState,
  primaryActionIcon,
  primaryActionLabel,
  showCollaborationRequestAction = true,
  showFavoriteAction = false,
  showForkBadge = true,
  showOpenAppAction,
  themeName,
  to,
  onAddDescription,
  onDelete,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onCardClick,
  onOpenForkHistory,
  embedded = false
}: {
  build: BuildProjectListItemData | Record<string, any>;
  clickable?: boolean;
  embedded?: boolean;
  isOwner?: boolean;
  navigationState?: Record<string, any>;
  openAppNavigationState?: Record<string, any>;
  primaryActionIcon?: string;
  primaryActionLabel?: string;
  showCollaborationRequestAction?: boolean;
  showFavoriteAction?: boolean;
  showForkBadge?: boolean;
  showOpenAppAction?: boolean;
  themeName?: string;
  to?: string;
  onAddDescription?: (build: BuildProjectListItemData) => void;
  onDelete?: (build: BuildProjectListItemData) => void;
  onFavoriteChange?: (
    build: BuildProjectListItemData,
    change: BuildFavoriteChange
  ) => void;
  onFavoriteError?: (
    build: BuildProjectListItemData,
    error: unknown,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onFavoriteStart?: (
    build: BuildProjectListItemData,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onCardClick?: () => void;
  onOpenForkHistory?: (buildId: number) => void;
}) {
  const navigate = useNavigate();
  const build = useBuildCardData(buildInput);
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
  const onPatchBuildSummary = useBuildContext(
    (v) => v.actions.onPatchBuildSummary
  );
  const onUpsertBuildSummary = useBuildContext(
    (v) => v.actions.onUpsertBuildSummary
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
  const [collaborationRequestLoading, setCollaborationRequestLoading] =
    useState(false);
  const [collaborationRequestError, setCollaborationRequestError] =
    useState('');
  const { accentColor: buildAccentColor } = useThemedCardVars({
    role: 'sectionPanel',
    themeName
  });
  const normalizedBuild = build as BuildProjectListItemData | null;
  const buildId = Number(build?.id || 0);
  const displayTitle = build ? getBuildDisplayTitle(build) : '';
  const targetPath = to || (buildId ? `/build/${buildId}` : '');
  const description = String(build?.description || '').trim();
  const isCurrentUserOwner = Boolean(
    userId && build?.userId && Number(userId) === Number(build.userId)
  );
  const ownerMode = isOwner || isCurrentUserOwner;
  const collaborationMode = normalizeBuildCollaborationMode(
    build?.collaborationMode
  );
  const buildIsPublic = Boolean(build?.isPublic);
  const collaboratorCount = Math.max(
    0,
    Math.floor(Number(build?.collaboratorCount) || 0)
  );
  const forkCount = Math.max(0, Math.floor(Number(build?.forkCount) || 0));
  const pendingRequestCount = Math.max(
    0,
    Math.floor(Number(build?.pendingCollaborationRequestCount) || 0)
  );
  const releaseStatus = normalizeBuildReleaseStatus(build?.releaseStatus);
  const relationshipLabels = build ? getBuildRelationshipLabels(build) : [];
  const collaborationRequest = build?.viewerCollaborationRequest || null;
  const collaborationStatus =
    collaborationRequest?.status ||
    (build?.hasActiveContributionInvite ? 'accepted' : '');
  const listCollaborationActionLabel = !userId
    ? 'Ask to join'
    : collaborationStatus === 'pending'
      ? 'Request sent'
      : collaborationStatus === 'invited'
        ? 'Join team'
        : collaborationStatus === 'accepted'
          ? 'Work together'
          : 'Ask to join';
  const listCollaborationActionIcon =
    collaborationStatus === 'pending'
      ? 'clock'
      : collaborationStatus === 'accepted'
        ? 'users'
        : 'user-plus';
  const showListCollaborationAction =
    showCollaborationRequestAction && !ownerMode && Boolean(buildId);
  const showStandaloneForkAction =
    collaborationMode === 'open_source' &&
    buildIsPublic &&
    !ownerMode &&
    Boolean(buildId);
  const showForkCountBadge =
    showForkBadge && collaborationMode === 'open_source';
  const showUnpublishedChangesBadge =
    ownerMode && buildIsPublic && Boolean(releaseStatus?.hasUnpublishedChanges);
  const favoriteActionShown =
    showFavoriteAction && buildIsPublic && Boolean(buildId);
  const separatePrimaryActionShown = ownerMode || Boolean(primaryActionLabel);
  const primaryActionTargetsApp =
    Boolean(primaryActionLabel) && isBuildAppTargetPath(targetPath, buildId);
  const openAppAccessAllowed = showOpenAppAction ?? (buildIsPublic || ownerMode);
  const openAppActionShown =
    Boolean(buildId) && openAppAccessAllowed && !primaryActionTargetsApp;
  const previewLabel = primaryActionLabel || (ownerMode ? 'Build' : 'Open app');
  const previewIcon =
    primaryActionIcon || (ownerMode ? 'wrench' : 'external-link-alt');
  const thumbnailUrl = String(build?.thumbnailUrl || '').trim();
  const hasPreview = Boolean(thumbnailUrl);

  useEffect(() => {
    setCollaborationRequestMessage(String(collaborationRequest?.message || ''));
  }, [collaborationRequest?.id, collaborationRequest?.message]);

  useEnsureBuildViewerCollaborationRequest({
    buildId,
    enabled: showListCollaborationAction,
    isOwner: ownerMode,
    loaded: Boolean(build?.viewerCollaborationRequestLoaded),
    loading: Boolean(build?.viewerCollaborationRequestLoading),
    viewerStateUserId: build?.viewerStateUserId,
    userId
  });

  const buildCardStyle = useMemo(
    () =>
      ({
        '--build-card-accent': buildAccentColor
      }) as React.CSSProperties,
    [buildAccentColor]
  );

  if (!build || !buildId || !normalizedBuild) return null;

  return (
    <>
      <article
        role={clickable ? 'link' : undefined}
        tabIndex={clickable ? 0 : undefined}
        className={cx(
          wideCardClass,
          embedded && 'embedded',
          clickable && 'clickable',
          !hasPreview && 'no-preview',
          actionError && 'has-error'
        )}
        style={buildCardStyle}
        onClick={clickable ? handleNavigate : undefined}
        onKeyDown={clickable ? handleKeyDown : undefined}
      >
        <div className={cardMainClass}>
          <div className={cardHeaderClass}>
            <div className={appBadgeClass}>
              <Icon icon="rocket" />
              <span>Lumine App</span>
            </div>
            <div className={titleRowClass}>
              <h3 className={titleClass}>{displayTitle || 'Lumine App'}</h3>
              {ownerMode && onAddDescription ? (
                <EditBuildDetailsButton onClick={handleAddDescriptionClick} />
              ) : null}
            </div>
            {build.username ? (
              <div className={bylineClass}>
                Published by{' '}
                <span onClick={stopEvent} onKeyDown={stopEvent}>
                  <UsernameText
                    color="inherit"
                    textStyle={inheritedUsernameTextStyle}
                    user={{
                      id: Number(build.userId || 0),
                      username: build.username,
                      profilePicUrl: build.profilePicUrl || ''
                    }}
                  />
                </span>
              </div>
            ) : null}
            {description ? <p className={descriptionClass}>{description}</p> : null}
          </div>
          <div className={badgeRowClass}>
            {ownerMode ? (
              <span className={badgeClass}>
                <Icon icon={buildIsPublic ? 'globe' : 'lock'} />
                {buildIsPublic ? 'Public' : 'Private'}
              </span>
            ) : null}
            {relationshipLabels.map((label) =>
              label === 'fork' ? (
                showForkBadge ? renderForkRelationshipBadge() : null
              ) : (
                <span key={label} className={badgeClass}>
                  <Icon icon="users" />
                  Branch
                </span>
              )
            )}
            {collaborationMode === 'open_source' ? (
              <span className={cx(badgeClass, css`color: #1d4ed8; background: rgba(59, 130, 246, 0.12); border-color: rgba(59, 130, 246, 0.32);`)}>
                <Icon icon="code-branch" />
                Open Source
              </span>
            ) : null}
            {showForkCountBadge ? renderForkCountBadge() : null}
            <ViewCount
              count={build.viewCount}
              unit="visits"
              className={badgeClass}
            />
            {collaboratorCount > 0 ? (
              <BuildTeamMembersTrigger
                buildId={buildId}
                className={cx(badgeClass, 'clickable', css`color: #15803d; background: rgba(34, 197, 94, 0.12); border-color: rgba(34, 197, 94, 0.32);`)}
              >
                <Icon icon="users" />
                {formatBuildCollaboratorCount(collaboratorCount)}
              </BuildTeamMembersTrigger>
            ) : null}
            {showUnpublishedChangesBadge ? (
              <span
                className={cx(badgeClass, css`color: #b45309; background: rgba(245, 158, 11, 0.14); border-color: rgba(245, 158, 11, 0.34);`)}
                title={formatBuildReleaseStatusTitle(releaseStatus)}
              >
                <Icon icon="cloud-upload-alt" />
                Unpublished changes
              </span>
            ) : null}
            {ownerMode && pendingRequestCount > 0 ? (
              <span className={cx(badgeClass, css`color: #be185d; background: rgba(236, 72, 153, 0.12); border-color: rgba(236, 72, 153, 0.32);`)}>
                <Icon icon="exclamation-circle" />
                {pendingRequestCount === 1
                  ? '1 request'
                  : `${pendingRequestCount} requests`}
              </span>
            ) : null}
          </div>
          <div className={metaRowClass}>
            {build.updatedAt ? (
              <span className={metaItemClass}>
                <Icon icon="clock-rotate-left" />
                Updated {formatRelativeTime(build.updatedAt)}
              </span>
            ) : null}
            {build.createdAt ? (
              <span className={metaItemClass}>
                <Icon icon="clock" />
                Created {formatRelativeTime(build.createdAt)}
              </span>
            ) : null}
            {build.publishedAt ? (
              <span className={metaItemClass}>
                <Icon icon="globe" />
                Published {formatRelativeTime(build.publishedAt)}
              </span>
            ) : null}
          </div>
          {actionError ? <div className={errorClass}>{actionError}</div> : null}
          <div className={actionRowClass}>
            {showStandaloneForkAction ? (
              <button
                type="button"
                className={cx(actionButtonClass, 'purple')}
                disabled={Boolean(actionLoading)}
                onClick={handleForkActionClick}
              >
                <Icon
                  icon={actionLoading === 'fork' ? 'spinner' : 'code-branch'}
                  {...(actionLoading === 'fork' ? { pulse: true } : {})}
                />
                <span>{actionLoading === 'fork' ? 'Forking...' : 'Fork'}</span>
              </button>
            ) : null}
            {showListCollaborationAction ? (
              <button
                type="button"
                className={cx(actionButtonClass, 'pink')}
                disabled={
                  Boolean(actionLoading) || collaborationStatus === 'pending'
                }
                onClick={handleListCollaborationActionClick}
              >
                <Icon
                  icon={
                    actionLoading === 'collaborationRequest'
                      ? 'spinner'
                      : listCollaborationActionIcon
                  }
                  {...(actionLoading === 'collaborationRequest'
                    ? { pulse: true }
                    : {})}
                />
                <span>{listCollaborationActionLabel}</span>
              </button>
            ) : null}
            {separatePrimaryActionShown ? (
              <button
                type="button"
                className={cx(actionButtonClass, ownerMode ? 'blue' : 'primary')}
                disabled={Boolean(actionLoading)}
                onClick={handlePrimaryActionClick}
              >
                <Icon icon={previewIcon} />
                <span>{previewLabel}</span>
              </button>
            ) : null}
            {openAppActionShown ? (
              <button
                type="button"
                className={cx(actionButtonClass, 'primary')}
                disabled={Boolean(actionLoading)}
                onClick={handleOpenAppClick}
              >
                <Icon icon="external-link-alt" />
                <span>Open app</span>
              </button>
            ) : null}
            {favoriteActionShown ? (
              <FavoriteButton
                buildId={buildId}
                favorited={Boolean(build.isFavorited)}
                label={build.isFavorited ? 'Favorited' : 'Favorite'}
                preventDefault
                size="pill"
                stopPropagation
                onChange={(change) => onFavoriteChange?.(normalizedBuild, change)}
                onError={handleFavoriteError}
                onStart={handleFavoriteStart}
              />
            ) : null}
            {ownerMode && onDelete ? (
              <button
                type="button"
                className={cx(actionButtonClass, 'danger')}
                onClick={handleDeleteClick}
              >
                <Icon icon="trash-alt" />
                Delete
              </button>
            ) : null}
          </div>
        </div>
        {hasPreview ? (
          <PreviewFrame
            className={previewClass}
            thumbnailUrl={thumbnailUrl}
            alt={`${displayTitle || 'Lumine App'} screenshot`}
            ariaLabel={`${displayTitle || 'Lumine App'} preview`}
          />
        ) : null}
      </article>
      {collaborationRequestModalShown ? renderCollaborationRequestModal() : null}
    </>
  );

  function handleNavigate() {
    if (onCardClick) {
      onCardClick();
      return;
    }
    if (!targetPath) return;
    navigate(
      targetPath,
      navigationState ? { state: navigationState } : undefined
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigate();
    }
  }

  function stopEvent(event: React.SyntheticEvent) {
    event.stopPropagation();
  }

  function stopButtonEvent(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleAddDescriptionClick(event: React.MouseEvent<HTMLButtonElement>) {
    stopButtonEvent(event);
    if (!normalizedBuild) return;
    onAddDescription?.(normalizedBuild);
  }

  function handleDeleteClick(event: React.MouseEvent<HTMLButtonElement>) {
    stopButtonEvent(event);
    if (!normalizedBuild) return;
    onDelete?.(normalizedBuild);
  }

  function handleForkHistoryClick(event: React.MouseEvent<HTMLButtonElement>) {
    stopButtonEvent(event);
    onOpenForkHistory?.(buildId);
  }

  function handleFavoriteStart(params: {
    buildId: number;
    requestedFavorited: boolean;
  }) {
    setActionError('');
    if (!normalizedBuild) return;
    onFavoriteStart?.(normalizedBuild, params);
  }

  function handleFavoriteError(
    error: unknown,
    params: { buildId: number; requestedFavorited: boolean }
  ) {
    if (normalizedBuild && onFavoriteError) {
      onFavoriteError(normalizedBuild, error, params);
      return;
    }
    setActionError(getErrorMessage(error, 'Favorite could not be updated.'));
  }

  function handlePrimaryActionClick(event: React.MouseEvent<HTMLButtonElement>) {
    stopButtonEvent(event);
    if (ownerMode && !primaryActionLabel) {
      navigate(`/build/${buildId}`);
      return;
    }
    if (primaryActionLabel) {
      handleNavigate();
      return;
    }
    navigate(`/app/${buildId}`);
  }

  function handleOpenAppClick(event: React.MouseEvent<HTMLButtonElement>) {
    stopButtonEvent(event);
    if (isBuildAppTargetPath(targetPath, buildId)) {
      handleNavigate();
      return;
    }
    navigate(
      `/app/${buildId}`,
      openAppNavigationState ? { state: openAppNavigationState } : undefined
    );
  }

  async function handleForkActionClick(event: React.MouseEvent<HTMLButtonElement>) {
    stopButtonEvent(event);
    if (actionLoading) return;
    if (!userId) {
      onOpenSigninModal();
      return;
    }
    setActionLoading('fork');
    setActionError('');
    try {
      const result = await forkBuild(buildId);
      if (result?.build) {
        onUpsertBuildSummary(result.build);
      }
      if (result?.sourceBuild) {
        onUpsertBuildSummary({
          ...result.sourceBuild,
          serverCountFields: ['forkCount']
        });
      }
      const forkedBuildId = Number(result?.build?.id || 0);
      if (!forkedBuildId) {
        throw new Error('Unable to fork Build');
      }
      navigate(`/build/${forkedBuildId}`);
    } catch (error: any) {
      setActionError(getErrorMessage(error, 'Unable to fork Build'));
    } finally {
      setActionLoading('');
    }
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

  function handleOpenCollaborationWorkspace() {
    navigate(`/build/${buildId}`, {
      state: {
        openVersionsPanel: true
      }
    });
  }

  async function handleOpenCollaborationRequestModal() {
    if (actionLoading) return;
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
      onPatchBuildSummary({
        buildId,
        patch: {
          viewerCollaborationRequest: result?.request || null,
          viewerCollaborationRequestLoaded: true,
          viewerCollaborationRequestLoading: false,
          viewerStateUserId: Number(userId)
        }
      });
    } catch (error: any) {
      setCollaborationRequestError(
        getErrorMessage(error, 'Failed to load join request')
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleSubmitCollaborationRequest() {
    if (collaborationRequestLoading) return;
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
      onPatchBuildSummary({
        buildId,
        patch: {
          viewerCollaborationRequest: result?.request || null,
          viewerCollaborationRequestLoaded: true,
          viewerCollaborationRequestLoading: false,
          viewerStateUserId: Number(userId)
        }
      });
    } catch (error: any) {
      setCollaborationRequestError(
        getErrorMessage(error, 'Failed to send join request')
      );
    } finally {
      setCollaborationRequestLoading(false);
    }
  }

  async function handleCancelCollaborationRequest() {
    if (!collaborationRequest?.id || collaborationRequestLoading) return;
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await cancelBuildCollaborationRequest({
        buildId,
        requestId: collaborationRequest.id
      });
      if (result?.success) {
        onPatchBuildSummary({
          buildId,
          patch: {
            viewerCollaborationRequest: null,
            viewerCollaborationRequestLoaded: true,
            viewerCollaborationRequestLoading: false,
            viewerStateUserId: Number(userId)
          }
        });
        setCollaborationRequestMessage('');
      }
    } catch (error: any) {
      setCollaborationRequestError(
        getErrorMessage(error, 'Failed to cancel join request')
      );
    } finally {
      setCollaborationRequestLoading(false);
    }
  }

  async function handleAcceptContributorInvite() {
    const inviteId = Number(collaborationRequest?.inviteId || 0);
    if (!inviteId || collaborationRequestLoading) return;
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
        onPatchBuildSummary({
          buildId,
          patch: {
            hasActiveContributionInvite: true,
            viewerCollaborationRequest: collaborationRequest
              ? { ...collaborationRequest, status: 'accepted' }
              : null,
            viewerCollaborationRequestLoaded: true,
            viewerCollaborationRequestLoading: false,
            viewerStateUserId: Number(userId)
          }
        });
        handleOpenCollaborationWorkspace();
      }
    } catch (error: any) {
      setCollaborationRequestError(
        getErrorMessage(error, 'Failed to accept contributor invite')
      );
    } finally {
      setCollaborationRequestLoading(false);
    }
  }

  async function handleDeclineContributorInvite() {
    const inviteId = Number(collaborationRequest?.inviteId || 0);
    if (!inviteId || collaborationRequestLoading) return;
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
        onPatchBuildSummary({
          buildId,
          patch: {
            viewerCollaborationRequest: null,
            viewerCollaborationRequestLoaded: true,
            viewerCollaborationRequestLoading: false,
            viewerStateUserId: Number(userId)
          }
        });
        setCollaborationRequestMessage('');
      }
    } catch (error: any) {
      setCollaborationRequestError(
        getErrorMessage(error, 'Failed to decline contributor invite')
      );
    } finally {
      setCollaborationRequestLoading(false);
    }
  }

  function renderForkRelationshipBadge() {
    const content = (
      <>
        <Icon icon="code-branch" />
        Forked
      </>
    );
    if (!onOpenForkHistory) {
      return (
        <span key="fork" className={badgeClass}>
          {content}
        </span>
      );
    }
    return (
      <button
        key="fork"
        type="button"
        className={cx(badgeClass, 'clickable')}
        title="View fork history"
        aria-label="View fork history"
        onClick={handleForkHistoryClick}
      >
        {content}
      </button>
    );
  }

  function renderForkCountBadge() {
    const content = (
      <>
        <Icon icon="code-branch" />
        {formatBuildForkCount(forkCount)}
      </>
    );
    if (forkCount <= 0) {
      return <span className={badgeClass}>{content}</span>;
    }
    return (
      <BuildForkersTrigger
        buildId={buildId}
        className={cx(badgeClass, 'clickable')}
        title="People who forked this app"
      >
        {content}
      </BuildForkersTrigger>
    );
  }

  function renderCollaborationRequestModal() {
    return (
      <CollaborationRequestModal
        buildId={buildId}
        error={collaborationRequestError}
        loading={collaborationRequestLoading}
        message={collaborationRequestMessage}
        modalKey={`BuildWideCardCollaborationRequestModal-${buildId}`}
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

function isBuildAppTargetPath(targetPath: string, buildId: number) {
  if (!targetPath || !buildId) return false;
  const pathname = targetPath.split(/[?#]/)[0];
  return pathname === `/app/${buildId}`;
}
