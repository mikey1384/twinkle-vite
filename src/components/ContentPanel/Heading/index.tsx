import React, { useMemo, memo } from 'react';
import ProfilePic from '~/components/ProfilePic';
import HeadingText from './HeadingText';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { timeSince, formatDate } from '~/helpers/timeStampHelpers';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import { Content } from '~/types';

function Heading({
  action,
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
  showActualDate?: boolean;
  theme: string;
  contentObj: Content;
}) {
  // Normalize pass types for content state lookup
  const normalizedRootType =
    rootType === 'missionPass' || rootType === 'achievementPass'
      ? 'pass'
      : rootType;
  const rootObj = useContentState({
    contentType: normalizedRootType,
    contentId: rootId
  });
  const navigate = useNavigate();
  // For pass content, contentObj.rootType tells us if it's mission or achievement
  const passRootType = contentObj?.rootType;
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
    if (!timeStamp) return '';
    return showActualDate ? formatDate(timeStamp) : timeSince(timeStamp);
  }, [timeStamp, showActualDate]);

  return (
    <ErrorBoundary componentPath="ContentPanel/Heading">
      <header className="heading">
        <ProfilePic
          style={{ width: '3.8rem', flexShrink: 0 }}
          userId={uploader.id}
          profilePicUrl={uploader.profilePicUrl || ''}
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
            <HeadingText
              action={action}
              contentObj={contentObj}
              rootObj={rootObj}
              theme={theme}
            />
          </span>
          {formattedTime ? (
            <small
              className={`timestamp ${css`
                cursor: pointer;
                &:hover {
                  text-decoration: underline;
                }
              `}`}
              onClick={() => navigate(timeStampLink)}
            >
              {formattedTime}
            </small>
          ) : null}
        </div>
      </header>
    </ErrorBoundary>
  );
}

export default memo(Heading);
