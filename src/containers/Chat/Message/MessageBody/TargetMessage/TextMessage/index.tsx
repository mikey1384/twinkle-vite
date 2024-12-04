import React, { useContext, useMemo, useEffect, useState } from 'react';
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
import LocalContext from '../../../../Context';

export default function TextMessage({
  message,
  displayedThemeColor
}: {
  message: any;
  displayedThemeColor: string;
}) {
  const {
    actions: { onSetEmbeddedUrl }
  } = useContext(LocalContext);

  const [imageUrl, setImageUrl] = useState(message.thumbUrl);
  const fetchedUrl = useMemo(
    () => fetchURLFromText(message.content),
    [message]
  );

  useEffect(() => {
    if (fetchedUrl) {
      onSetEmbeddedUrl({
        contentId: message.id,
        contentType: 'chat',
        url: fetchedUrl
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.content, message.id]);

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

  const embedlyShown = useMemo(() => {
    return (
      fileType !== 'video' &&
      fileType !== 'audio' &&
      (message.thumbUrl || extractedVideoId || fetchedUrl) &&
      !message.attachmentHidden
    );
  }, [
    extractedVideoId,
    fetchedUrl,
    fileType,
    message.attachmentHidden,
    message.thumbUrl
  ]);

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
      {embedlyShown && (extractedVideoId || videoCode) ? (
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
      ) : imageUrl && !(fileType && message.fileName) ? (
        <div
          className={`unselectable ${css`
            width: 25%;
            background: #fff;
            height: 7rem;
            position: relative;
            @media (max-width: ${mobileMaxWidth}) {
              height: 5rem;
            }
          `}`}
        >
          <a
            style={{ width: '100%', height: '100%' }}
            target="_blank"
            rel="noopener noreferrer"
            href={fetchedUrl}
          >
            <section
              className={css`
                position: relative;
                width: 100%;
                height: 100%;
              `}
            >
              <img
                loading="lazy"
                className={css`
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                `}
                src={imageUrl}
                onError={() => setImageUrl('/img/link.png')}
              />
            </section>
          </a>
        </div>
      ) : null}
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
