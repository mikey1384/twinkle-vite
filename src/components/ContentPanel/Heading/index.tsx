import React, { useMemo, memo } from 'react';
import ProfilePic from '~/components/ProfilePic';
import HeadingText from './Text';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Link } from 'react-router-dom';
import { timeSince, formatDate } from '~/helpers/timeStampHelpers';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import { Content } from '~/types';

function Heading({
  action,
  compactFeed,
  feedActivityType,
  feedTimeStamp,
  feedUploader,
  theme,
  contentObj,
  showActualDate,
  contentObj: {
    contentType,
    id,
    rootType = '',
    rootId = 0,
    timeStamp,
    uploader = { username: '', id: 0 }
  }
}: {
  action: string;
  compactFeed?: boolean;
  feedActivityType?: string | null;
  feedTimeStamp?: number | string | null;
  feedUploader?: any;
  showActualDate?: boolean;
  theme: string;
  contentObj: Content;
}) {
  const normalizedRootType =
    rootType === 'missionPass' || rootType === 'achievementPass'
      ? 'pass'
      : rootType;
  const rootObj = useContentState({
    contentType: normalizedRootType,
    contentId: rootId
  });
  // For pass content, contentObj.rootType tells us if it's mission or achievement
  const passRootType = contentObj?.rootType;
  const feedActivityHasActor = Boolean(feedActivityType && feedUploader?.id);
  const displayedFeedActivityType = feedActivityHasActor
    ? feedActivityType
    : null;
  const displayedTimeStamp =
    displayedFeedActivityType && feedTimeStamp ? feedTimeStamp : timeStamp;
  const headingUser = displayedFeedActivityType ? feedUploader : uploader;
  const timeStampLink = useMemo(() => {
    if (contentType === 'pass') {
      const isAchievement = passRootType === 'achievement';
      return isAchievement
        ? `/achievement-unlocks/${id}`
        : `/mission-passes/${id}`;
    }
    if (contentType === 'xpChange') {
      return `/daily-rewards/${id}`;
    }
    if (contentType === 'sharedTopic') {
      return `/shared-prompts/${id}`;
    }
    if (contentType === 'dailyReflection') {
      return `/daily-reflections/${id}`;
    }
    if (contentType === 'build') {
      return `/app/${id}`;
    }
    const subPath = `/${id}`;
    return `/${
      contentType === 'url'
        ? 'link'
        : contentType === 'aiStory'
          ? 'ai-storie'
          : contentType
    }s${subPath}`;
  }, [contentType, id, passRootType]);

  const formattedTime = useMemo(() => {
    if (!displayedTimeStamp) return '';
    return showActualDate
      ? formatDate(displayedTimeStamp)
      : timeSince(displayedTimeStamp);
  }, [displayedTimeStamp, showActualDate]);

  return (
    <ErrorBoundary componentPath="ContentPanel/Heading">
      <header className={`heading${compactFeed ? ' compact-feed' : ''}`}>
        <ProfilePic
          style={{ width: '3.8rem', flexShrink: 0 }}
          userId={headingUser.id}
          profilePicUrl={headingUser.profilePicUrl || ''}
          preferProvidedProfilePicUrl={Boolean(displayedFeedActivityType)}
        />
        <div
          className={css`
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
          `}
        >
          <span className="title">
            <span
              data-feed-card-interactive={compactFeed ? 'true' : undefined}
            >
              <HeadingText
                action={action}
                compactFeed={compactFeed}
                contentObj={contentObj}
                feedActivityType={displayedFeedActivityType}
                feedUploader={feedUploader}
                rootObj={rootObj}
                theme={theme}
              />
            </span>
          </span>
          {formattedTime ? (
            <small
              className={`timestamp ${css`
                cursor: pointer;
                a {
                  color: inherit;
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
              `}`}
            >
              <Link
                to={timeStampLink}
                onClick={(event) => event.stopPropagation()}
              >
                {formattedTime}
              </Link>
            </small>
          ) : null}
        </div>
      </header>
    </ErrorBoundary>
  );
}

export default memo(Heading);
