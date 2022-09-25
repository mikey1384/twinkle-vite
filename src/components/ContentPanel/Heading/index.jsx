import { memo } from 'react';
import PropTypes from 'prop-types';
import ProfilePic from '~/components/ProfilePic';
import { useNavigate } from 'react-router-dom';
import { timeSince } from '~/helpers/timeStampHelpers';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import useHeadingText from './useHeadingText';

Heading.propTypes = {
  action: PropTypes.string.isRequired,
  theme: PropTypes.string,
  contentObj: PropTypes.shape({
    id: PropTypes.number,
    byUser: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
    commentId: PropTypes.number,
    contentType: PropTypes.string,
    replyId: PropTypes.number,
    rootObj: PropTypes.object,
    rootId: PropTypes.number,
    rootType: PropTypes.string,
    subjectId: PropTypes.number,
    targetObj: PropTypes.object,
    timeStamp: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      .isRequired,
    uploader: PropTypes.object
  }).isRequired
};

function Heading({
  action,
  theme,
  contentObj,
  contentObj: { contentType, id, rootType, rootId, timeStamp, uploader = {} }
}) {
  const rootObj = useContentState({
    contentType: rootType,
    contentId: rootId
  });
  const navigate = useNavigate();
  const HeadingText = useHeadingText({
    action,
    contentObj,
    rootObj,
    theme
  });

  return (
    <header className="heading">
      <div>
        <ProfilePic
          style={{ width: '6rem' }}
          userId={uploader.id}
          profilePicUrl={uploader.profilePicUrl}
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
          <span className="title">{HeadingText}</span>
          <small
            className={`timestamp ${css`
              cursor: pointer;
              &:hover {
                text-decoration: underline;
              }
            `}`}
            onClick={() =>
              navigate(
                `/${
                  contentType === 'pass'
                    ? 'mission'
                    : contentType === 'url'
                    ? 'link'
                    : contentType
                }s/${contentType === 'pass' ? rootObj.id : id}`
              )
            }
          >
            {timeStamp ? `(${timeSince(timeStamp)})` : ''}
          </small>
        </div>
      </div>
    </header>
  );
}

export default memo(Heading);
