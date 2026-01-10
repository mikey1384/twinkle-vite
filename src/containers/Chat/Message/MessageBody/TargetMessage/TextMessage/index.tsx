import React, { useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import RichText from '~/components/Texts/RichText';
import VideoThumb from './VideoThumb';
import FileThumb from './FileThumb';
import Spoiler from '../../Spoiler';
import { css } from '@emotion/css';
import moment from 'moment';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import {
  extractVideoIdFromTwinkleVideoUrl,
  fetchURLFromText,
  fetchedVideoCodeFromURL,
  getFileInfoFromFileName,
  isValidSpoiler
} from '~/helpers/stringHelpers';

export default function TextMessage({
  message,
  displayedThemeColor
}: {
  message: any;
  displayedThemeColor: string;
}) {
  const fetchedUrl = useMemo(
    () => fetchURLFromText(message.content),
    [message.content]
  );

  const fileType = useMemo(() => {
    return message.fileName
      ? getFileInfoFromFileName(message.fileName)?.fileType
      : null;
  }, [message.fileName]);

  const extractedVideoId = useMemo(
    () => extractVideoIdFromTwinkleVideoUrl(fetchedUrl),
    [fetchedUrl]
  );

  const videoCode = useMemo(
    () => fetchedVideoCodeFromURL(fetchedUrl),
    [fetchedUrl]
  );

  const showVideoThumb = useMemo(() => {
    return (
      fileType !== 'video' &&
      fileType !== 'audio' &&
      (extractedVideoId || videoCode) &&
      !message.attachmentHidden
    );
  }, [extractedVideoId, videoCode, fileType, message.attachmentHidden]);

  const displayedTime = useMemo(
    () => moment.unix(message?.timeStamp).format('lll'),
    [message?.timeStamp]
  );

  return (
    <div
      style={{
        width: '100%',
        marginTop: '0.5rem',
        marginBottom: '1rem',
        padding: '1rem',
        border: `1px solid ${Color.lightGray()}`,
        background: Color.wellGray(),
        display: 'flex',
        justifyContent: 'space-between',
        borderRadius
      }}
    >
      <div style={{ width: '100%' }}>
        <section style={{ fontWeight: 'bold' }}>
          <UsernameText
            color={Color.black()}
            user={{ id: message.userId, username: message.username }}
          />{' '}
          <small
            style={{
              fontWeight: 'normal',
              fontSize: '1rem',
              color: Color.darkGray()
            }}
          >
            {displayedTime}
          </small>
        </section>
        {isValidSpoiler(message.content) ? (
          <Spoiler content={message.content} />
        ) : (
          <RichText
            contentId={message.id}
            contentType="chat"
            theme={displayedThemeColor}
            readMoreHeightFixed
            style={{ marginTop: '0.5rem' }}
            className={css`
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.3rem;
              }
            `}
          >
            {message.content || message.fileName}
          </RichText>
        )}
      </div>
      {showVideoThumb && (
        <div
          style={{
            width: '25%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <VideoThumb
            isYouTube={!extractedVideoId}
            style={{
              width: '100%',
              height: '100%'
            }}
            messageId={message.id}
            thumbUrl={`https://i.ytimg.com/vi/${videoCode}/mqdefault.jpg`}
            videoUrl={fetchedUrl}
          />
        </div>
      )}
      {fileType && message.fileName && (
        <FileThumb
          filePath={message.filePath}
          fileName={message.fileName}
          fileType={fileType}
          thumbUrl={message.thumbUrl}
          messageId={message.id}
        />
      )}
    </div>
  );
}
