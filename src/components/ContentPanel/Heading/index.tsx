import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import ProfilePic from '~/components/ProfilePic';
import HeadingText from './HeadingText';
import { useNavigate } from 'react-router-dom';
import { timeSince } from '~/helpers/timeStampHelpers';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import { Content } from '~/types';

Heading.propTypes = {
  action: PropTypes.string.isRequired,
  theme: PropTypes.string.isRequired,
  contentObj: PropTypes.object.isRequired
};
function Heading({
  action,
  theme,
  contentObj,
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

  return (
    <header className="heading">
      <div>
        <ProfilePic
          style={{ width: '6rem' }}
          userId={uploader.id}
          profilePicUrl={uploader.profilePicUrl || ''}
        />
      </div>
      <div
        style={{
          width: '90%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginLeft: '1rem'
        }}
      >
        <div
          style={{
            width: '100%'
          }}
        >
          <span className="title">
            <HeadingText
              action={action}
              contentObj={contentObj}
              rootObj={rootObj}
              theme={theme}
            />
          </span>
          <small
            className={`timestamp ${css`
              cursor: pointer;
              &:hover {
                text-decoration: underline;
              }
            `}`}
            onClick={() => navigate(timeStampLink)}
          >
            {timeStamp ? `(${timeSince(timeStamp)})` : ''}
          </small>
        </div>
      </div>
    </header>
  );
}

export default memo(Heading);
