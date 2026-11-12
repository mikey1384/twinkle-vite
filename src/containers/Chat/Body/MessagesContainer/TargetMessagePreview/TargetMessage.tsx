import React, { useContext, useMemo } from 'react';
import Icon from '~/components/Icon';
import FileInfo from './FileInfo';
import ReplyTargetSummaryView from '~/containers/Chat/Message/MessageBody/ReplyTargetSummaryView';
import useReplyTargetSummary from '~/containers/Chat/Message/MessageBody/useReplyTargetSummary';
import { getReplyTargetEntry } from '~/containers/Chat/Message/MessageBody/replyTargetSummary';
import ReplyTargetCard, { hasReplyTargetCard } from '~/containers/Chat/Message/MessageBody/ReplyTargetCard';
import { ReplyTargetEnvironmentContext } from '~/containers/Chat/Message/MessageBody/ReplyTargetEnvironment';
import { buildCardRendersContent } from '~/containers/Chat/Message/MessageBody/BuildCardTarget';
import ReplyWebsiteAgentCard from '~/containers/Chat/Message/MessageBody/ReplyWebsiteAgentCard';
import ReplyChessPosition from '~/containers/Chat/Message/MessageBody/ReplyChessPosition';
import ReplyNestedContext from '~/containers/Chat/Message/MessageBody/ReplyNestedContext';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import moment from 'moment';

export default function TargetMessage({
  onClose,
  replyTarget
}: {
  onClose: () => void;
  replyTarget: any;
}) {
  const fileType = useMemo(() => {
    return replyTarget.fileName
      ? getFileInfoFromFileName(replyTarget.fileName)?.fileType
      : '';
  }, [replyTarget.fileName]);
  const hasFileAttachment = useMemo(
    () => fileType && replyTarget.fileName,
    [fileType, replyTarget.fileName]
  );
  const displayedTimeStamp = useMemo(
    () => moment.unix(replyTarget.timeStamp).format('lll'),
    [replyTarget.timeStamp]
  );

  const targetSummary = useReplyTargetSummary(replyTarget);
  const showsOwnContent = getReplyTargetEntry(replyTarget) === 'buildCard';
  const environment = useContext(ReplyTargetEnvironmentContext);
  const showFullCard = hasReplyTargetCard(replyTarget, targetSummary, !!environment);

  return (
    <div style={{ width: '100%' }}>
      <button
        type="button"
        aria-label="Cancel reply"
        style={{
          position: 'absolute',
          right: '0.6rem',
          top: '0.6rem',
          width: '3rem',
          height: '3rem',
          border: 0,
          background: 'transparent',
          color: Color.darkGray(),
          cursor: 'pointer',
          zIndex: 1
        }}
        onClick={onClose}
      >
        <Icon icon="times" size="lg" />
      </button>
      <div
        style={{
          padding: showFullCard ? '0 0 0 1rem' : '1rem',
          width: '100%',
          maxHeight: 'min(28rem, 35vh)',
          background: showFullCard ? 'transparent' : Color.targetGray(),
          borderLeft: showFullCard ? `3px solid ${Color.lightGray()}` : undefined,
          borderRadius,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <div style={targetSummary || showFullCard ? { width: '100%', minWidth: 0 } : undefined}>
          <div>
            <p
              style={{
                fontWeight: 'bold',
                display: 'inline',
                color: Color.black()
              }}
            >
              {replyTarget.username}
            </p>{' '}
            <span
              className={css`
                font-size: 1.1rem;
                color: ${Color.gray()};
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.1rem;
                }
              `}
            >
              {displayedTimeStamp}
            </span>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            {!showFullCard && <ReplyNestedContext message={replyTarget} displayedThemeColor={environment?.displayedThemeColor || 'logoBlue'} />}
            {!showFullCard && <ReplyChessPosition message={replyTarget} />}
            {showFullCard ? (
              <>
                <ReplyTargetCard message={replyTarget} summary={targetSummary} displayedThemeColor={environment?.displayedThemeColor || 'logoBlue'} />
                {showsOwnContent && replyTarget.content && !buildCardRendersContent(replyTarget.rootType) ? (
                  <div>{replyTarget.content}</div>
                ) : null}
              </>
            ) : targetSummary ? (
              <ReplyTargetSummaryView summary={targetSummary}>
                {showsOwnContent && replyTarget.content ? (
                  <div>{replyTarget.content}</div>
                ) : null}
              </ReplyTargetSummaryView>
            ) : (
              replyTarget.content || replyTarget.fileName
            )}
            {!showFullCard && <ReplyWebsiteAgentCard key={replyTarget.id} message={replyTarget} />}
          </div>
        </div>
        {hasFileAttachment ? (
          <FileInfo
            filePath={replyTarget.filePath}
            fileType={fileType}
            fileName={replyTarget.fileName}
            thumbUrl={replyTarget.thumbUrl}
          />
        ) : null}
      </div>
    </div>
  );
}
