import React from 'react';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Icon from '~/components/Icon';
import ActivityPanelRow from '~/containers/Build/ActivityPanelRow';
import ActivityPanelShell, {
  activityPanelLoadMoreWrapClass,
  activityPanelStateClass
} from '~/containers/Build/ActivityPanelShell';
import { activityPanelRailClass } from '~/containers/Build/List/ActivityPanels';
import { useNavigate } from 'react-router-dom';

export interface PromptActivityItem {
  id: string;
  activityType:
    | 'promptCommented'
    | 'promptLiked'
    | 'promptCloned'
    | 'promptUsed';
  timeStamp: number;
  activitySourceRank: number;
  activitySortId: number;
  prompt: {
    id: number;
    title: string;
    userId: number;
  };
  actor: {
    id: number;
    username: string;
    profilePicUrl?: string | null;
  };
  detail: string;
}

export default function PromptActivityPanel({
  activities,
  currentUserId,
  error,
  hasMore,
  loading,
  loadingMore,
  onLoadMore,
  onRefresh,
  variant
}: {
  activities: PromptActivityItem[];
  currentUserId: number;
  error: string;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  variant: 'mobile' | 'rail';
}) {
  const navigate = useNavigate();
  const panel = (
    <ActivityPanelShell
      icon="robot"
      loading={loading}
      mobileTriggerLabel="AI Prompt Activity"
      modalKey="PromptActivityMobileModal"
      onRefresh={onRefresh}
      refreshAriaLabel="Refresh AI prompt activity"
      renderContent={renderActivityContent}
      title="AI Prompt Activity"
      variant={variant}
    />
  );

  return variant === 'rail' ? (
    <aside className={activityPanelRailClass}>{panel}</aside>
  ) : (
    panel
  );

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
          No activity on your shared prompts yet.
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
            detail={activity.detail}
            hideActor={activity.activityType === 'promptUsed'}
            icon={getPromptActivityIcon(activity.activityType)}
            message={getPromptActivityMessage(activity.activityType)}
            onClick={() => {
              closeMobile();
              navigate(`/shared-prompts/${activity.prompt.id}`);
            }}
            quoteDetail={activity.activityType === 'promptCommented'}
            subjectLabel={activity.prompt.title}
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
}

function getPromptActivityMessage(
  activityType: PromptActivityItem['activityType']
) {
  switch (activityType) {
    case 'promptCommented':
      return 'commented on';
    case 'promptLiked':
      return 'liked';
    case 'promptCloned':
      return 'cloned';
    case 'promptUsed':
      return 'Used in a conversation';
  }
}

function getPromptActivityIcon(
  activityType: PromptActivityItem['activityType']
) {
  switch (activityType) {
    case 'promptCommented':
      return 'comments';
    case 'promptLiked':
      return 'heart';
    case 'promptCloned':
      return 'clone';
    case 'promptUsed':
      return 'comments';
  }
}
