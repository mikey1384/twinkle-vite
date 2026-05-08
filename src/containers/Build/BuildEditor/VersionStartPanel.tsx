import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import BuildPreviewFrame from '~/containers/Build/shared/components/BuildPreviewFrame';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import FullTextReveal from '~/components/Texts/FullTextRevealFromOuterLayer';
import UsernameText from '~/components/Texts/UsernameText';
import { mobileMaxWidth } from '~/constants/css';
import { textIsOverflown } from '~/helpers';
import { timeSince } from '~/helpers/timeStampHelpers';
import { getBuildBranchDisplayTitle } from '../shared/domain/buildRelationshipLabels';
import {
  canDeleteBuildBranchStatus,
  canReviewBuildBranchStatus,
  formatBranchFullDisplayTitle,
  formatOwnerAttentionCount,
  getReleaseDiffTotal,
  normalizeWorkspacePanelScrollTop,
  stripBranchTitleSuffixes
} from './domain/buildBranches';
import type {
  BuildBranchDeleteTarget,
  BuildReleaseStatus,
  BuildVersionSummary
} from './types';

const versionStartPanelClass = css`
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.85rem;
  padding: 1.4rem;
  background: #fff;
`;

const branchPanelActionsClass = css`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  min-height: 2.8rem;
`;

const versionStartCardClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  align-items: flex-start;
  background: #fff;
`;

const branchStartRowClass = css`
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const versionStartTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  font-weight: 900;
  font-size: 1.25rem;
  color: var(--chat-text);
`;

const versionStartTextClass = css`
  margin: 0;
  color: var(--chat-text);
  opacity: 0.76;
  font-weight: 700;
  line-height: 1.4;
`;

const branchListHelpClass = css`
  width: 100%;
  margin: 0.1rem 0 -0.25rem;
  color: var(--chat-text);
  opacity: 0.68;
  font-weight: 800;
  line-height: 1.35;
`;

const branchNameInputClass = css`
  width: 100%;
  border: 1px solid var(--ui-border);
  border-radius: 0.7rem;
  padding: 0.78rem 0.9rem;
  font: inherit;
  color: var(--chat-text);
  background: #fff;
  &:focus {
    outline: 2px solid var(--ui-border-strong);
    outline-offset: 2px;
  }
`;

const versionStartActionsClass = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65rem;
  width: 100%;
`;

const branchListsClass = css`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const branchSectionClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const versionLoadTitleClass = css`
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--chat-text);
  opacity: 0.7;
  text-transform: uppercase;
`;

const branchCardClass = css`
  position: relative;
  width: 100%;
  min-width: 0;
  border: 1px solid var(--ui-border);
  border-radius: 0.85rem;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
  &:hover {
    border-color: var(--ui-border-strong);
    background: #f8fbff;
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  }
  &:focus-visible {
    outline: 2px solid var(--ui-border-strong);
    outline-offset: 3px;
  }
  @media (max-width: ${mobileMaxWidth}) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) clamp(7.25rem, 34vw, 10rem);
    min-height: 7.4rem;
  }
`;

const branchPreviewClass = css`
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 0;
  border: 0;
  border-bottom: 1px solid var(--ui-border);
  border-radius: 0;
  box-shadow: none;
  @media (max-width: ${mobileMaxWidth}) {
    order: 2;
    height: 100%;
    min-height: 7.4rem;
    aspect-ratio: auto;
    border-bottom: 0;
    border-left: 1px solid var(--ui-border);
  }
`;

const branchPreviewCurrentBadgeClass = css`
  position: absolute;
  z-index: 3;
  top: 0.55rem;
  right: 0.55rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.24);
  padding: 0.25rem 0.55rem;
  font-size: 1.1rem;
  font-weight: 900;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
`;

const branchCardBodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.85rem;
  min-width: 0;
  @media (max-width: ${mobileMaxWidth}) {
    order: 1;
    justify-content: space-between;
    padding: 0.72rem;
  }
`;

const branchCardHeaderClass = css`
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  min-width: 0;
`;

const branchAvatarClass = css`
  width: 2.35rem;
  height: 2.35rem;
  flex: 0 0 auto;
  @media (max-width: ${mobileMaxWidth}) {
    width: 2rem;
    height: 2rem;
  }
`;

const versionLoadButtonClass = css`
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: #fff;
  color: var(--chat-text);
  padding: 0.44rem 0.7rem;
  font: inherit;
  font-size: 1.1rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.1);
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
  &:hover:not(:disabled) {
    border-color: var(--ui-border-strong);
    background: #f8fbff;
  }
  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
`;

const branchDeleteButtonClass = css`
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  z-index: 2;
  width: 2.15rem;
  height: 2.15rem;
  border: 1px solid rgba(239, 68, 68, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #ef4444;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font: inherit;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(220, 38, 38, 0.12);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
  &:hover:not(:disabled) {
    border-color: rgba(239, 68, 68, 0.5);
    background: #fff1f2;
    color: #dc2626;
  }
  &:disabled {
    cursor: default;
    opacity: 0.55;
  }
  @media (max-width: ${mobileMaxWidth}) {
    top: 0.4rem;
    right: 0.4rem;
    width: 1.85rem;
    height: 1.85rem;
    font-size: 1.1rem;
  }
`;

const branchTopDeleteButtonClass = css`
  border: 1px solid rgba(239, 68, 68, 0.28);
  border-radius: 999px;
  background: #fff;
  color: #dc2626;
  display: inline-flex;
  align-items: center;
  gap: 0.48rem;
  padding: 0.56rem 0.85rem;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(220, 38, 38, 0.12);
  &:hover:not(:disabled) {
    background: #fff1f2;
  }
  &:disabled {
    cursor: default;
    opacity: 0.55;
  }
`;

const branchLoadTextClass = css`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
`;

const branchLoadTitleRevealWrapClass = css`
  display: block;
  width: 100%;
  min-width: 0;
`;

const branchLoadTitleTextClass = css`
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 900;
`;

const branchLoadMetaClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  color: var(--chat-text);
  opacity: 0.62;
  font-size: 1.1rem;
  font-weight: 800;
`;

const branchLoadBadgeRowClass = css`
  width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: space-between;
  @media (max-width: ${mobileMaxWidth}) {
    justify-content: flex-start;
  }
`;

const versionLoadStatusClass = css`
  flex-shrink: 0;
  border-radius: 999px;
  background: #edf4ff;
  color: #2563eb;
  padding: 0.25rem 0.55rem;
  font-size: 1.1rem;
  font-weight: 900;
`;

const branchEmptyTextClass = css`
  border: 1px dashed var(--ui-border);
  border-radius: 0.7rem;
  padding: 0.75rem 0.9rem;
  color: var(--chat-text);
  opacity: 0.66;
  font-weight: 800;
`;

const ownerAttentionCardClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 0.95rem;
  background: #fff;
  padding: 0.85rem;
  margin-bottom: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const ownerAttentionHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  flex-wrap: wrap;
`;

const ownerAttentionTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--chat-text);
`;

const ownerAttentionCountClass = css`
  border-radius: 999px;
  border: 1px solid rgba(236, 72, 153, 0.24);
  background: #fdf2f8;
  color: #db2777;
  padding: 0.22rem 0.55rem;
  font-size: 1.1rem;
  font-weight: 900;
`;

const ownerAttentionListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ownerAttentionItemClass = css`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.65rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.8rem;
  background: #f8fbff;
  padding: 0.7rem;
  &[data-tone='request'] {
    background: #fff7fb;
    border-color: rgba(236, 72, 153, 0.22);
  }
  &[data-tone='release'] {
    background: #eff6ff;
    border-color: rgba(59, 130, 246, 0.22);
  }
  &[data-tone='merge'] {
    background: #fff7ed;
    border-color: rgba(249, 115, 22, 0.24);
  }
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: auto 1fr;
  }
`;

const ownerAttentionIconClass = css`
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: var(--chat-text);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.08);
`;

const ownerAttentionTextClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
`;

const ownerAttentionLabelClass = css`
  font-weight: 900;
  color: var(--chat-text);
`;

const ownerAttentionDetailClass = css`
  color: var(--chat-text);
  opacity: 0.66;
  font-size: 1.1rem;
  font-weight: 800;
`;

const ownerAttentionActionClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: #fff;
  color: var(--chat-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.48rem 0.75rem;
  font: inherit;
  font-size: 1.1rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.08);
  white-space: nowrap;
  &:hover:not(:disabled) {
    background: #f8fbff;
    border-color: var(--ui-border-strong);
  }
  &:disabled {
    cursor: default;
    opacity: 0.55;
  }
  @media (max-width: ${mobileMaxWidth}) {
    grid-column: 2;
    justify-self: start;
  }
`;

export default function VersionStartPanel({
  rootBuildId,
  activeBuildId,
  activeBuildTitle,
  currentUserId,
  rootProjectTitle,
  versionOwnerUsername,
  isOwnBranch,
  isProjectOwner,
  branchName,
  forking,
  canStartVersion,
  canFork,
  versions,
  versionsLoading,
  deletingBranchId,
  pendingCollaborationRequestCount = 0,
  releaseStatus = null,
  publishing = false,
  status,
  onBranchNameChange,
  onStartVersion,
  onLoadVersion,
  onDeleteBranch,
  onFork,
  onOpenTeamPanel,
  onOpenBranchesPanel,
  onUpdatePublishedApp,
  initialScrollTop = 0,
  onScrollTopChange
}: {
  rootBuildId: number;
  activeBuildId: number;
  activeBuildTitle?: string | null;
  currentUserId?: number | null;
  rootProjectTitle?: string | null;
  versionOwnerUsername?: string | null;
  isOwnBranch: boolean;
  isProjectOwner: boolean;
  branchName: string;
  forking: boolean;
  canStartVersion: boolean;
  canFork: boolean;
  versions: BuildVersionSummary[];
  versionsLoading: boolean;
  deletingBranchId?: number | null;
  pendingCollaborationRequestCount?: number;
  releaseStatus?: BuildReleaseStatus | null;
  publishing?: boolean;
  status?: string | null;
  onBranchNameChange: (value: string) => void;
  onStartVersion: () => void;
  onLoadVersion: (version: BuildVersionSummary) => void;
  onDeleteBranch: (target: BuildBranchDeleteTarget) => void;
  onFork: () => void;
  onOpenTeamPanel: () => void;
  onOpenBranchesPanel: () => void;
  onUpdatePublishedApp: () => void;
  initialScrollTop?: number;
  onScrollTopChange?: (scrollTop: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const restoreScrollKeyRef = useRef('');
  const initialScrollTopRef = useRef(initialScrollTop);
  const onScrollTopChangeRef = useRef(onScrollTopChange);
  const scrollSaveTimeoutRef = useRef<number | null>(null);
  const pendingScrollTopRef = useRef<number | null>(null);
  const lastSavedScrollTopRef = useRef(
    normalizeWorkspacePanelScrollTop(initialScrollTop)
  );
  initialScrollTopRef.current = initialScrollTop;
  onScrollTopChangeRef.current = onScrollTopChange;
  const normalizedStatus = String(status || '').trim();
  const ownerLabel = String(versionOwnerUsername || '').trim() || 'Someone';
  const rootProjectTitleText = stripBranchTitleSuffixes(
    String(rootProjectTitle || '')
  );
  const branchNumberById = new Map<number, number>();
  const branchCountByContributor = new Map<string, number>();
  [...versions]
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
    .forEach((version) => {
      const contributorKey = getBranchContributorKey(version);
      const nextCount = (branchCountByContributor.get(contributorKey) || 0) + 1;
      branchCountByContributor.set(contributorKey, nextCount);
      branchNumberById.set(Number(version.id || 0), nextCount);
    });
  const meaningfulStatus =
    normalizedStatus && normalizedStatus !== 'draft' ? normalizedStatus : '';
  const ownBranches = versions.filter(
    (version) =>
      Number(version.contributionContributorId || version.userId || 0) ===
      Number(currentUserId || 0)
  );
  const teamBranches = versions.filter(
    (version) =>
      Number(version.contributionContributorId || version.userId || 0) !==
      Number(currentUserId || 0)
  );
  const activeBranch = versions.find(
    (version) => Number(version.id || 0) === Number(activeBuildId || 0)
  );
  const activeBranchLabel = activeBranch
    ? getBranchFullDisplayTitle(activeBranch)
    : isOwnBranch
      ? 'your branch'
      : `${ownerLabel}'s branch`;
  const versionDescription = canStartVersion
    ? isProjectOwner
      ? 'Try changes in a separate branch, then merge them into main when ready.'
      : 'Name a new branch and build your idea with Lumine. If the owner likes it, they can merge it into the main project.'
    : meaningfulStatus
      ? `${activeBranchLabel} (${meaningfulStatus})`
      : activeBranchLabel;
  const canDeleteActiveBranch =
    rootBuildId > 0 &&
    isOwnBranch &&
    activeBuildId > 0 &&
    canDeleteBuildBranchStatus(status);
  const reviewableTeamBranches = teamBranches.filter((version) =>
    canReviewBuildBranchStatus(version.contributionStatus)
  );
  const mergingBranches = versions.filter(
    (version) => String(version.contributionStatus || '').trim() === 'merging'
  );
  const releaseDiffTotal = getReleaseDiffTotal(releaseStatus);
  const hasUnpublishedChanges = Boolean(
    releaseStatus?.hasUnpublishedChanges
  );

  useEffect(() => {
    const scrollTop = normalizeWorkspacePanelScrollTop(
      initialScrollTopRef.current
    );
    const restoreKey = [
      activeBuildId,
      versions.length,
      canStartVersion ? 1 : 0
    ].join(':');
    if (restoreScrollKeyRef.current === restoreKey) return;
    restoreScrollKeyRef.current = restoreKey;
    const frame = window.requestAnimationFrame(() => {
      const container = scrollRef.current;
      if (!container) return;
      container.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeBuildId, canStartVersion, versions.length]);

  useEffect(() => {
    return () => {
      if (scrollSaveTimeoutRef.current !== null) {
        window.clearTimeout(scrollSaveTimeoutRef.current);
        scrollSaveTimeoutRef.current = null;
      }
      const pendingScrollTop = pendingScrollTopRef.current;
      pendingScrollTopRef.current = null;
      if (pendingScrollTop !== null) {
        commitScrollTop(pendingScrollTop);
      }
    };
  }, []);

  function handlePanelScroll(event: React.UIEvent<HTMLDivElement>) {
    scheduleScrollTopSave(event.currentTarget.scrollTop || 0);
  }

  function scheduleScrollTopSave(scrollTop: number) {
    pendingScrollTopRef.current = scrollTop;
    if (scrollSaveTimeoutRef.current !== null) {
      window.clearTimeout(scrollSaveTimeoutRef.current);
    }
    scrollSaveTimeoutRef.current = window.setTimeout(() => {
      scrollSaveTimeoutRef.current = null;
      const pendingScrollTop = pendingScrollTopRef.current;
      pendingScrollTopRef.current = null;
      if (pendingScrollTop !== null) {
        commitScrollTop(pendingScrollTop);
      }
    }, 160);
  }

  function commitScrollTop(scrollTop: number) {
    const normalizedScrollTop =
      normalizeWorkspacePanelScrollTop(scrollTop);
    if (lastSavedScrollTopRef.current === normalizedScrollTop) return;
    lastSavedScrollTopRef.current = normalizedScrollTop;
    onScrollTopChangeRef.current?.(normalizedScrollTop);
  }

  function getBranchContributorKey(version: BuildVersionSummary) {
    const contributorId = Number(
      version.contributionContributorId || version.userId || 0
    );
    if (contributorId > 0) return `user:${contributorId}`;
    const contributorName = String(version.username || '').trim();
    return contributorName ? `name:${contributorName}` : `branch:${version.id}`;
  }

  function getBranchDisplayTitle(version: BuildVersionSummary) {
    return getBuildBranchDisplayTitle({
      ...version,
      contributionBranchNumber:
        Number(version.contributionBranchNumber || 0) ||
        branchNumberById.get(Number(version.id || 0)) ||
        null,
      rootBuildTitle: rootProjectTitleText
    });
  }

  function getBranchFullDisplayTitle(version: BuildVersionSummary) {
    return formatBranchFullDisplayTitle({
      projectTitle: rootProjectTitleText,
      branchTitle: getBranchDisplayTitle(version)
    });
  }

  function getBranchUser(version: BuildVersionSummary) {
    const userId = Number(
      version.contributionContributorId || version.userId || 0
    );
    return {
      id: userId,
      username: String(version.username || '').trim() || 'Contributor',
      profilePicUrl: String(version.profilePicUrl || '').trim()
    };
  }

  function getBranchUpdatedLabel(version: BuildVersionSummary) {
    const updatedAt = Number(version.updatedAt || 0);
    if (!updatedAt) return '';
    return `Updated ${timeSince(updatedAt)}`;
  }

  function handleBranchCardKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    version: BuildVersionSummary
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onLoadVersion(version);
  }

  function renderBranchSection(title: string, branchList: BuildVersionSummary[]) {
    return (
      <div className={branchSectionClass}>
        <span className={versionLoadTitleClass}>{title}</span>
        {versionsLoading ? (
          <span className={branchEmptyTextClass}>Loading branches...</span>
        ) : branchList.length > 0 ? (
          branchList.map((version) => {
            const branchUser = getBranchUser(version);
            const branchStatus = String(
              version.contributionStatus || ''
            ).trim();
            const branchName = getBranchDisplayTitle(version);
            const updatedLabel = getBranchUpdatedLabel(version);
            const thumbnailUrl = String(version.thumbnailUrl || '').trim();
            const isCurrentBranch =
              Number(version.id || 0) === Number(activeBuildId || 0);
            const canDeleteBranch =
              !isCurrentBranch &&
              Number(version.contributionContributorId || version.userId || 0) ===
                Number(currentUserId || 0) &&
              canDeleteBuildBranchStatus(branchStatus);
            const deleteTarget = {
              id: version.id,
              title: branchName,
              confirmTitle: String(version.title || branchName).trim()
            };
            return (
              <div
                key={version.id}
                className={branchCardClass}
                role="button"
                tabIndex={0}
                onClick={() => onLoadVersion(version)}
                onKeyDown={(event) => handleBranchCardKeyDown(event, version)}
              >
                <BuildPreviewFrame
                  className={branchPreviewClass}
                  thumbnailUrl={thumbnailUrl}
                  alt={`${branchName} preview`}
                  ariaLabel={`${branchName} preview`}
                >
                  {isCurrentBranch ? (
                    <span className={branchPreviewCurrentBadgeClass}>
                      Current
                    </span>
                  ) : null}
                </BuildPreviewFrame>
                <div className={branchCardBodyClass}>
                  <div className={branchCardHeaderClass}>
                    <ProfilePic
                      className={branchAvatarClass}
                      userId={branchUser.id}
                      profilePicUrl={branchUser.profilePicUrl}
                    />
                    <span className={branchLoadTextClass}>
                      <BranchTitleReveal title={branchName} />
                      <span className={branchLoadMetaClass}>
                        <span
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <UsernameText user={branchUser as any} />
                        </span>
                        {updatedLabel ? (
                          <>
                            <span>·</span>
                            <span>{updatedLabel}</span>
                          </>
                        ) : null}
                      </span>
                    </span>
                  </div>
                  <span className={branchLoadBadgeRowClass}>
                    <button
                      type="button"
                      className={versionLoadButtonClass}
                      disabled={isCurrentBranch}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onLoadVersion(version);
                      }}
                    >
                      <Icon icon="eye" />
                      {isCurrentBranch
                        ? 'Viewing'
                        : isProjectOwner
                          ? 'Review'
                          : 'Open'}
                    </button>
                    {branchStatus && branchStatus !== 'draft' ? (
                      <span className={versionLoadStatusClass}>
                        {branchStatus}
                      </span>
                    ) : null}
                  </span>
                </div>
                {canDeleteBranch ? (
                  <button
                    type="button"
                    className={branchDeleteButtonClass}
                    disabled={deletingBranchId === version.id}
                    title="Delete branch"
                    aria-label={`Delete ${branchName}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onDeleteBranch(deleteTarget);
                    }}
                  >
                    <Icon
                      icon={
                        deletingBranchId === version.id
                          ? 'spinner'
                          : 'trash-alt'
                      }
                      pulse={deletingBranchId === version.id}
                    />
                  </button>
                ) : null}
              </div>
            );
          })
        ) : (
          <span className={branchEmptyTextClass}>No branches yet.</span>
        )}
      </div>
    );
  }

  function renderOwnerAttentionPanel() {
    if (!isProjectOwner) return null;
    const pendingRequestCount = Math.max(
      0,
      Math.floor(Number(pendingCollaborationRequestCount) || 0)
    );
    const items: Array<{
      key: string;
      tone: 'request' | 'branch' | 'merge' | 'release';
      icon: string;
      label: string;
      detail: string;
      actionLabel: string;
      actionIcon: string;
      disabled?: boolean;
      onClick: () => void;
    }> = [];

    if (pendingRequestCount > 0) {
      items.push({
        key: 'requests',
        tone: 'request',
        icon: 'comments',
        label: `${formatOwnerAttentionCount(
          pendingRequestCount,
          'join request'
        )}`,
        detail: 'People are asking to join this project.',
        actionLabel: 'Review',
        actionIcon: 'comments',
        onClick: onOpenTeamPanel
      });
    }

    if (reviewableTeamBranches.length > 0) {
      items.push({
        key: 'branches',
        tone: 'branch',
        icon: 'code-branch',
        label: `${formatOwnerAttentionCount(
          reviewableTeamBranches.length,
          'team branch',
          'team branches'
        )}`,
        detail: 'Preview teammate ideas and merge the ones you want.',
        actionLabel: 'Branches',
        actionIcon: 'code-branch',
        onClick: onOpenBranchesPanel
      });
    }

    if (mergingBranches.length > 0) {
      items.push({
        key: 'merging',
        tone: 'merge',
        icon: 'exclamation-triangle',
        label: `${formatOwnerAttentionCount(
          mergingBranches.length,
          'merge'
        )} needs help`,
        detail: 'Ask Lumine to finish the merge conflict cleanup.',
        actionLabel: 'Fix',
        actionIcon: 'sparkles',
        onClick: onOpenBranchesPanel
      });
    }

    if (hasUnpublishedChanges) {
      items.push({
        key: 'release',
        tone: 'release',
        icon: 'cloud-upload-alt',
        label: 'Unpublished changes',
        detail:
          releaseDiffTotal > 0
            ? `${formatOwnerAttentionCount(
                releaseDiffTotal,
                'file change'
              )} waiting for release.`
            : 'Workspace changes are waiting for release.',
        actionLabel: 'Update App',
        actionIcon: 'cloud-upload-alt',
        disabled: publishing,
        onClick: onUpdatePublishedApp
      });
    }

    if (items.length === 0) return null;

    return (
      <div className={ownerAttentionCardClass}>
        <div className={ownerAttentionHeaderClass}>
          <span className={ownerAttentionTitleClass}>
            <Icon icon="exclamation-circle" />
            Needs Attention
          </span>
          <span className={ownerAttentionCountClass}>
            {formatOwnerAttentionCount(items.length, 'item')}
          </span>
        </div>
        <div className={ownerAttentionListClass}>
          {items.map((item) => (
            <div
              key={item.key}
              className={ownerAttentionItemClass}
              data-tone={item.tone}
            >
              <span className={ownerAttentionIconClass}>
                <Icon icon={item.icon as any} />
              </span>
              <span className={ownerAttentionTextClass}>
                <span className={ownerAttentionLabelClass}>
                  {item.label}
                </span>
                <span className={ownerAttentionDetailClass}>
                  {item.detail}
                </span>
              </span>
              <button
                type="button"
                className={ownerAttentionActionClass}
                disabled={item.disabled}
                onClick={item.onClick}
              >
                <Icon icon={item.actionIcon as any} />
                {item.actionLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div
      ref={scrollRef}
      className={versionStartPanelClass}
      onScroll={handlePanelScroll}
    >
      {canDeleteActiveBranch ? (
        <div className={branchPanelActionsClass}>
          <button
            type="button"
            className={branchTopDeleteButtonClass}
            disabled={deletingBranchId === activeBuildId}
            title="Delete branch"
            aria-label={`Delete ${activeBranchLabel}`}
            onClick={() =>
              onDeleteBranch({
                id: activeBuildId,
                title: activeBranchLabel,
                confirmTitle: String(
                  activeBuildTitle || activeBranchLabel
                ).trim()
              })
            }
          >
            <Icon
              icon={
                deletingBranchId === activeBuildId ? 'spinner' : 'trash-alt'
              }
              pulse={deletingBranchId === activeBuildId}
            />
            Delete Branch
          </button>
        </div>
      ) : null}
      {renderOwnerAttentionPanel()}
      <div className={versionStartCardClass}>
        <div className={versionStartTitleClass}>
          <Icon icon="code-branch" />
          Branches
        </div>
        <p className={versionStartTextClass}>{versionDescription}</p>
        {canStartVersion ? (
          <div className={branchStartRowClass}>
            <input
              className={branchNameInputClass}
              value={branchName}
              onChange={(event) => onBranchNameChange(event.target.value)}
              placeholder="What are you making? Pink theme, harder level, new character..."
              maxLength={80}
              aria-label="Branch name"
            />
            <div className={versionStartActionsClass}>
              <GameCTAButton
                variant="success"
                size="md"
                icon="play"
                loading={forking}
                disabled={forking || branchName.trim().length === 0}
                onClick={onStartVersion}
              >
                Start Branch
              </GameCTAButton>
            </div>
          </div>
        ) : null}
        {canFork ? (
          <div className={versionStartActionsClass}>
            <GameCTAButton
              variant="primary"
              size="md"
              icon="code-branch"
              loading={forking}
              disabled={forking}
              onClick={onFork}
            >
              Fork
            </GameCTAButton>
          </div>
        ) : null}
        <p className={branchListHelpClass}>
          Switch between your branches or check out your teammates' branches.
        </p>
        <div className={branchListsClass}>
          {renderBranchSection('Your Branches', ownBranches)}
          {renderBranchSection('Team Branches', teamBranches)}
        </div>
      </div>
    </div>
  );
}

function BranchTitleReveal({ title }: { title: string }) {
  const [titleContext, setTitleContext] = useState<DOMRect | null>(null);
  const titleRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  function showFullTitle() {
    const titleElement = titleRef.current;
    const containerElement = containerRef.current;
    if (!titleElement || !containerElement) return;
    if (!textIsOverflown(titleElement)) {
      setTitleContext(null);
      return;
    }
    setTitleContext(containerElement.getBoundingClientRect());
  }

  return (
    <span
      ref={containerRef}
      className={branchLoadTitleRevealWrapClass}
      onMouseEnter={showFullTitle}
      onMouseLeave={() => setTitleContext(null)}
    >
      <span ref={titleRef} className={branchLoadTitleTextClass}>
        {title}
      </span>
      {titleContext ? (
        <FullTextReveal
          textContext={titleContext}
          text={title}
          style={{ fontSize: '1.1rem', fontWeight: 800 }}
        />
      ) : null}
    </span>
  );
}
