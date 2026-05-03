import React, { useState } from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import ProfilePic from '~/components/ProfilePic';
import { mobileMaxWidth } from '~/constants/css';
import { timeSinceShort } from '~/helpers/timeStampHelpers';
import { useNavigate } from 'react-router-dom';
import BuildTabFilter from './BuildTabFilter';

const buildActivityRailBreakpoint = '1180px';
export type BuildActivityTab = 'mine' | 'collaborating';
export type BuildActivitySubtab = 'notifications' | 'branch_updates';

const buildActivityTabs: Array<{
  value: BuildActivityTab;
  label: string;
  icon: string;
}> = [
  { value: 'mine', label: 'My Projects', icon: 'rocket-launch' },
  { value: 'collaborating', label: 'Collaborating', icon: 'users' }
];

const buildActivitySubtabs: Array<{
  value: BuildActivitySubtab;
  label: string;
  icon: string;
}> = [
  { value: 'notifications', label: 'Notifications', icon: 'bell' },
  { value: 'branch_updates', label: 'Branch Updates', icon: 'code-branch' }
];

export interface BuildActivityItem {
  id: number | string;
  type: string;
  activityType: string;
  timeStamp: number;
  isNotification: boolean;
  targetId: number;
  build: {
    id: number;
    title: string;
    description?: string | null;
    userId: number;
    isPublic: boolean;
  };
  actor: {
    id: number;
    username: string;
    profilePicUrl?: string | null;
  };
  request?: {
    id: number;
    message?: string;
    status?: string;
  } | null;
  invite?: {
    id: number;
    status: string;
    acceptedAt?: number;
    declinedAt?: number;
    revokedAt?: number;
  } | null;
  branch?: {
    id: number;
    title: string;
    status: string;
  } | null;
  forum?: {
    threadId: number;
    replyId?: number | null;
    title: string;
    body: string;
    threadUserId: number;
  } | null;
}

interface BuildActivityPanelProps {
  activeSubtab: BuildActivitySubtab;
  activeTab: BuildActivityTab;
  activities: BuildActivityItem[];
  color?: string;
  currentUserId: number;
  error?: string;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  onSubtabChange: (subtab: BuildActivitySubtab) => void;
  onTabChange: (tab: BuildActivityTab) => void;
  variant: 'rail' | 'mobile';
}

const panelClass = css`
  display: flex;
  flex-direction: column;
  max-height: calc(
    100dvh - var(--build-activity-rail-top, 6.5rem) -
      var(--build-activity-rail-bottom-gap, 2rem)
  );
  border: 1px solid var(--ui-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
  overflow: hidden;
`;

const headerClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid rgba(65, 140, 235, 0.16);
`;

const titleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  color: var(--chat-text);
  font-size: 1.15rem;
  font-weight: 900;
`;

const refreshButtonClass = css`
  width: 2.1rem;
  height: 2.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(65, 140, 235, 0.24);
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.08);
  color: #1d4ed8;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const listClass = css`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const mobilePanelClass = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: min(86dvh, 58rem);
  max-height: calc(100dvh - 7rem);

  @media (max-width: ${mobileMaxWidth}) {
    height: calc(100dvh - 6rem);
    max-height: calc(100dvh - 6rem);
  }
`;

const mobileListClass = css`
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const rowClass = css`
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.7rem;
  padding: 0.9rem 1rem;
  border: 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: transparent;
  color: var(--chat-text);
  text-align: left;
  cursor: pointer;

  &:hover {
    background: rgba(65, 140, 235, 0.06);
  }

  &:last-child {
    border-bottom: 0;
  }
`;

const iconBubbleClass = css`
  width: 2.35rem;
  height: 2.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.12);
  color: #1d4ed8;
  border: 1px solid rgba(65, 140, 235, 0.2);
`;

const rowBodyClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const rowMessageClass = css`
  color: var(--chat-text);
  font-size: 0.96rem;
  font-weight: 800;
  line-height: 1.32;
  overflow-wrap: anywhere;
`;

const actorNameClass = css`
  color: #1d4ed8;
  font-weight: 900;
`;

const buildTitleClass = css`
  color: var(--chat-text);
  font-size: 0.86rem;
  font-weight: 800;
  opacity: 0.68;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const rowMetaClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  color: var(--chat-text);
  font-size: 0.78rem;
  font-weight: 800;
  opacity: 0.64;
`;

const statusPillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.48rem;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.12);
  color: #166534;
  border: 1px solid rgba(34, 197, 94, 0.2);
  opacity: 1;
`;

const requestMessageClass = css`
  color: var(--chat-text);
  font-size: 0.82rem;
  line-height: 1.35;
  opacity: 0.74;
  overflow-wrap: anywhere;
`;

const stateClass = css`
  min-height: 9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.4rem;
  color: var(--chat-text);
  font-weight: 800;
  opacity: 0.72;
  text-align: center;
`;

const loadMoreWrapClass = css`
  padding: 0.85rem 1rem 1rem;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
`;

const mobileTriggerClass = css`
  width: 100%;
  margin: -0.5rem 0 1.1rem;
  display: none;
  @media (max-width: ${buildActivityRailBreakpoint}) {
    display: flex;
    justify-content: flex-end;
  }
  @media (max-width: ${mobileMaxWidth}) {
    margin-top: -0.7rem;
    justify-content: stretch;

    > button {
      width: 100%;
    }
  }
`;

export default function BuildActivityPanel({
  activeSubtab,
  activeTab,
  activities,
  color,
  currentUserId,
  error = '',
  hasMore,
  loading,
  loadingMore,
  onLoadMore,
  onRefresh,
  onSubtabChange,
  onTabChange,
  variant
}: BuildActivityPanelProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (variant === 'mobile') {
    return (
      <>
        <div className={mobileTriggerClass}>
          <GameCTAButton
            variant="neutral"
            size="md"
            icon="bell"
            onClick={() => setMobileOpen(true)}
          >
            Build Activity{activities.length ? ` · ${activities.length}` : ''}
          </GameCTAButton>
        </div>
        {mobileOpen ? (
          <Modal
            modalKey="BuildActivityMobileModal"
            isOpen
            onClose={() => setMobileOpen(false)}
            title="Build Activity"
            size="md"
            bodyPadding={0}
          >
            <div className={mobilePanelClass}>
              {renderTabs()}
              <div className={mobileListClass}>{renderActivityContent()}</div>
            </div>
          </Modal>
        ) : null}
      </>
    );
  }

  return (
    <section className={panelClass}>
      <div className={headerClass}>
        <div className={titleClass}>
          <Icon icon="bell" />
          Build Activity
        </div>
        <button
          type="button"
          className={refreshButtonClass}
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh build activity"
          title="Refresh"
        >
          <Icon icon={loading ? 'spinner' : 'sync'} pulse={loading} />
        </button>
      </div>
      {renderTabs()}
      <div className={listClass}>{renderActivityContent()}</div>
    </section>
  );

  function renderTabs() {
    return (
      <>
        <BuildTabFilter
          activeTab={activeTab}
          color={color}
          density="compact"
          onChange={onTabChange}
          tabs={buildActivityTabs}
        />
        <BuildTabFilter
          activeTab={activeSubtab}
          color={color}
          density="mini"
          onChange={onSubtabChange}
          tabs={buildActivitySubtabs}
        />
      </>
    );
  }

  function renderActivityContent() {
    if (loading && activities.length === 0) {
      return (
        <div className={stateClass}>
          <Icon icon="spinner" pulse />
        </div>
      );
    }
    if (error) {
      return <div className={stateClass}>{error}</div>;
    }
    if (activities.length === 0) {
      return (
        <div className={stateClass}>
          {getEmptyMessage(activeTab, activeSubtab)}
        </div>
      );
    }
    return (
      <>
        {activities.map((activity) => (
          <button
            type="button"
            key={activity.id}
            className={rowClass}
            onClick={() => handleOpenActivity(activity)}
          >
            {activity.actor.id ? (
              <ProfilePic
                userId={activity.actor.id}
                profilePicUrl={activity.actor.profilePicUrl || undefined}
                size="2.35rem"
              />
            ) : (
              <span className={iconBubbleClass}>
                <Icon icon={getActivityIcon(activity)} />
              </span>
            )}
            <span className={rowBodyClass}>
              <span className={rowMessageClass}>
                <span className={actorNameClass}>
                  {getActivityActorLabel(activity, currentUserId)}
                </span>{' '}
                {getActivityMessage(activity, currentUserId)}
              </span>
              <span className={buildTitleClass}>{getSubjectLabel(activity)}</span>
              {getActivityDetailText(activity) ? (
                <span className={requestMessageClass}>
                  &quot;{truncateActivityText(getActivityDetailText(activity))}&quot;
                </span>
              ) : null}
              <span className={rowMetaClass}>
                <Icon icon={getActivityIcon(activity)} />
                <span>{timeSinceShort(activity.timeStamp)}</span>
                {getActivityStatus(activity, currentUserId) ? (
                  <span className={statusPillClass}>
                    {getActivityStatus(activity, currentUserId)}
                  </span>
                ) : null}
              </span>
            </span>
          </button>
        ))}
        {hasMore ? (
          <div className={loadMoreWrapClass}>
            <LoadMoreButton loading={loadingMore} onClick={onLoadMore} />
          </div>
        ) : null}
      </>
    );
  }

  function handleOpenActivity(activity: BuildActivityItem) {
    const buildId = getActivityNavigationBuildId(activity);
    if (!buildId) return;
    setMobileOpen(false);
    navigate(`/build/${buildId}`, {
      state: getActivityNavigationState(activity)
    });
  }
}

function getActivityNavigationBuildId(activity: BuildActivityItem) {
  if (
    (activity.activityType === 'buildTeamForumThread' ||
      activity.activityType === 'buildTeamForumReply' ||
      activity.activityType === 'buildBranchUpdate' ||
      activity.activityType === 'buildContributor') &&
    Number(activity.branch?.id || 0) > 0
  ) {
    return Number(activity.branch?.id || 0);
  }
  return Number(activity.build.id || 0);
}

function getEmptyMessage(
  activeTab: BuildActivityTab,
  activeSubtab: BuildActivitySubtab
) {
  if (activeSubtab === 'branch_updates') {
    return activeTab === 'collaborating'
      ? 'No branch updates from collaborators yet.'
      : 'No branch updates from other people yet.';
  }
  if (activeTab === 'collaborating') {
    return 'No activity for collaborating projects yet.';
  }
  return 'No activity for your projects yet.';
}

function getSubjectLabel(activity: BuildActivityItem) {
  if (
    (activity.activityType === 'buildTeamForumThread' ||
      activity.activityType === 'buildTeamForumReply') &&
    activity.forum?.title
  ) {
    const projectTitle = activity.build.title || 'Untitled Build';
    if (activity.branch?.title) {
      return `${activity.forum.title} · ${activity.branch.title} · ${projectTitle}`;
    }
    return `${activity.forum.title} · ${projectTitle}`;
  }
  if (activity.activityType === 'buildBranchUpdate' && activity.branch?.title) {
    const projectTitle = activity.build.title || 'Untitled Build';
    return `${activity.branch.title} · ${projectTitle}`;
  }
  return activity.build.title || 'Untitled Build';
}

function getActivityActorLabel(
  activity: BuildActivityItem,
  currentUserId: number
) {
  if (isActivityActorCurrentUser(activity, currentUserId)) return 'You';
  return activity.actor.username || 'Someone';
}

function getActivityMessage(activity: BuildActivityItem, currentUserId: number) {
  const actorIsCurrentUser = isActivityActorCurrentUser(
    activity,
    currentUserId
  );
  const targetIsCurrentUser =
    Number(activity.targetId || 0) > 0 &&
    Number(activity.targetId || 0) === Number(currentUserId || 0);

  switch (activity.activityType) {
    case 'buildCollaborationRequest':
      return actorIsCurrentUser
        ? 'asked to collaborate on'
        : 'wants to collaborate on';
    case 'buildCollaborationRequestAccepted':
      if (actorIsCurrentUser) return 'accepted a collaboration request for';
      return targetIsCurrentUser
        ? 'accepted your collaboration request for'
        : 'accepted a collaboration request for';
    case 'buildContributionInvite':
      if (actorIsCurrentUser) return 'invited someone to collaborate on';
      return targetIsCurrentUser
        ? 'invited you to collaborate on'
        : 'sent a collaboration invite for';
    case 'buildFork':
      return 'forked';
    case 'buildContributor':
      return 'started a branch for';
    case 'buildCollaborator':
      return 'joined the team for';
    case 'buildTeamForumThread':
      return 'started a team topic in';
    case 'buildTeamForumReply':
      if (!actorIsCurrentUser && targetIsCurrentUser) {
        return 'replied to your team topic in';
      }
      return 'replied in team forum for';
    case 'buildUpdate':
      return 'updated';
    case 'buildBranchUpdate':
      return 'updated branch';
    case 'buildPublished':
      return 'published';
    case 'like':
      return 'liked';
    case 'comment':
      return 'commented on';
    default:
      return 'updated';
  }
}

function isActivityActorCurrentUser(
  activity: BuildActivityItem,
  currentUserId: number
) {
  return (
    Number(activity.actor.id || 0) > 0 &&
    Number(activity.actor.id || 0) === Number(currentUserId || 0)
  );
}

function getActivityIcon(activity: BuildActivityItem) {
  switch (activity.activityType) {
    case 'buildCollaborationRequest':
      return 'user-plus';
    case 'buildCollaborationRequestAccepted':
      return 'check-circle';
    case 'buildContributionInvite':
      return 'users';
    case 'buildFork':
    case 'buildContributor':
      return 'code-branch';
    case 'buildCollaborator':
      return 'users';
    case 'buildTeamForumThread':
    case 'buildTeamForumReply':
      return 'comments';
    case 'buildUpdate':
    case 'buildBranchUpdate':
      return 'cloud-upload-alt';
    case 'like':
      return 'heart';
    case 'comment':
      return 'comments';
    default:
      return 'rocket-launch';
  }
}

function getActivityStatus(activity: BuildActivityItem, currentUserId: number) {
  const targetIsCurrentUser =
    Number(activity.targetId || 0) > 0 &&
    Number(activity.targetId || 0) === Number(currentUserId || 0);
  if (activity.invite?.status && activity.invite.status !== 'pending') {
    return activity.invite.status;
  }
  if (
    activity.activityType === 'buildCollaborationRequest' &&
    activity.request?.status === 'pending' &&
    targetIsCurrentUser
  ) {
    return 'Review';
  }
  if (activity.invite?.status === 'pending' && targetIsCurrentUser) {
    return 'Respond';
  }
  return '';
}

function getActivityNavigationState(activity: BuildActivityItem) {
  if (
    activity.activityType === 'buildCollaborationRequest' ||
    activity.activityType === 'buildCollaborationRequestAccepted' ||
    activity.activityType === 'buildContributionInvite' ||
    activity.activityType === 'buildCollaborator'
  ) {
    return { openPeoplePanel: true };
  }
  if (
    activity.activityType === 'buildBranchUpdate' ||
    activity.activityType === 'buildContributor'
  ) {
    return { openVersionsPanel: true };
  }
  if (
    activity.activityType === 'buildTeamForumThread' ||
    activity.activityType === 'buildTeamForumReply'
  ) {
    return {
      openPeoplePanel: true,
      forumThreadId: Number(activity.forum?.threadId || 0)
    };
  }
  return undefined;
}

function getActivityDetailText(activity: BuildActivityItem) {
  if (activity.forum?.body) return activity.forum.body;
  if (activity.request?.message) return activity.request.message;
  return '';
}

function truncateActivityText(value: string) {
  const normalized = String(value || '').trim();
  if (normalized.length <= 90) return normalized;
  return `${normalized.slice(0, 87)}...`;
}
