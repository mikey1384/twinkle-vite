import React from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
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

const headerActionsClass = css`
  display: flex;
  gap: 0.55rem;
  align-items: center;
  flex-wrap: wrap;
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
    title: string;
    description: string | null;
    username: string;
    isPublic: boolean;
    code: string | null;
    sourceBuildId?: number | null;
    collaborationMode?: 'private' | 'contribution' | 'open_source';
    contributionAccess?: 'anyone' | 'invite_only';
    contributionStatus?: string | null;
    rootBuildUsername?: string | null;
    rootBuildSourceBuildId?: number | null;
  };
  forking: boolean;
  canEditMetadata: boolean;
  isOwner: boolean;
  profileTheme?: string | null;
  publishing: boolean;
  savingThumbnail: boolean;
  showContributionButton: boolean;
  contributionActionError?: string;
  contributionActionLoading?: 'submit' | 'reopen' | '';
  showForkButton: boolean;
  onContribute: () => void;
  onFork: () => void;
  onOpenCollaborationSettings: () => void;
  onOpenDescriptionModal: () => void;
  onOpenThumbnailModal: () => void;
  onReopenContribution?: () => void;
  onSubmitContribution?: () => void;
  onTogglePublish: () => void;
}

export default function Header({
  build,
  forking,
  canEditMetadata,
  isOwner,
  profileTheme,
  publishing,
  savingThumbnail,
  showContributionButton,
  contributionActionError = '',
  contributionActionLoading = '',
  showForkButton,
  onContribute,
  onFork,
  onOpenCollaborationSettings,
  onOpenDescriptionModal,
  onOpenThumbnailModal,
  onReopenContribution,
  onSubmitContribution,
  onTogglePublish
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
  const sourceOwnerUsername =
    isContributionFork && build.rootBuildUsername
      ? build.rootBuildUsername
      : build.username;
  return (
    <header className={headerClass}>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        `}
      >
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
          <h2 className={headerTitleClass}>{displayTitle}</h2>
          {relationshipLabels.map((label) => (
            <span
              key={label}
              className={titleRelationshipBadgeClass}
              style={getRelationshipBadgeStyle(label)}
            >
              <Icon icon={label === 'fork' ? 'code-branch' : 'users'} />
              {label === 'fork' ? 'Fork' : 'Contribution'}
            </span>
          ))}
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
        <span className={headerSubtitleClass}>
          {description ? `${description} · ` : ''}
          by {sourceOwnerUsername}
        </span>
      </div>
      <div className={headerActionsClass}>
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
        {isOwner && !isContributionFork ? (
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
        {isOwner && isContributionFork ? (
          <>
            <span
              className={badgePillClass}
              style={getContributionBadgeStyle(contributionStatus)}
              title={
                contributionStatus === 'submitted'
                  ? 'Submitted forks are locked until reopened'
                  : contributionStatus === 'merging'
                    ? 'This contribution is being merged into the original Build'
                    : 'Contribution fork status'
              }
            >
              <Icon icon="code-branch" />
              {formatContributionStatusLabel(contributionStatus)}
            </span>
            {contributionStatus === 'draft' ? (
              <GameCTAButton
                onClick={onSubmitContribution || (() => {})}
                disabled={Boolean(contributionActionLoading)}
                loading={contributionActionLoading === 'submit'}
                variant="success"
                size="md"
                icon="paper-plane"
              >
                Submit
              </GameCTAButton>
            ) : null}
            {contributionStatus === 'submitted' ? (
              <GameCTAButton
                onClick={onReopenContribution || (() => {})}
                disabled={Boolean(contributionActionLoading)}
                loading={contributionActionLoading === 'reopen'}
                variant="neutral"
                size="md"
                icon="undo"
              >
                Reopen Draft
              </GameCTAButton>
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
          </>
        ) : null}
        {isOwner && !isContributionFork ? (
          <GameCTAButton
            onClick={onTogglePublish}
            disabled={publishing || (!build.isPublic && !build.code)}
            loading={publishing}
            variant={build.isPublic ? 'neutral' : 'magenta'}
            size="md"
            icon={build.isPublic ? 'eye-slash' : 'globe'}
          >
            {publishing
              ? 'Processing...'
              : build.isPublic
                ? 'Unpublish'
                : 'Publish'}
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
            {forking ? 'Working...' : 'Contribute'}
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
  | 'submitted'
  | 'merging'
  | 'merged'
  | 'rejected'
  | 'withdrawn' {
  if (
    value === 'draft' ||
    value === 'submitted' ||
    value === 'merging' ||
    value === 'merged' ||
    value === 'rejected' ||
    value === 'withdrawn'
  ) {
    return value;
  }
  return 'none';
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
    | 'submitted'
    | 'merging'
    | 'merged'
    | 'rejected'
    | 'withdrawn'
): React.CSSProperties {
  if (status === 'draft') {
    return {
      background: 'rgba(65, 140, 235, 0.14)',
      borderColor: 'rgba(65, 140, 235, 0.34)',
      color: '#1d4ed8'
    };
  }
  if (status === 'submitted') {
    return {
      background: 'rgba(34, 197, 94, 0.14)',
      borderColor: 'rgba(34, 197, 94, 0.34)',
      color: '#15803d'
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
    | 'submitted'
    | 'merging'
    | 'merged'
    | 'rejected'
    | 'withdrawn'
) {
  if (status === 'none') return 'Contribution';
  if (status === 'merging') return 'Merging';
  return status.charAt(0).toUpperCase() + status.slice(1);
}
