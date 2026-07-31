import React, { useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useKeyContext } from '~/contexts';
import EditBuildDetailsButton from '~/components/Build/EditBuildDetailsButton';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { ForkHistoryTrigger } from '~/components/Modals/BuildForkHistoryModal';
import DropdownList from '~/components/DropdownList';
import Icon from '~/components/Icon';
import UsernameText from '~/components/Texts/UsernameText';
import { Color } from '~/constants/css';
import type { User } from '~/types';
import {
  getBuildDisplayTitle,
  getBuildRelationshipLabels
} from '~/helpers/buildRelationshipHelpers';
import {
  normalizeBuildCollaborationMode,
  normalizeBuildReleaseStatus
} from '~/helpers/buildProjectHelpers';
import {
  getBuildRuntimePath,
  resolveBuildWorkspaceViewAppTarget,
  type BuildRuntimeSource
} from '~/helpers/buildRuntimeSource';
import RuntimeAssetTransferProgressBar from './RuntimeAssetTransferProgressBar';
import type { RuntimeAssetTransferProgressPayload } from './helpers/runtimeAssetTransferProgress';
import ViewAppVersionModal from './ViewAppVersionModal';
import {
  BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY,
  BUILD_WORKSPACE_COMPACT_MEDIA_QUERY
} from './constants';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";
const subtitleUsernameTextStyle: React.CSSProperties = {
  color: 'inherit',
  fontSize: 'inherit',
  fontWeight: 900
};

const headerClass = css`
  padding: 1.2rem 1.8rem;
  background: #fff;
  border-bottom: 1px solid var(--ui-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    gap: 0.45rem;
    padding: 0.55rem 0.75rem 0.6rem;
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    gap: 0.3rem;
    grid-template-columns: minmax(0, 1fr) minmax(0, auto);
    padding: 0.35rem 0.75rem 0.45rem;
  }
`;

const headerTitleClass = css`
  margin: 0;
  font-size: 2rem;
  color: var(--chat-text);
  font-family: ${displayFontFamily};
  font-weight: 900;
  line-height: 1.15;
  min-width: 0;
  max-width: 100%;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 1.45rem;
    line-height: 1.1;
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    font-size: 1.35rem;
  }
`;

const headerTitleRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.45rem;
    width: 100%;
  }
`;

const headerTitleMainClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  min-width: 0;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    flex-wrap: nowrap;
    gap: 0.4rem;
    overflow: hidden;
  }
`;

const headerSubtitleClass = css`
  font-size: 1.1rem;
  color: var(--chat-text);
  opacity: 0.75;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
    max-width: 100%;
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    display: none;
  }
`;

const headerInfoClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    gap: 0.25rem;
    width: 100%;
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    grid-column: 1;
    grid-row: 1;
  }
`;

const headerActionsClass = css`
  display: flex;
  gap: 0.55rem;
  align-items: center;
  flex-wrap: wrap;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: none;
  }
`;

const headerActionItemClass = css`
  display: contents;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: inline-flex;
    order: var(--mobile-action-order, 10);
  }
`;

const badgePillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1.1rem;
  padding: 0.58rem 0.9rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 900;
  font-family: ${displayFontFamily};
  border: 2px solid transparent;
  line-height: 1;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.12);
  text-decoration: none;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
  &[href] {
    cursor: pointer;
  }
  &[href]:hover {
    transform: translateY(-1px);
    text-decoration: none;
    box-shadow: 0 3px 0 rgba(15, 23, 42, 0.14);
  }
  &[href]:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
    text-decoration: none;
  }
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    flex: 0 0 auto;
    gap: 0.3rem;
    padding: 0.3rem 0.55rem;
    border-width: 1px;
    box-shadow: none;
    font-size: 1rem;
  }
`;

const mobileTitleBadgeGroupClass = css`
  display: none;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.3rem;
    flex-wrap: nowrap;
    min-width: 0;
    max-width: min(42vw, 17rem);
    overflow-x: auto;
    padding-bottom: 0.25rem;
    -webkit-overflow-scrolling: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
    > * {
      flex: 0 0 auto;
    }
    button {
      padding: 0.42rem 0.65rem;
      white-space: nowrap;
    }
  }
`;

const mobileButtonRowsClass = css`
  display: none;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 0.45rem;
    width: 100%;
    overflow-x: auto;
    padding: 0.1rem 0.05rem 0.5rem;
    -webkit-overflow-scrolling: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
    > * {
      flex: 0 0 auto;
    }
    button {
      padding: 0.45rem 0.75rem;
      white-space: nowrap;
    }
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    align-self: center;
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
    max-width: min(42vw, 30rem);
    width: auto;
    padding-bottom: 0.4rem;
  }
`;

const mobileButtonRowClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  width: 100%;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    flex: 0 0 auto;
    flex-wrap: nowrap;
    gap: 0.45rem;
    width: auto;
  }
`;

const mergeBranchActionClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  max-width: 100%;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    justify-content: center;
    flex: 0 0 auto;
    flex-wrap: nowrap;
    width: auto;
  }
`;

const mergeBranchTargetControlClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  max-width: min(22rem, 44vw);
  height: 2.6rem;
  padding: 0.28rem 0.45rem 0.28rem 0.65rem;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  background: #f0fdf4;
  color: #166534;
  box-shadow: 0 2px 0 rgba(21, 128, 61, 0.12);
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    max-width: 100%;
  }
`;

const mergeBranchTargetPrefixClass = css`
  flex: 0 0 auto;
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
  color: #15803d;
`;

const mergeBranchTargetTextClass = css`
  min-width: 0;
  max-width: 15rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1rem;
  font-weight: 900;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    max-width: min(15rem, calc(100vw - 9rem));
  }
`;

const mergeBranchTargetSelectClass = css`
  min-width: 8rem;
  max-width: 15rem;
  border: 0;
  outline: 0;
  background: transparent;
  color: #14532d;
  font: inherit;
  font-size: 1rem;
  font-weight: 900;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    max-width: min(15rem, calc(100vw - 9rem));
  }
`;

const titleRelationshipBadgeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.32rem 0.66rem;
  font-size: 1.1rem;
  font-weight: 900;
  font-family: ${displayFontFamily};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1;
  border: 2px solid transparent;
  flex: 0 0 auto;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    padding: 0.28rem 0.5rem;
    border-width: 1px;
    font-size: 1rem;
  }
`;

interface MergeBranchTargetOption {
  id: number;
  label: string;
  title?: string;
}

interface HeaderProps {
  build: {
    id: number;
    userId?: number | null;
    profilePicUrl?: string | null;
    title: string;
    description: string | null;
    username: string;
    isPublic: boolean;
    code: string | null;
    releaseStatus?: {
      state?: string;
      hasPublishedVersion?: boolean;
      hasUnpublishedChanges?: boolean;
      diff?: {
        total?: number;
        added?: number;
        updated?: number;
        deleted?: number;
      };
    } | null;
    thumbnailUrl?: string | null;
    sourceBuildId?: number | null;
    collaborationMode?: 'private' | 'contribution' | 'open_source';
    contributionAccess?: 'anyone' | 'invite_only';
    contributionBranchNumber?: number | null;
    contributionContributorId?: number | null;
    contributionStatus?: string | null;
    rootBuildUserId?: number | null;
    rootBuildUsername?: string | null;
    rootBuildProfilePicUrl?: string | null;
    rootBuildSourceBuildId?: number | null;
    rootBuildTitle?: string | null;
  };
  forking: boolean;
  canEditMetadata: boolean;
  canEditThumbnail: boolean;
  isOwner: boolean;
  publishing: boolean;
  savingThumbnail: boolean;
  showContributionButton: boolean;
  contributionActionError?: string;
  contributionActionLoading?: 'merge' | 'replace-main' | 'reset-to-main' | '';
  runtimeAssetTransferProgress?: RuntimeAssetTransferProgressPayload | null;
  canMergeBranch?: boolean;
  showMergeBranch?: boolean;
  mergeBranchDisabled?: boolean;
  mergeBranchShiny?: boolean;
  mergeBranchButtonLabel?: string;
  mergeBranchTargetId?: number;
  mergeBranchTargetLabel?: string;
  mergeBranchTargetOptions?: MergeBranchTargetOption[];
  mergeBranchTargetTitle?: string;
  showReplaceBranch?: boolean;
  replaceBranchDisabled?: boolean;
  replaceBranchButtonLabel?: string;
  showResetBranchToMain?: boolean;
  showForkButton: boolean;
  onContribute: () => void;
  onFork: () => void;
  onMergeBranch?: () => void;
  onReplaceMainBranch?: () => void;
  onResetBranchToMain?: () => void;
  onMergeBranchTargetChange?: (targetBranchId: number) => void;
  onOpenCollaborationSettings: () => void;
  onOpenDescriptionModal: () => void;
  onOpenThumbnailModal: () => void;
  onTogglePublish: () => void;
  onUnpublish?: () => void;
  onDelete?: () => void;
  canLeaveTeam?: boolean;
  onLeaveTeam?: () => void;
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

// A settings dropdown whose trigger is a GameCTAButton so it visually matches
// the other header CTAs.
function SettingsMenuButton({ menuProps }: { menuProps: any[] }) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [dropdownContext, setDropdownContext] = useState<DOMRect | null>(null);

  return (
    <div ref={triggerRef} style={{ position: 'relative' }}>
      <GameCTAButton
        variant="neutral"
        size="md"
        icon="gear"
        toggled={!!dropdownContext}
        onClick={handleToggle}
      >
        Settings
      </GameCTAButton>
      {dropdownContext ? (
        <DropdownList
          dropdownContext={dropdownContext}
          triggerRef={triggerRef}
          onHideMenu={handleHide}
          style={{ minWidth: '15rem' }}
        >
          {menuProps.map((item, index) =>
            item.separator ? (
              <hr key={index} />
            ) : (
              <li
                key={index}
                style={item.style}
                className={css`
                  opacity: ${item.disabled ? 0.3 : 1};
                  cursor: ${item.disabled ? 'default' : 'pointer'};
                  @media (hover: hover) and (pointer: fine) {
                    &:hover {
                      background: ${item.disabled ? '#fff !important' : ''};
                    }
                  }
                `}
                onClick={
                  item.disabled
                    ? undefined
                    : () => {
                        setDropdownContext(null);
                        item.onClick?.();
                      }
                }
              >
                {item.label}
              </li>
            )
          )}
        </DropdownList>
      ) : null}
    </div>
  );

  function handleToggle() {
    setDropdownContext(
      dropdownContext
        ? null
        : triggerRef.current?.getBoundingClientRect() ?? null
    );
  }

  function handleHide() {
    setDropdownContext(null);
  }
}

function BuildVisibilityBadge({ isPublic }: { isPublic: boolean }) {
  const badgeContent = (
    <>
      <Icon icon={isPublic ? 'globe' : 'lock'} />
      {isPublic ? 'Public' : 'Private'}
    </>
  );

  return (
    <span
      className={badgePillClass}
      style={getVisibilityBadgeStyle(isPublic)}
      title={isPublic ? 'Public build' : 'Private build'}
    >
      {badgeContent}
    </span>
  );
}

function BuildViewAppButton({
  buildId,
  defaultRuntimeSource,
  promptForVersion,
  runtimeBackState,
  size = 'md'
}: {
  buildId: number;
  defaultRuntimeSource: BuildRuntimeSource;
  promptForVersion: boolean;
  runtimeBackState: RuntimeBackState;
  size?: 'sm' | 'md';
}) {
  const navigate = useNavigate();
  const [versionModalShown, setVersionModalShown] = useState(false);

  return (
    <>
      <GameCTAButton
        onClick={handleViewApp}
        variant="logoBlue"
        size={size}
        icon="eye"
      >
        View App
      </GameCTAButton>
      {versionModalShown ? (
        <ViewAppVersionModal
          onClose={() => setVersionModalShown(false)}
          onOpenPublished={() => openRuntimeSource('published')}
          onOpenWorkspace={() => openRuntimeSource('workspace')}
        />
      ) : null}
    </>
  );

  function handleViewApp() {
    if (promptForVersion) {
      setVersionModalShown(true);
      return;
    }
    openRuntimeSource(defaultRuntimeSource);
  }

  function openRuntimeSource(source: BuildRuntimeSource) {
    setVersionModalShown(false);
    navigate(getBuildRuntimePath(buildId, source), {
      state: runtimeBackState
    });
  }
}

function BuildReleaseStatusBadge({
  releaseStatus
}: {
  releaseStatus: NonNullable<ReturnType<typeof normalizeBuildReleaseStatus>>;
}) {
  const hasUnpublishedChanges =
    releaseStatus.hasUnpublishedChanges ||
    releaseStatus.state === 'missing_snapshot';
  const badgeContent = (
    <>
      <Icon
        icon={hasUnpublishedChanges ? 'cloud-upload-alt' : 'check-circle'}
      />
      {hasUnpublishedChanges ? 'Unpublished Changes' : 'Live'}
    </>
  );

  return (
    <span
      className={badgePillClass}
      style={getReleaseStatusBadgeStyle(releaseStatus.state)}
      title="Published app status"
    >
      {badgeContent}
    </span>
  );
}

export default function Header({
  build,
  forking,
  canEditMetadata,
  canEditThumbnail,
  isOwner,
  publishing,
  savingThumbnail,
  showContributionButton,
  contributionActionError = '',
  contributionActionLoading = '',
  runtimeAssetTransferProgress = null,
  canMergeBranch = false,
  showMergeBranch = false,
  mergeBranchDisabled = false,
  mergeBranchShiny = false,
  mergeBranchButtonLabel = 'Merge Branch',
  mergeBranchTargetId = 0,
  mergeBranchTargetLabel = '',
  mergeBranchTargetOptions = [],
  mergeBranchTargetTitle = '',
  showReplaceBranch = false,
  replaceBranchDisabled = false,
  replaceBranchButtonLabel = 'Replace Branch',
  showResetBranchToMain = false,
  showForkButton,
  onContribute,
  onFork,
  onMergeBranch,
  onReplaceMainBranch,
  onResetBranchToMain,
  onMergeBranchTargetChange,
  onDelete,
  canLeaveTeam,
  onLeaveTeam,
  onOpenCollaborationSettings,
  onOpenDescriptionModal,
  onOpenThumbnailModal,
  onTogglePublish,
  onUnpublish
}: HeaderProps) {
  const location = useLocation();
  const banned = useKeyContext((v) => v.myState.banned);
  const runtimeBackState = React.useMemo(
    () => ({
      runtimeBackTo: `${location.pathname}${location.search}${location.hash}`,
      runtimeBackLabel: 'Back to Workspace'
    }),
    [location.hash, location.pathname, location.search]
  );
  const isContributionFork =
    build.contributionStatus && build.contributionStatus !== 'none';
  const contributionStatus = normalizeContributionStatus(
    build.contributionStatus
  );
  const collaborationMode = normalizeBuildCollaborationMode(
    build.collaborationMode
  );
  const displayTitle = getBuildDisplayTitle(build);
  const relationshipLabels = getBuildRelationshipLabels(build);
  const description = build.description?.trim();
  const projectOwnerUsername = String(
    isContributionFork && build.rootBuildUsername
      ? build.rootBuildUsername
      : build.username
  ).trim();
  const branchOwnerUsername = String(build.username || '').trim();
  const projectOwnerUser = getHeaderUsernameUser({
    id:
      isContributionFork && build.rootBuildUserId
        ? build.rootBuildUserId
        : build.userId,
    profilePicUrl: isContributionFork
      ? build.rootBuildProfilePicUrl
      : build.profilePicUrl,
    username: projectOwnerUsername
  });
  const branchOwnerUser = getHeaderUsernameUser({
    id: build.userId,
    profilePicUrl: build.profilePicUrl,
    username: branchOwnerUsername
  });
  const sharedOwnerUser = branchOwnerUsername
    ? branchOwnerUser
    : projectOwnerUser;
  const ownerLine =
    isContributionFork &&
    projectOwnerUsername &&
    branchOwnerUsername &&
    projectOwnerUsername !== branchOwnerUsername ? (
      <>
        Project by {renderHeaderUsername(projectOwnerUser)} · Branch by{' '}
        {renderHeaderUsername(branchOwnerUser)}
      </>
    ) : isContributionFork ? (
      <>Project and branch by {renderHeaderUsername(sharedOwnerUser)}</>
    ) : (
      <>by {renderHeaderUsername(projectOwnerUser)}</>
    );
  const showContributionStatusBadge =
    isContributionFork &&
    contributionStatus !== 'none' &&
    contributionStatus !== 'draft';
  const shouldShowMergeButton = Boolean(showMergeBranch || canMergeBranch);
  const shouldShowMergeBranch = Boolean(
    shouldShowMergeButton || showReplaceBranch || showResetBranchToMain
  );
  const mergeBranchButtonDisabled = Boolean(
    mergeBranchDisabled || !canMergeBranch || contributionActionLoading
  );
  const replaceMainBranchButtonDisabled = Boolean(
    replaceBranchDisabled || contributionActionLoading
  );
  const resetBranchToMainButtonDisabled = Boolean(contributionActionLoading);
  const shouldHighlightMergeBranch =
    mergeBranchShiny && !mergeBranchButtonDisabled;
  const normalizedMergeBranchTargetOptions = mergeBranchTargetOptions.filter(
    (option) => Number(option.id || 0) > 0 && String(option.label || '').trim()
  );
  const releaseStatus = normalizeBuildReleaseStatus(build.releaseStatus);
  const publicAppIsUpToDate = Boolean(
    build.isPublic &&
    releaseStatus?.state === 'up_to_date' &&
    !releaseStatus.hasUnpublishedChanges
  );
  const publicAppNeedsUpdate = Boolean(build.isPublic && !publicAppIsUpToDate);
  const shouldPromptForRuntimeVersion = Boolean(
    build.isPublic &&
    releaseStatus?.hasPublishedVersion &&
    releaseStatus.hasUnpublishedChanges
  );
  const hasThumbnail = Boolean(String(build.thumbnailUrl || '').trim());
  // Nudge owners to set a thumbnail: while unset, keep the Thumbnail button
  // out front (shiny pink); once set, it lives in the Settings menu.
  const showThumbnailNudge = canEditThumbnail && !hasThumbnail;
  const showVisibilityBadge = !isContributionFork;
  const viewAppTarget = resolveBuildWorkspaceViewAppTarget({
    isBuildOwner: isOwner,
    isContributionBranch: Boolean(isContributionFork),
    isPublic: Boolean(build.isPublic)
  });
  const publishButtonDisabled =
    publishing ||
    (!build.isPublic && !build.code) ||
    Boolean(build.isPublic && publicAppIsUpToDate);

  function renderSettingsMenu() {
    const items: any[] = [];
    if (canEditMetadata) {
      items.push({
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1rem' }}>
              {build.description?.trim() ? 'Edit details' : 'Add details'}
            </span>
          </>
        ),
        onClick: onOpenDescriptionModal
      });
    }
    if (canEditThumbnail && hasThumbnail) {
      items.push({
        label: (
          <>
            <Icon icon="image" />
            <span style={{ marginLeft: '1rem' }}>Thumbnail</span>
          </>
        ),
        disabled: savingThumbnail || publishing,
        onClick: onOpenThumbnailModal
      });
    }
    if (isOwner && !isContributionFork) {
      items.push({
        label: (
          <>
            <Icon
              icon={collaborationMode === 'private' ? 'users' : 'code-branch'}
            />
            <span style={{ marginLeft: '1rem' }}>
              {getCollaborationButtonLabel(collaborationMode)}
            </span>
          </>
        ),
        onClick: onOpenCollaborationSettings
      });
    }
    if (isOwner && !isContributionFork && build.isPublic) {
      items.push({
        label: (
          <>
            <Icon icon="eye-slash" />
            <span style={{ marginLeft: '1rem' }}>Unpublish</span>
          </>
        ),
        disabled: publishing || banned?.build,
        onClick: onUnpublish || (() => {})
      });
    }
    if (onDelete) {
      if (items.length > 0) {
        items.push({ separator: true });
      }
      items.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>Delete</span>
          </>
        ),
        style: { color: Color.red(), fontWeight: 800 },
        onClick: onDelete
      });
    }
    if (canLeaveTeam && onLeaveTeam) {
      if (items.length > 0) {
        items.push({ separator: true });
      }
      items.push({
        label: (
          <>
            <Icon icon="right-from-bracket" />
            <span style={{ marginLeft: '1rem' }}>Leave team</span>
          </>
        ),
        style: { color: Color.red(), fontWeight: 800 },
        onClick: onLeaveTeam
      });
    }
    if (items.length === 0) return null;
    return <SettingsMenuButton menuProps={items} />;
  }

  function renderMergeTargetControl() {
    const targetLabel = String(mergeBranchTargetLabel || '').trim();
    if (!targetLabel) return null;
    const targetTitle = String(mergeBranchTargetTitle || targetLabel).trim();
    if (normalizedMergeBranchTargetOptions.length > 1) {
      return (
        <span className={mergeBranchTargetControlClass} title={targetTitle}>
          <span className={mergeBranchTargetPrefixClass}>Into</span>
          <select
            className={mergeBranchTargetSelectClass}
            aria-label="Merge target branch"
            value={Number(mergeBranchTargetId || 0)}
            disabled={Boolean(contributionActionLoading)}
            onChange={(event) =>
              onMergeBranchTargetChange?.(Number(event.target.value || 0))
            }
          >
            {normalizedMergeBranchTargetOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </span>
      );
    }
    return (
      <span className={mergeBranchTargetControlClass} title={targetTitle}>
        <span className={mergeBranchTargetPrefixClass}>Into</span>
        <span className={mergeBranchTargetTextClass}>{targetLabel}</span>
      </span>
    );
  }

  function renderMergeBranchAction() {
    if (!shouldShowMergeBranch) return null;
    return (
      <span className={mergeBranchActionClass}>
        {renderMergeTargetControl()}
        {shouldShowMergeButton ? (
          <GameCTAButton
            onClick={onMergeBranch || (() => {})}
            disabled={mergeBranchButtonDisabled}
            loading={contributionActionLoading === 'merge'}
            variant="success"
            size="md"
            icon="check"
            shiny={shouldHighlightMergeBranch}
          >
            {mergeBranchButtonLabel}
          </GameCTAButton>
        ) : null}
        {showReplaceBranch ? (
          <GameCTAButton
            onClick={onReplaceMainBranch || (() => {})}
            disabled={replaceMainBranchButtonDisabled}
            loading={contributionActionLoading === 'replace-main'}
            variant="orange"
            size="md"
            icon="copy"
          >
            {replaceBranchButtonLabel}
          </GameCTAButton>
        ) : null}
        {showResetBranchToMain ? (
          <GameCTAButton
            onClick={onResetBranchToMain || (() => {})}
            disabled={resetBranchToMainButtonDisabled}
            loading={contributionActionLoading === 'reset-to-main'}
            variant="orange"
            size="md"
            icon="copy"
          >
            Reset to Main
          </GameCTAButton>
        ) : null}
      </span>
    );
  }

  const settingsMenu = renderSettingsMenu();
  const mobileHeaderActionsShown = Boolean(
    shouldShowMergeBranch ||
      showContributionButton ||
      showForkButton ||
      showThumbnailNudge ||
      settingsMenu ||
      runtimeAssetTransferProgress ||
      (isOwner && !isContributionFork) ||
      contributionActionError
  );

  return (
    <header className={headerClass}>
      <div className={headerInfoClass}>
        <div className={headerTitleRowClass}>
          <div className={headerTitleMainClass}>
            <h2 className={headerTitleClass}>{displayTitle}</h2>
            {relationshipLabels.map((label) =>
              label === 'fork' ? (
                <ForkHistoryTrigger
                  key={label}
                  buildId={Number(build.id)}
                  className={titleRelationshipBadgeClass}
                  style={getRelationshipBadgeStyle(label)}
                >
                  <Icon icon="code-branch" />
                  Fork
                </ForkHistoryTrigger>
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
              <EditBuildDetailsButton onClick={onOpenDescriptionModal} />
            ) : null}
          </div>
          <div className={mobileTitleBadgeGroupClass}>
            {showVisibilityBadge ? (
              <BuildVisibilityBadge isPublic={Boolean(build.isPublic)} />
            ) : null}
            {viewAppTarget.visible ? (
              <BuildViewAppButton
                buildId={Number(build.id)}
                defaultRuntimeSource={viewAppTarget.source}
                promptForVersion={shouldPromptForRuntimeVersion}
                runtimeBackState={runtimeBackState}
                size="sm"
              />
            ) : null}
            {build.isPublic && releaseStatus ? (
              <BuildReleaseStatusBadge releaseStatus={releaseStatus} />
            ) : null}
            {showContributionStatusBadge ? (
              <span
                className={badgePillClass}
                style={getContributionBadgeStyle(contributionStatus)}
                title={
                  contributionStatus === 'merging'
                    ? 'This branch has conflict markers to resolve'
                    : 'Branch status'
                }
              >
                <Icon icon="code-branch" />
                {formatContributionStatusLabel(contributionStatus)}
              </span>
            ) : null}
          </div>
        </div>
        <div className={headerSubtitleClass}>
          {description ? <>{description} · </> : null}
          {ownerLine}
        </div>
      </div>
      <div className={headerActionsClass}>
        {showVisibilityBadge ? (
          <HeaderActionItem mobileOrder={1}>
            <BuildVisibilityBadge isPublic={Boolean(build.isPublic)} />
          </HeaderActionItem>
        ) : null}
        {viewAppTarget.visible ? (
          <HeaderActionItem mobileOrder={2}>
            <BuildViewAppButton
              buildId={Number(build.id)}
              defaultRuntimeSource={viewAppTarget.source}
              promptForVersion={shouldPromptForRuntimeVersion}
              runtimeBackState={runtimeBackState}
            />
          </HeaderActionItem>
        ) : null}
        {build.isPublic && releaseStatus ? (
          <HeaderActionItem mobileOrder={3}>
            <BuildReleaseStatusBadge releaseStatus={releaseStatus} />
          </HeaderActionItem>
        ) : null}
        {showContributionStatusBadge || shouldShowMergeBranch ? (
          <>
            {showContributionStatusBadge ? (
              <HeaderActionItem mobileOrder={2}>
                <span
                  className={badgePillClass}
                  style={getContributionBadgeStyle(contributionStatus)}
                  title={
                    contributionStatus === 'merging'
                      ? 'This branch has conflict markers to resolve'
                      : 'Branch status'
                  }
                >
                  <Icon icon="code-branch" />
                  {formatContributionStatusLabel(contributionStatus)}
                </span>
              </HeaderActionItem>
            ) : null}
            {shouldShowMergeBranch ? (
              <HeaderActionItem mobileOrder={4}>
                {renderMergeBranchAction()}
              </HeaderActionItem>
            ) : null}
            {runtimeAssetTransferProgress ? (
              <HeaderActionItem mobileOrder={8}>
                <RuntimeAssetTransferProgressBar
                  progress={runtimeAssetTransferProgress}
                />
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
        {showThumbnailNudge ? (
          <HeaderActionItem mobileOrder={5}>
            <GameCTAButton
              onClick={onOpenThumbnailModal}
              disabled={savingThumbnail || publishing}
              loading={savingThumbnail}
              variant="pink"
              size="md"
              icon="image"
              shiny
            >
              Thumbnail
            </GameCTAButton>
          </HeaderActionItem>
        ) : null}
        {isOwner && !isContributionFork ? (
          <HeaderActionItem mobileOrder={4}>
            <GameCTAButton
              onClick={onTogglePublish}
              disabled={publishButtonDisabled || banned?.build}
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
        ) : null}
        {showContributionButton ? (
          <HeaderActionItem mobileOrder={3}>
            <GameCTAButton
              onClick={onContribute}
              disabled={forking || banned?.build}
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
              disabled={forking || banned?.build}
              loading={forking}
              variant={showContributionButton ? 'neutral' : 'primary'}
              size="md"
              icon="code-branch"
            >
              {forking ? 'Working...' : 'Fork'}
            </GameCTAButton>
          </HeaderActionItem>
        ) : null}
        {settingsMenu ? (
          <HeaderActionItem mobileOrder={10}>{settingsMenu}</HeaderActionItem>
        ) : null}
      </div>
      {mobileHeaderActionsShown ? (
        <div className={mobileButtonRowsClass}>
          <div className={mobileButtonRowClass}>
            {shouldShowMergeBranch ? renderMergeBranchAction() : null}
            {showContributionButton ? (
              <GameCTAButton
                onClick={onContribute}
                disabled={forking || banned?.build}
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
                disabled={forking || banned?.build}
                loading={forking}
                variant={showContributionButton ? 'neutral' : 'primary'}
                size="md"
                icon="code-branch"
              >
                {forking ? 'Working...' : 'Fork'}
              </GameCTAButton>
            ) : null}
            {showThumbnailNudge ? (
              <GameCTAButton
                onClick={onOpenThumbnailModal}
                disabled={savingThumbnail || publishing}
                loading={savingThumbnail}
                variant="pink"
                size="md"
                icon="image"
                shiny
              >
                Thumbnail
              </GameCTAButton>
            ) : null}
            {settingsMenu}
          </div>
          {runtimeAssetTransferProgress ? (
            <RuntimeAssetTransferProgressBar
              progress={runtimeAssetTransferProgress}
            />
          ) : null}
          {isOwner && !isContributionFork ? (
            <div className={mobileButtonRowClass}>
              <GameCTAButton
                onClick={onTogglePublish}
                disabled={publishButtonDisabled || banned?.build}
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
      ) : null}
    </header>
  );
}

function getHeaderUsernameUser({
  id,
  profilePicUrl,
  username
}: {
  id?: number | null;
  profilePicUrl?: string | null;
  username?: string | null;
}): User {
  return {
    id: Number(id || 0),
    profilePicUrl: profilePicUrl || '',
    username: username || ''
  };
}

function renderHeaderUsername(user: User) {
  if (!user.username) return 'unknown';
  return (
    <UsernameText
      color="inherit"
      textStyle={subtitleUsernameTextStyle}
      user={user}
    />
  );
}

interface RuntimeBackState {
  runtimeBackTo: string;
  runtimeBackLabel: string;
}

function normalizeContributionStatus(
  value: unknown
): 'none' | 'draft' | 'merging' | 'merged' {
  if (value === 'draft' || value === 'merging' || value === 'merged') {
    return value;
  }
  return 'none';
}

function getCollaborationButtonLabel(mode: 'private' | 'open_source') {
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
  status: 'none' | 'draft' | 'merging' | 'merged'
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
  status: 'none' | 'draft' | 'merging' | 'merged'
) {
  if (status === 'none') return 'Branch';
  if (status === 'merging') return 'Conflicts';
  return status.charAt(0).toUpperCase() + status.slice(1);
}
