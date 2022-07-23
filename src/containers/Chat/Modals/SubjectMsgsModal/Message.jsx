import { useMemo } from 'react';
import PropTypes from 'prop-types';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import ContentFileViewer from '~/components/ContentFileViewer';
import LongText from '~/components/Texts/LongText';
import { MessageStyle } from '../../Styles';
import { Color, mobileMaxWidth } from '~/constants/css';
import moment from 'moment';
import { css } from '@emotion/css';

Message.propTypes = {
  id: PropTypes.number,
  content: PropTypes.string,
  displayedThemeColor: PropTypes.string,
  fileName: PropTypes.string,
  filePath: PropTypes.string,
  fileSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isReloadedSubject: PropTypes.number,
  onUsermenuShownChange: PropTypes.func,
  profilePicUrl: PropTypes.string,
  timeStamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  thumbUrl: PropTypes.string,
  userId: PropTypes.number,
  username: PropTypes.string
};

export default function Message({
  content,
  displayedThemeColor,
  id: messageId,
  fileName,
  filePath,
  fileSize,
  userId,
  username,
  profilePicUrl,
  thumbUrl,
  timeStamp,
  isReloadedSubject,
  onUsermenuShownChange
}) {
  const displayedTime = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );
  return (
    <div className={MessageStyle.container}>
      <div className={MessageStyle.profilePic}>
        <ProfilePic
          style={{ width: '100%' }}
          userId={userId}
          profilePicUrl={profilePicUrl}
        />
      </div>
      <div
        className={css`
          width: CALC(100% - 5vw - 3rem);
          display: flex;
          flex-direction: column;
          margin-left: 2rem;
          margin-right: 1rem;
          position: relative;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          word-break: break-word;
          @media (max-width: ${mobileMaxWidth}) {
            margin-left: 1rem;
          }
        `}
      >
        <div>
          <UsernameText
            className={css`
              p {
                font-size: 1.7rem;
              }
              line-height: 1;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.6rem;
              }
            `}
            user={{
              id: userId,
              username: username
            }}
            onMenuShownChange={onUsermenuShownChange}
          />{' '}
          <span className={MessageStyle.timeStamp}>{displayedTime}</span>
        </div>
        {filePath && (
          <ContentFileViewer
            modalOverModal
            contentId={messageId}
            contentType="chat"
            content={content}
            filePath={filePath}
            fileName={fileName}
            fileSize={fileSize}
            thumbUrl={thumbUrl}
            style={{ marginTop: '1rem' }}
          />
        )}
        <div>
          <div className={MessageStyle.messageWrapper}>
            <LongText
              style={{
                color: isReloadedSubject && Color[displayedThemeColor](),
                fontWeight: isReloadedSubject && 'bold'
              }}
            >
              {isReloadedSubject ? 'Brought back the topic' : content}
            </LongText>
          </div>
        </div>
      </div>
    </div>
  );
}
