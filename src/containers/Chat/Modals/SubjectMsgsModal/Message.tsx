import React, { useMemo } from 'react';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import ContentFileViewer from '~/components/ContentFileViewer';
import RichText from '~/components/Texts/RichText';
import { MessageStyle } from '../../Styles';
import { Color } from '~/constants/css';
import {
  chatAuthorClass,
  chatTextClass,
  CHAT_TEXT_LINE_HEIGHT
} from '../../typography';
import moment from 'moment';
import { css } from '@emotion/css';

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
}: {
  content: string;
  displayedThemeColor: string;
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  userId: number;
  username: string;
  profilePicUrl: string;
  thumbUrl: string;
  timeStamp: number;
  isReloadedSubject: boolean;
  onUsermenuShownChange: (isShown: boolean) => void;
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
        className={`${MessageStyle.content} ${css`
          white-space: pre-wrap;
          overflow-wrap: break-word;
          word-break: break-word;
        `}`}
      >
        <div>
          <UsernameText
            className={chatAuthorClass}
            color="#334155"
            textStyle={{ fontWeight: 600 }}
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
            filePath={filePath}
            fileName={fileName}
            fileSize={fileSize}
            thumbUrl={thumbUrl}
            style={{ marginTop: '1rem' }}
          />
        )}
        <div>
          <div className={MessageStyle.messageWrapper}>
            <RichText
              className={chatTextClass}
              lineHeight={CHAT_TEXT_LINE_HEIGHT}
              style={{
                color: isReloadedSubject
                  ? Color[displayedThemeColor]()
                  : undefined,
                fontWeight: isReloadedSubject ? 'bold' : undefined
              }}
            >
              {isReloadedSubject ? 'Brought back the topic' : content}
            </RichText>
          </div>
        </div>
      </div>
    </div>
  );
}
