import React from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { BuildForkHistoryTrigger } from '~/components/BuildForkHistoryModal';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { DEFAULT_PROFILE_THEME } from '~/constants/defaultValues';
import ScopedTheme from '~/theme/ScopedTheme';
import {
  getBuildDisplayTitle,
  getBuildRelationshipLabels
} from './buildRelationshipLabels';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const headerClass = css`
  padding: 1.2rem 1.8rem;
  background: #fff;
  border-bottom: 1px solid var(--ui-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  @media (max-width: ${mobileMaxWidth}) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.9rem;
    padding: 1rem;
  }
`;

const badgeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--theme-bg) 12%, white);
  color: color-mix(in srgb, var(--theme-border) 82%, #24324a);
  border: 1px solid color-mix(in srgb, var(--theme-bg) 22%, white);
  font-weight: 900;
  font-size: 1.05rem;
  text-transform: none;
  letter-spacing: normal;
  font-family: ${displayFontFamily};
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;
  &:hover {
    transform: translateY(-1px);
    background: color-mix(in srgb, var(--theme-bg) 18%, white);
    text-decoration: none;
  }
  &:active {
    text-decoration: none;
  }
  &:focus-visible {
    outline: 2px solid var(--theme-border);
    outline-offset: 2px;
    text-decoration: none;
  }
`;

const headerTitleClass = css`
  margin: 0;
  font-size: 2rem;
  color: var(--chat-text);
  font-family: ${displayFontFamily};
  font-weight: 900;
  line-height: 1.15;
`;

const headerTitleRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  @media (max-width: ${mobileMaxWidth}) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
  }
`;

const headerTitleMainClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  min-width: 0;
`;

const headerTitleEditButtonClass = css`
  width: 2.15rem;
  height: 2.15rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: #fff;
  color: var(--chat-text);
  cursor: pointer;
  opacity: 0.78;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
  &:hover {
    opacity: 1;
    transform: translateY(-1px);
    border-color: var(--ui-border-strong);
    background: #f8faff;
  }
  &:focus-visible {
    outline: 2px solid var(--ui-border-strong);
    outline-offset: 2px;
  }
`;

const headerSubtitleClass = css`
  font-size: 1.05rem;
  color: var(--chat-text);
  opacity: 0.75;
`;

const headerInfoClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
  }
`;

const headerActionsClass = css`
  display: flex;
  gap: 0.55rem;
  align-items: center;
  flex-wrap: wrap;
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

const headerActionItemClass = css`
  display: contents;
  @media (max-width: ${mobileMaxWidth}) {
    display: inline-flex;
    order: var(--mobile-action-order, 10);
  }
`;

const badgePillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  padding: 0.58rem 0.9rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 900;
  font-family: ${displayFontFamily};
  border: 2px solid transparent;
  line-height: 1;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.12);
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.35rem;
    padding: 0.48rem 0.72rem;
    font-size: 0.78rem;
  }
`;

const mobileTitleBadgeGroupClass = css`
  display: none;
  @media (max-width: ${mobileMaxWidth}) {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.35rem;
    flex-wrap: wrap;
    min-width: max-content;
  }
`;

const mobileButtonRowsClass = css`
  display: none;
  @media (max-width: ${mobileMaxWidth}) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    width: 100%;
  }
`;

const mobileButtonRowClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  width: 100%;
`;

const titleRelationshipBadgeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.32rem 0.66rem;
  font-size: 0.82rem;
  font-weight: 900;
  font-family: ${displayFontFamily};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1;
  border: 2px solid transparent;
`;

interface HeaderProps {
  build: {
    id: number;
    title: string;
    description: string | null;
    username: string;
    isPublic: boolean;
    code: string | null;
    releaseStatus?: {
      state?: string;
      hasUnpublishedChanges?: boolean;
      diff?: {
        total?: number;
        added?: number;
        updated?: number;
        deleted?: number;
      };
    } | null;
    sourceBuildId?: number | null;
    collaborationMode?: 'private' | 'contribution' | 'open_source';
    contributionAccess?: 'anyone' | 'invite_only';
    contributionBranchNumber?: number | null;
    contributionContributorId?: number | null;
    contributionStatus?: string | null;
    rootBuildUsername?: string | null;
    rootBuildSourceBuildId?: number | null;
    rootBuildTitle?: string | null;
  };
  forking: boolean;
  canEditMetadata: boolean;
  canEditThumbnail: boolean;
  isOwner: boolean;
  profileTheme?: string | null;
  publishing: boolean;
  savingThumbnail: boolean;
  showContributionButton: boolean;
  contributionActionError?: string;
  contributionActionLoading?: 'merge' | '';
  canMergeBranch?: boolean;
  showForkButton: boolean;
  onContribute: () => void;
  onFork: () => void;
  onMergeBranch?: () => void;
  onOpenCollaborationSettings: () => void;
  onOpenDescriptionModal: () => void;
  onOpenThumbnailModal: () => void;
  onTogglePublish: () => void;
  onUnpublish?: () => void;
}

function HeaderActionItem({
  mobileOrder,
  children
}: {
  mobileOrder: number;
  children: React.ReactNode;
}) {
  return (
    <span
      className={headerActionItemClass}
      style={
        {
          '--mobile-action-order': mobileOrder
        } as React.CSSProperties
      }
    >
      {children}
    </span>
  );
}

export default function Header({
  build,
  forking,
  canEditMetadata,
  canEditThumbnail,
  isOwner,
  profileTheme,
  publishing,
  savingThumbnail,
  showContributionButton,
  contributionActionError = '',
  contributionActionLoading = '',
  canMergeBranch = false,
  showForkButton,
  onContribute,
  onFork,
  onMergeBranch,
  onOpenCollaborationSettings,
  onOpenDescriptionModal,
  onOpenThumbnailModal,
  onTogglePublish,
  onUnpublish
}: HeaderProps) {
  const isContributionFork =
    build.contributionStatus && build.contributionStatus !== 'none';
  const contributionStatus = normalizeContributionStatus(
    build.contributionStatus
  );
  const collaborationMode = normalizeCollaborationMode(build.collaborationMode);
  const displayTitle = getBuildDisplayTitle(build);
  const relationshipLabels = getBuildRelationshipLabels(build);
  const description = build.description?.trim();
  const projectOwnerUsername = String(
    isContributionFork && build.rootBuildUsername
      ? build.rootBuildUsername
      : build.username
  ).trim();
  const branchOwnerUsername = String(build.username || '').trim();
  const ownerLine = isContributionFork
    ? projectOwnerUsername &&
      branchOwnerUsername &&
      projectOwnerUsername !== branchOwnerUsername
      ? `Project by ${projectOwnerUsername} · Branch by ${branchOwnerUsername}`
      : `Project and branch by ${
          branchOwnerUsername || projectOwnerUsername || 'unknown'
        }`
    : `by ${projectOwnerUsername || 'unknown'}`;
  const showContributionStatusBadge =
    isContributionFork &&
    contributionStatus !== 'none' &&
    contributionStatus !== 'draft';
  const releaseStatus = normalizeReleaseStatus(build.releaseStatus);
  const publicAppIsUpToDate = Boolean(
    build.isPublic && releaseStatus && !releaseStatus.hasUnpublishedChanges
  );
  const publicAppNeedsUpdate = Boolean(build.isPublic && !publicAppIsUpToDate);
  const publishButtonDisabled =
    publishing ||
    (!build.isPublic && !build.code) ||
    Boolean(build.isPublic && publicAppIsUpToDate);
  return (
    <header className={headerClass}>
      <div className={headerInfoClass}>
        <ScopedTheme
          as="span"
          theme={(profileTheme || DEFAULT_PROFILE_THEME) as any}
        >
          <Link to="/build" className={badgeClass} title="Back to main menu">
            <Icon icon="arrow-left" />
            Back to Main Menu
          </Link>
        </ScopedTheme>
        <div className={headerTitleRowClass}>
          <div className={headerTitleMainClass}>
            <h2 className={headerTitleClass}>{displayTitle}</h2>
            {relationshipLabels.map((label) =>
              label === 'fork' ? (
                <BuildForkHistoryTrigger
                  key={label}
                  buildId={Number(build.id)}
                  className={titleRelationshipBadgeClass}
                  style={getRelationshipBadgeStyle(label)}
                >
                  <Icon icon="code-branch" />
                  Fork
                </BuildForkHistoryTrigger>
              ) : (
                <span
                  key={label}
                  className={titleRelationshipBadgeClass}
                  style={getRelationshipBadgeStyle(label)}
                >
                  <Icon icon="users" />
                  Branch
                </span>
              )
            )}
            {canEditMetadata ? (
              <button
                type="button"
                className={headerTitleEditButtonClass}
                onClick={onOpenDescriptionModal}
                aria-label="Edit build details"
                title="Edit build details"
              >
                <Icon icon="pencil-alt" />
              </button>
            ) : null}
          </div>
          <div className={mobileTitleBadgeGroupClass}>
            <span
              className={badgePillClass}
              style={getVisibilityBadgeStyle(build.isPublic)}
              title={
                build.isPublic
                  ? 'Published publicly'
                  : 'Only you can access this build'
              }
            >
              <Icon icon={build.isPublic ? 'globe' : 'lock'} />
              {build.isPublic ? 'Public' : 'Private'}
            </span>
            {build.isPublic && releaseStatus ? (
              <span
                className={badgePillClass}
                style={getReleaseStatusBadgeStyle(releaseStatus.state)}
                title={getReleaseStatusTitle(releaseStatus)}
              >
                <Icon
                  icon={
                    releaseStatus.hasUnpublishedChanges
                      ? 'cloud-upload-alt'
                      : 'check-circle'
                  }
                />
                {releaseStatus.hasUnpublishedChanges
                  ? 'Unpublished Changes'
                  : 'Live'}
              </span>
            ) : null}
            {showContributionStatusBadge ? (
              <span
                className={badgePillClass}
                style={getContributionBadgeStyle(contributionStatus)}
                title={
                  contributionStatus === 'merging'
                      ? 'This branch is being merged into the original Build'
                      : 'Branch status'
                }
              >
                <Icon icon="code-branch" />
                {formatContributionStatusLabel(contributionStatus)}
              </span>
            ) : null}
          </div>
        </div>
        <span className={headerSubtitleClass}>
          {description ? `${description} · ` : ''}
          {ownerLine}
        </span>
      </div>
      <div className={headerActionsClass}>
        <HeaderActionItem mobileOrder={1}>
          <span
            className={badgePillClass}
            style={getVisibilityBadgeStyle(build.isPublic)}
            title={
              build.isPublic
                ? 'Published publicly'
                : 'Only you can access this build'
            }
          >
            <Icon icon={build.isPublic ? 'globe' : 'lock'} />
            {build.isPublic ? 'Public' : 'Private'}
          </span>
        </HeaderActionItem>
        {build.isPublic && releaseStatus ? (
          <HeaderActionItem mobileOrder={2}>
            <span
              className={badgePillClass}
              style={getReleaseStatusBadgeStyle(releaseStatus.state)}
              title={getReleaseStatusTitle(releaseStatus)}
            >
              <Icon
                icon={
                  releaseStatus.hasUnpublishedChanges
                    ? 'cloud-upload-alt'
                    : 'check-circle'
                }
              />
              {releaseStatus.hasUnpublishedChanges
                ? 'Unpublished Changes'
                : 'Live'}
            </span>
          </HeaderActionItem>
        ) : null}
        {isOwner && !isContributionFork ? (
          <HeaderActionItem mobileOrder={3}>
            <GameCTAButton
              onClick={onOpenCollaborationSettings}
              variant={collaborationMode === 'private' ? 'pink' : 'logoBlue'}
              size="md"
              icon={collaborationMode === 'private' ? 'users' : 'code-branch'}
            >
              {getCollaborationButtonLabel(collaborationMode)}
            </GameCTAButton>
          </HeaderActionItem>
        ) : null}
        {canEditMetadata ? (
          <HeaderActionItem mobileOrder={5}>
            <GameCTAButton
              onClick={onOpenDescriptionModal}
              variant="neutral"
              size="md"
              icon="pencil-alt"
            >
              {build.description?.trim() ? 'Edit Details' : 'Add Details'}
            </GameCTAButton>
          </HeaderActionItem>
        ) : null}
        {canEditThumbnail ? (
          <HeaderActionItem mobileOrder={6}>
            <GameCTAButton
              onClick={onOpenThumbnailModal}
              disabled={savingThumbnail || publishing}
              loading={savingThumbnail}
              variant="neutral"
              size="md"
              icon="image"
            >
              Thumbnail
            </GameCTAButton>
          </HeaderActionItem>
        ) : null}
        {showContributionStatusBadge || canMergeBranch ? (
          <>
            {showContributionStatusBadge ? (
              <HeaderActionItem mobileOrder={2}>
                <span
                  className={badgePillClass}
                  style={getContributionBadgeStyle(contributionStatus)}
                  title={
                    contributionStatus === 'merging'
                        ? 'This branch is being merged into the original Build'
                        : 'Branch status'
                  }
                >
                  <Icon icon="code-branch" />
                  {formatContributionStatusLabel(contributionStatus)}
                </span>
              </HeaderActionItem>
            ) : null}
            {canMergeBranch ? (
              <HeaderActionItem mobileOrder={4}>
                <GameCTAButton
                  onClick={onMergeBranch || (() => {})}
                  disabled={Boolean(contributionActionLoading)}
                  loading={contributionActionLoading === 'merge'}
                  variant="success"
                  size="md"
                  icon="check"
                >
                  Merge Branch
                </GameCTAButton>
              </HeaderActionItem>
            ) : null}
            {contributionActionError ? (
              <HeaderActionItem mobileOrder={9}>
                <span
                  className={css`
                    color: #be123c;
                    font-weight: 900;
                  `}
                >
                  {contributionActionError}
                </span>
              </HeaderActionItem>
            ) : null}
          </>
        ) : null}
        {isOwner && !isContributionFork ? (
          <>
            <HeaderActionItem mobileOrder={4}>
              <GameCTAButton
                onClick={onTogglePublish}
                disabled={publishButtonDisabled}
                loading={publishing}
                variant="magenta"
                size="md"
                icon="globe"
                shiny={publicAppNeedsUpdate}
              >
                {publishing
                  ? 'Processing...'
                  : build.isPublic
                    ? publicAppIsUpToDate
                      ? 'Up to Date'
                      : 'Update App'
                    : 'Publish'}
              </GameCTAButton>
            </HeaderActionItem>
            {build.isPublic ? (
              <HeaderActionItem mobileOrder={7}>
                <GameCTAButton
                  onClick={onUnpublish || (() => {})}
                  disabled={publishing}
                  variant="neutral"
                  size="md"
                  icon="eye-slash"
                >
                  Unpublish
                </GameCTAButton>
              </HeaderActionItem>
            ) : null}
          </>
        ) : null}
        {showContributionButton ? (
          <HeaderActionItem mobileOrder={3}>
            <GameCTAButton
              onClick={onContribute}
              disabled={forking}
              loading={forking}
              variant="primary"
              size="md"
              icon="users"
            >
              {forking ? 'Working...' : 'Start Branch'}
            </GameCTAButton>
          </HeaderActionItem>
        ) : null}
        {showForkButton ? (
          <HeaderActionItem mobileOrder={4}>
            <GameCTAButton
              onClick={onFork}
              disabled={forking}
              loading={forking}
              variant={showContributionButton ? 'neutral' : 'primary'}
              size="md"
              icon="code-branch"
            >
              {forking ? 'Working...' : 'Fork'}
            </GameCTAButton>
          </HeaderActionItem>
        ) : null}
      </div>
      <div className={mobileButtonRowsClass}>
        <div className={mobileButtonRowClass}>
          {isOwner && !isContributionFork ? (
            <GameCTAButton
              onClick={onOpenCollaborationSettings}
              variant={collaborationMode === 'private' ? 'pink' : 'logoBlue'}
              size="md"
              icon={collaborationMode === 'private' ? 'users' : 'code-branch'}
            >
              {getCollaborationButtonLabel(collaborationMode)}
            </GameCTAButton>
          ) : null}
          {canEditMetadata ? (
            <GameCTAButton
              onClick={onOpenDescriptionModal}
              variant="neutral"
              size="md"
              icon="pencil-alt"
            >
              {build.description?.trim() ? 'Edit Details' : 'Add Details'}
            </GameCTAButton>
          ) : null}
          {canEditThumbnail ? (
            <GameCTAButton
              onClick={onOpenThumbnailModal}
              disabled={savingThumbnail || publishing}
              loading={savingThumbnail}
              variant="neutral"
              size="md"
              icon="image"
            >
              Thumbnail
            </GameCTAButton>
          ) : null}
          {canMergeBranch ? (
            <GameCTAButton
              onClick={onMergeBranch || (() => {})}
              disabled={Boolean(contributionActionLoading)}
              loading={contributionActionLoading === 'merge'}
              variant="success"
              size="md"
              icon="check"
            >
              Merge Branch
            </GameCTAButton>
          ) : null}
          {showContributionButton ? (
            <GameCTAButton
              onClick={onContribute}
              disabled={forking}
              loading={forking}
              variant="primary"
              size="md"
              icon="users"
            >
              {forking ? 'Working...' : 'Start Branch'}
            </GameCTAButton>
          ) : null}
          {showForkButton ? (
            <GameCTAButton
              onClick={onFork}
              disabled={forking}
              loading={forking}
              variant={showContributionButton ? 'neutral' : 'primary'}
              size="md"
              icon="code-branch"
            >
              {forking ? 'Working...' : 'Fork'}
            </GameCTAButton>
          ) : null}
        </div>
        {isOwner && !isContributionFork ? (
          <div className={mobileButtonRowClass}>
            <GameCTAButton
              onClick={onTogglePublish}
              disabled={publishButtonDisabled}
              loading={publishing}
              variant="magenta"
              size="md"
              icon="globe"
              shiny={publicAppNeedsUpdate}
            >
              {publishing
                ? 'Processing...'
                : build.isPublic
                  ? publicAppIsUpToDate
                    ? 'Up to Date'
                    : 'Update App'
                  : 'Publish'}
            </GameCTAButton>
            {build.isPublic ? (
              <GameCTAButton
                onClick={onUnpublish || (() => {})}
                disabled={publishing}
                variant="neutral"
                size="md"
                icon="eye-slash"
              >
                Unpublish
              </GameCTAButton>
            ) : null}
          </div>
        ) : null}
        {contributionActionError ? (
          <span
            className={css`
              color: #be123c;
              font-weight: 900;
            `}
          >
            {contributionActionError}
          </span>
        ) : null}
      </div>
    </header>
  );
}

function normalizeCollaborationMode(
  value: unknown
): 'private' | 'open_source' {
  return value === 'open_source' ? value : 'private';
}

function normalizeContributionStatus(
  value: unknown
):
  | 'none'
  | 'draft'
  | 'merging'
  | 'merged' {
  if (
    value === 'draft' ||
    value === 'merging' ||
    value === 'merged'
  ) {
    return value;
  }
  return 'none';
}

function normalizeReleaseStatus(value: unknown): {
  state: 'up_to_date' | 'unpublished_changes' | 'missing_snapshot';
  hasUnpublishedChanges: boolean;
  diff: {
    total: number;
    added: number;
    updated: number;
    deleted: number;
  };
} | null {
  if (!value || typeof value !== 'object') return null;
  const status = value as {
    state?: string;
    hasUnpublishedChanges?: boolean;
    diff?: {
      total?: number;
      added?: number;
      updated?: number;
      deleted?: number;
    };
  };
  const state =
    status.state === 'missing_snapshot'
      ? 'missing_snapshot'
      : status.state === 'unpublished_changes'
        ? 'unpublished_changes'
        : 'up_to_date';
  return {
    state,
    hasUnpublishedChanges: Boolean(status.hasUnpublishedChanges),
    diff: {
      total: Number(status.diff?.total || 0),
      added: Number(status.diff?.added || 0),
      updated: Number(status.diff?.updated || 0),
      deleted: Number(status.diff?.deleted || 0)
    }
  };
}

function getCollaborationButtonLabel(
  mode: 'private' | 'open_source'
) {
  if (mode === 'open_source') return 'Open Source Settings';
  return 'Work with People';
}

function getVisibilityBadgeStyle(isPublic: boolean): React.CSSProperties {
  if (isPublic) {
    return {
      background: 'rgba(65, 140, 235, 0.14)',
      borderColor: 'rgba(65, 140, 235, 0.34)',
      color: '#1d4ed8'
    };
  }

  return {
    background: 'rgba(100, 116, 139, 0.14)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
    color: '#334155'
  };
}

function getReleaseStatusBadgeStyle(
  state: 'up_to_date' | 'unpublished_changes' | 'missing_snapshot'
): React.CSSProperties {
  if (state === 'up_to_date') {
    return {
      background: 'rgba(34, 197, 94, 0.14)',
      borderColor: 'rgba(34, 197, 94, 0.34)',
      color: '#15803d'
    };
  }
  if (state === 'missing_snapshot') {
    return {
      background: 'rgba(236, 72, 153, 0.13)',
      borderColor: 'rgba(236, 72, 153, 0.32)',
      color: '#be185d'
    };
  }
  return {
    background: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.38)',
    color: '#b45309'
  };
}

function getReleaseStatusTitle(
  status: NonNullable<ReturnType<typeof normalizeReleaseStatus>>
) {
  if (status.state === 'up_to_date') {
    return 'The live app matches this workspace.';
  }
  if (status.state === 'missing_snapshot') {
    return 'This public app needs a published snapshot.';
  }
  const total = status.diff.total;
  return total > 0
    ? `${total} file${total === 1 ? '' : 's'} waiting to be released.`
    : 'Workspace changes are waiting to be released.';
}

function getRelationshipBadgeStyle(
  label: 'fork' | 'contribution'
): React.CSSProperties {
  if (label === 'fork') {
    return {
      background: 'rgba(139, 92, 246, 0.14)',
      borderColor: 'rgba(139, 92, 246, 0.34)',
      color: '#6d28d9'
    };
  }
  return {
    background: 'rgba(236, 72, 153, 0.13)',
    borderColor: 'rgba(236, 72, 153, 0.32)',
    color: '#be185d'
  };
}

function getContributionBadgeStyle(
  status:
    | 'none'
    | 'draft'
    | 'merging'
    | 'merged'
): React.CSSProperties {
  if (status === 'draft') {
    return {
      background: 'rgba(65, 140, 235, 0.14)',
      borderColor: 'rgba(65, 140, 235, 0.34)',
      color: '#1d4ed8'
    };
  }
  if (status === 'merging') {
    return {
      background: 'rgba(236, 72, 153, 0.13)',
      borderColor: 'rgba(236, 72, 153, 0.32)',
      color: '#be185d'
    };
  }
  return {
    background: 'rgba(100, 116, 139, 0.14)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
    color: '#334155'
  };
}

function formatContributionStatusLabel(
  status:
    | 'none'
    | 'draft'
    | 'merging'
    | 'merged'
) {
  if (status === 'none') return 'Branch';
  if (status === 'merging') return 'Merging';
  return status.charAt(0).toUpperCase() + status.slice(1);
}
