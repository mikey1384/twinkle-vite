import React, { useContext, useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import RichText from '~/components/Texts/RichText';
import VideoThumb from './VideoThumb';
import FileThumb from './FileThumb';
import Spoiler from '../../Spoiler';
import ReplyTargetSummaryView from '../../ReplyTargetSummaryView';
import useReplyTargetSummary from '../../useReplyTargetSummary';
import { getReplyTargetEntry } from '../../replyTargetSummary';
import { buildCardRendersContent } from '../../BuildCardTarget';
import ReplyTargetCard, { hasReplyTargetCard } from '../../ReplyTargetCard';
import { ReplyTargetEnvironmentContext } from '../../ReplyTargetEnvironment';
import ReplyWebsiteAgentCard from '../../ReplyWebsiteAgentCard';
import ReplyChessPosition from '../../ReplyChessPosition';
import ReplyNestedContext from '../../ReplyNestedContext';
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
  displayedThemeColor,
  showNested = true
}: {
  message: any;
  displayedThemeColor: string;
  showNested?: boolean;
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

  const targetSummary = useReplyTargetSummary(message);
  const isBuildCard = getReplyTargetEntry(message) === 'buildCard';
  const environment = useContext(ReplyTargetEnvironmentContext);
  const showFullCard = hasReplyTargetCard(message, targetSummary, !!environment);

  return (
    <div
      style={{
        width: '100%',
        marginTop: '0.5rem',
        marginBottom: '1rem',
        padding: showFullCard ? '0 0 0 1rem' : '1rem',
        borderStyle: 'solid',
        borderColor: Color.lightGray(),
        borderWidth: showFullCard ? '0 0 0 3px' : '1px',
        background: showFullCard ? 'transparent' : Color.wellGray(),
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
              fontSize: '1.1rem',
              color: Color.darkGray()
            }}
          >
            {displayedTime}
          </small>
        </section>
        {showNested && !showFullCard && <ReplyNestedContext message={message} displayedThemeColor={displayedThemeColor} />}
        {!showFullCard && <ReplyChessPosition message={message} />}
        {showFullCard ? (
          <div style={{ marginTop: '0.7rem' }}>
            <ReplyTargetCard message={message} summary={targetSummary} displayedThemeColor={displayedThemeColor} />
            {isBuildCard && message.content && !buildCardRendersContent(message.rootType) ? (
              <RichText
                contentId={message.id}
                contentType="chat"
                theme={displayedThemeColor}
                readMoreHeightFixed
                style={{ marginTop: '0.7rem' }}
                className={css`
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.3rem;
                  }
                `}
              >
                {message.content}
              </RichText>
            ) : null}
          </div>
        ) : targetSummary ? (
          <ReplyTargetSummaryView
            summary={targetSummary}
            style={{ marginTop: '0.5rem' }}
          >
            {isBuildCard && message.content ? (
              <RichText
                contentId={message.id}
                contentType="chat"
                theme={displayedThemeColor}
                readMoreHeightFixed
                className={css`
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.3rem;
                  }
                `}
              >
                {message.content}
              </RichText>
            ) : null}
          </ReplyTargetSummaryView>
        ) : isValidSpoiler(message.content) ? (
          <div data-quote-own-click>
            <Spoiler content={message.content} />
          </div>
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
        {!showFullCard && <ReplyWebsiteAgentCard key={message.id} message={message} />}
      </div>
      {showVideoThumb && (
        <div
          data-quote-own-click
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
        <div data-quote-own-click style={{ display: 'contents' }}>
          <FileThumb
            filePath={message.filePath}
            fileName={message.fileName}
            fileType={fileType}
            thumbUrl={message.thumbUrl}
            messageId={message.id}
          />
        </div>
      )}
    </div>
  );
}
