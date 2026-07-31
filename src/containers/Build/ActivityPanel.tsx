import React from 'react';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Icon from '~/components/Icon';
import { useNavigate } from 'react-router-dom';
import TabFilter from './TabFilter';
import type {
  BuildActivitySubtab,
  BuildActivityTab
} from '~/contexts/Build/reducer';
import ActivityPanelRow from './ActivityPanelRow';
import ActivityPanelShell, {
  activityPanelLoadMoreWrapClass,
  activityPanelStateClass
} from './ActivityPanelShell';

const buildActivityTabs: Array<{
  value: BuildActivityTab;
  label: string;
  icon: string;
}> = [
  { value: 'all', label: 'All', icon: 'bell' },
  { value: 'mine', label: 'My Projects', icon: 'rocket-launch' },
  { value: 'collaborating', label: 'Team Builds', icon: 'users' },
  { value: 'favorites', label: 'Favorites', icon: 'star' }
];

const buildActivitySubtabs: Array<{
  value: Exclude<BuildActivitySubtab, 'all'>;
  label: string;
  icon: string;
}> = [
  { value: 'notifications', label: 'Notifications', icon: 'bell' },
  { value: 'branch_updates', label: 'Branch Updates', icon: 'code-branch' }
];

export interface ActivityItem {
  id: number | string;
  type: string;
  activityType: string;
  timeStamp: number;
  activitySourceRank: number;
  activitySortId: number;
  isNotification: boolean;
  targetId: number;
  transferredBranchCount?: number;
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
  branch?: {
    id: number;
    title: string;
    status: string;
  } | null;
  targetBranch?: {
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
    replyTargetUserId?: number | null;
    viewerHasReplied?: boolean;
  } | null;
}

interface ActivityPanelProps {
  activeSubtab: BuildActivitySubtab;
  activeTab: BuildActivityTab;
  activities: ActivityItem[];
  color?: string;
  currentUserId: number;
  error?: string;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  hasNewActivity?: boolean;
  mobileTriggerLabel?: string;
  onLoadMore: () => void;
  onMobileClose?: () => void;
  onMobileOpen?: () => void;
  onRefresh: () => void;
  onSubtabChange: (subtab: Exclude<BuildActivitySubtab, 'all'>) => void;
  onTabChange: (tab: BuildActivityTab) => void;
  variant: 'rail' | 'mobile';
}

export default function ActivityPanel({
  activeSubtab,
  activeTab,
  activities,
  color,
  currentUserId,
  error = '',
  hasMore,
  hasNewActivity = false,
  loading,
  loadingMore,
  mobileTriggerLabel = 'Build Activity',
  onLoadMore,
  onMobileClose,
  onMobileOpen,
  onRefresh,
  onSubtabChange,
  onTabChange,
  variant
}: ActivityPanelProps) {
  const navigate = useNavigate();

  return (
    <ActivityPanelShell
      hasNewActivity={hasNewActivity}
      loading={loading}
      mobileTriggerLabel={mobileTriggerLabel}
      modalKey="BuildActivityMobileModal"
      onMobileClose={onMobileClose}
      onMobileOpen={onMobileOpen}
      onRefresh={onRefresh}
      refreshAriaLabel="Refresh build activity"
      renderContent={renderActivityContent}
      renderTabs={renderTabs}
      title="Build Activity"
      variant={variant}
    />
  );

  function renderTabs() {
    return (
      <>
        <TabFilter
          activeTab={activeTab}
          color={color}
          density="compact"
          onChange={onTabChange}
          tabs={buildActivityTabs}
          wrap
        />
        {activeTab !== 'all' && activeTab !== 'favorites' ? (
          <TabFilter
            activeTab={
              activeSubtab === 'branch_updates' ? activeSubtab : 'notifications'
            }
            color={color}
            density="mini"
            onChange={onSubtabChange}
            tabs={buildActivitySubtabs}
          />
        ) : null}
      </>
    );
  }

  function renderActivityContent({
    closeMobile
  }: {
    closeMobile: () => void;
  }) {
    if (loading && activities.length === 0) {
      return (
        <div className={activityPanelStateClass}>
          <Icon icon="spinner" pulse />
        </div>
      );
    }
    if (error) {
      return <div className={activityPanelStateClass}>{error}</div>;
    }
    if (activities.length === 0) {
      return (
        <div className={activityPanelStateClass}>
          {getEmptyMessage(activeTab, activeSubtab)}
        </div>
      );
    }
    return (
      <>
        {activities.map((activity) => (
          <ActivityPanelRow
            key={activity.id}
            actor={activity.actor}
            currentUserId={currentUserId}
            detail={getActivityDetailText(activity)}
            icon={getActivityIcon(activity)}
            message={getActivityMessage(activity, currentUserId)}
            onClick={() => handleOpenActivity(activity, closeMobile)}
            quoteDetail
            subjectLabel={getSubjectLabel(activity)}
            timeStamp={activity.timeStamp}
          />
        ))}
        {hasMore ? (
          <div className={activityPanelLoadMoreWrapClass}>
            <LoadMoreButton loading={loadingMore} onClick={onLoadMore} />
          </div>
        ) : null}
      </>
    );
  }

  function handleOpenActivity(
    activity: ActivityItem,
    closeMobile: () => void
  ) {
    const buildId = getActivityNavigationBuildId(activity);
    if (!buildId) return;
    closeMobile();
    // Publish/release events point at the live app: favoriters have no
    // workspace access to builds they merely starred.
    if (
      activity.activityType === 'buildPublished' ||
      activity.activityType === 'buildUpdate'
    ) {
      navigate(`/app/${buildId}`);
      return;
    }
    navigate(`/build/${buildId}`, {
      state: getActivityNavigationState(activity)
    });
  }
}

function getActivityNavigationBuildId(activity: ActivityItem) {
  if (
    isBranchMergeTargetActivity(activity) &&
    Number(activity.targetBranch?.id || 0) > 0
  ) {
    return Number(activity.targetBranch?.id || 0);
  }
  if (
    (activity.activityType === 'buildTeamForumThread' ||
      activity.activityType === 'buildTeamForumReply' ||
      activity.activityType === 'buildTeamForumLike' ||
      activity.activityType === 'buildBranchUpdate' ||
      isBranchMergeTargetActivity(activity) ||
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
  if (activeTab === 'all') {
    return 'No build activity yet.';
  }
  if (activeTab === 'favorites') {
    return 'No updates from apps you favorited yet. Favorite apps with the star button to follow their releases here.';
  }
  if (activeSubtab === 'branch_updates') {
    return activeTab === 'collaborating'
      ? 'No branch updates from team members yet.'
      : 'No branch updates from other people yet.';
  }
  if (activeTab === 'collaborating') {
    return 'No activity for team builds yet.';
  }
  return 'No activity for your projects yet.';
}

function getSubjectLabel(activity: ActivityItem) {
  if (
    (activity.activityType === 'buildTeamForumThread' ||
      activity.activityType === 'buildTeamForumReply' ||
      activity.activityType === 'buildTeamForumLike') &&
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

function getActivityMessage(activity: ActivityItem, currentUserId: number) {
  const actorIsCurrentUser = isActivityActorCurrentUser(
    activity,
    currentUserId
  );
  const targetIsCurrentUser =
    Number(activity.targetId || 0) > 0 &&
    Number(activity.targetId || 0) === Number(currentUserId || 0);
  const replyTargetIsCurrentUser =
    Number(activity.forum?.replyTargetUserId || 0) > 0 &&
    Number(activity.forum?.replyTargetUserId || 0) ===
      Number(currentUserId || 0);

  switch (activity.activityType) {
    case 'buildFork':
      return 'forked';
    case 'buildContributor':
      return 'started a branch for';
    case 'buildCollaborator':
      return 'joined the team for';
    case 'buildMemberLeft':
      return 'left the team for';
    case 'buildTeamForumThread':
      return 'started a team topic in';
    case 'buildTeamForumReply':
      if (!actorIsCurrentUser && replyTargetIsCurrentUser) {
        return 'replied to your team forum message in';
      }
      if (!actorIsCurrentUser && targetIsCurrentUser) {
        return 'replied to your team topic in';
      }
      if (!actorIsCurrentUser && activity.forum?.viewerHasReplied) {
        return 'replied to a team topic you joined';
      }
      return 'replied in team forum for';
    case 'buildTeamForumLike':
      if (Number(activity.forum?.replyId || 0) > 0) {
        return 'liked your reply in team forum for';
      }
      return 'liked your team topic in';
    case 'buildUpdate':
      return 'updated';
    case 'buildBranchUpdate':
      return 'updated branch';
    case 'buildBranchReplacedMain': {
      const branchTitle = String(activity.branch?.title || 'branch').trim();
      if (!actorIsCurrentUser && targetIsCurrentUser) {
        return `replaced Main with your branch ${branchTitle} in`;
      }
      return `replaced Main with branch ${branchTitle} in`;
    }
    case 'buildBranchMerged': {
      const branchTitle = String(activity.branch?.title || 'branch').trim();
      const targetBranchTitle = String(
        activity.targetBranch?.title || ''
      ).trim();
      if (!actorIsCurrentUser && targetIsCurrentUser) {
        if (targetBranchTitle) {
          return `merged your branch ${branchTitle} into branch ${targetBranchTitle}`;
        }
        return `merged your branch ${branchTitle} into`;
      }
      if (targetBranchTitle) {
        return `merged branch ${branchTitle} into branch ${targetBranchTitle}`;
      }
      return `merged branch ${branchTitle} into`;
    }
    case 'buildPublished':
      return 'published';
    default:
      return 'updated';
  }
}

function isActivityActorCurrentUser(
  activity: ActivityItem,
  currentUserId: number
) {
  return (
    Number(activity.actor.id || 0) > 0 &&
    Number(activity.actor.id || 0) === Number(currentUserId || 0)
  );
}

function getActivityIcon(activity: ActivityItem) {
  switch (activity.activityType) {
    case 'buildFork':
    case 'buildContributor':
    case 'buildBranchMerged':
    case 'buildBranchReplacedMain':
      return 'code-branch';
    case 'buildCollaborator':
    case 'buildMemberLeft':
      return 'users';
    case 'buildTeamForumThread':
    case 'buildTeamForumReply':
      return 'comments';
    case 'buildTeamForumLike':
      return 'heart';
    case 'buildUpdate':
    case 'buildBranchUpdate':
      return 'cloud-upload-alt';
    default:
      return 'rocket-launch';
  }
}

function getActivityNavigationState(activity: ActivityItem) {
  if (
    activity.activityType === 'buildCollaborator' ||
    activity.activityType === 'buildMemberLeft'
  ) {
    return { openPeoplePanel: true };
  }
  if (
    activity.activityType === 'buildBranchUpdate' ||
    isBranchMergeTargetActivity(activity) ||
    activity.activityType === 'buildContributor'
  ) {
    return { openVersionsPanel: true };
  }
  if (
    activity.activityType === 'buildTeamForumThread' ||
    activity.activityType === 'buildTeamForumReply' ||
    activity.activityType === 'buildTeamForumLike'
  ) {
    return {
      openPeoplePanel: true,
      forumThreadId: Number(activity.forum?.threadId || 0)
    };
  }
  return undefined;
}

function isBranchMergeTargetActivity(activity: ActivityItem) {
  return (
    activity.activityType === 'buildBranchMerged' ||
    activity.activityType === 'buildBranchReplacedMain'
  );
}

function getActivityDetailText(activity: ActivityItem) {
  if (activity.forum?.body) return activity.forum.body;
  if (activity.activityType === 'buildMemberLeft') {
    const count = Number(activity.transferredBranchCount || 0);
    if (count > 0) {
      return `${count} ${
        count === 1 ? 'branch' : 'branches'
      } transferred to the owner.`;
    }
  }
  return '';
}
