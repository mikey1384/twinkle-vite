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
  const rootObj = useContentState({
    contentType: rootType,
    contentId: rootId
  });
  const navigate = useNavigate();
  const timeStampLink = useMemo(() => {
    let subPath;
    if (contentType === 'pass') {
      if (rootType === 'achievement') {
        subPath = '';
      } else {
        if (rootObj.isTask && rootObj.rootMission) {
          subPath = `/${rootObj.rootMission.missionType}`;
        } else {
          subPath = `/${rootObj.missionType}`;
        }
      }
    } else {
      subPath = `/${id}`;
    }
    return `/${
      contentType === 'pass'
        ? rootType
        : contentType === 'url'
        ? 'link'
        : contentType === 'aiStory'
        ? 'ai-storie'
        : contentType
    }s${subPath}`;
  }, [
    contentType,
    id,
    rootObj.isTask,
    rootObj.missionType,
    rootObj.rootMission,
    rootType
  ]);

  const isXpChange = contentType === 'xpChange';

  const formattedTime = useMemo(() => {
    if (!timeStamp) return '';
    return showActualDate ? formatDate(timeStamp) : timeSince(timeStamp);
  }, [timeStamp, showActualDate]);

  return (
    <ErrorBoundary componentPath="ContentPanel/Heading">
      <header className="heading">
        <ProfilePic
          style={{ width: '3.8rem' }}
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
              className={`timestamp ${
                !isXpChange
                  ? css`
                      cursor: pointer;
                      &:hover {
                        text-decoration: underline;
                      }
                    `
                  : ''
              }`}
              onClick={!isXpChange ? () => navigate(timeStampLink) : undefined}
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
