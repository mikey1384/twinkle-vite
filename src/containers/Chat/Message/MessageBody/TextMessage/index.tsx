import React, { memo, useContext, useCallback, useMemo } from 'react';
import Button from '~/components/Button';
import EditTextArea from '~/components/Texts/EditTextArea';
import ErrorBoundary from '~/components/ErrorBoundary';
import LinkAttachment from './LinkAttachment';
import RichText from '~/components/Texts/RichText';
import { Color } from '~/constants/css';
import { isValidSpoiler, stringIsEmpty } from '~/helpers/stringHelpers';
import { socket } from '~/constants/sockets/api';
import { isMobile } from '~/helpers';
import { v1 as uuidv1 } from 'uuid';
import Spoiler from '../Spoiler';
import LocalContext from '../../../Context';
import ThinkingIndicator from './ThinkingIndicator';

const regex =
  /\[.*?\]\((https?:\/\/.*?|www.*?)\)|!\[.*?\]\((https?:\/\/.*?|www.*?)\)/;
const deviceIsMobile = isMobile(navigator);

function TextMessage({
  aiThinkingStatus,
  aiThoughtContent,
  aiThoughtIsThinkingHard,
  attachmentHidden,
  channelId,
  content,
  displayedThemeColor,
  extractedUrl,
  isCielMessage,
  isCallMsg,
  isCurrentlyStreaming,
  isNotification,
  isReloadedSubject,
  isSubject,
  isAIMessage,
  isLastMsg,
  messageId,
  MessageStyle,
  numMsgs,
  isEditing,
  onEditCancel,
  onEditDone,
  subjectId,
  onShowSubjectMsgsModal,
  socketConnected,
  subchannelId,
  thumbUrl,
  userCanEditThis
}: {
  aiThinkingStatus?: string;
  aiThoughtContent?: string;
  aiThoughtIsThinkingHard?: boolean;
  attachmentHidden: boolean;
  channelId: number;
  content: string;
  displayedThemeColor: string;
  extractedUrl: string;
  isCielMessage?: boolean;
  isCallMsg: boolean;
  isCurrentlyStreaming?: boolean;
  isNotification: boolean;
  isReloadedSubject: boolean;
  isSubject: boolean;
  isAIMessage: boolean;
  isLastMsg: boolean;
  messageId: number;
  MessageStyle: any;
  numMsgs: number;
  isEditing: boolean;
  onEditCancel: () => void;
  onEditDone: (content: string) => void;
  onShowSubjectMsgsModal: (v: any) => void;
  socketConnected: boolean;
  subchannelId: number;
  subjectId: number;
  thumbUrl: string;
  userCanEditThis: boolean;
}) {
  const {
    requests: { hideChatAttachment },
    actions: { onHideAttachment }
  } = useContext(LocalContext);

  const isContentContainsLink = useMemo(() => {
    return regex.test(content);
  }, [content]);

  // Show full indicator when AI message has no content yet
  const showFullIndicator = useMemo(
    () => isAIMessage && !content && (isLastMsg || isCurrentlyStreaming),
    [isAIMessage, content, isLastMsg, isCurrentlyStreaming]
  );

  // Show compact indicator when content exists but there's an active tool/thinking status
  const showCompactIndicator = useMemo(() => {
    if (!isAIMessage || !content) return false;

    // Show compact indicator for tool statuses only (not 'responding' which means text is streaming)
    const toolStatuses = [
      'thinking',
      'thinking_hard',
      'searching_web',
      'analyzing_code',
      'saving_file',
      'reading_file',
      'reading',
      'recalling',
      'retrieving_memory'
    ];

    // 'responding' means text is actively streaming - don't show indicator
    if (
      !aiThinkingStatus ||
      aiThinkingStatus === 'responding' ||
      !toolStatuses.includes(aiThinkingStatus)
    ) {
      return false;
    }

    // Show for currently streaming OR last message (status updates continue after streaming ends)
    return isCurrentlyStreaming || isLastMsg;
  }, [isAIMessage, content, isCurrentlyStreaming, isLastMsg, aiThinkingStatus]);

  const Prefix = useMemo(() => {
    let prefix = null;
    if (isSubject) {
      prefix = (
        <span
          style={{
            fontWeight: 'bold',
            color: Color[displayedThemeColor]()
          }}
        >
          Topic:{' '}
        </span>
      );
    }
    if (isReloadedSubject) {
      prefix = (
        <span
          style={{
            fontWeight: 'bold',
            color: Color[displayedThemeColor]()
          }}
        >
          {'Returning Topic: '}
        </span>
      );
    }
    return prefix;
  }, [displayedThemeColor, isReloadedSubject, isSubject]);

  const handleHideAttachment = useCallback(async () => {
    await hideChatAttachment(messageId);
    onHideAttachment({ messageId, channelId, subchannelId });
    socket.emit('hide_message_attachment', {
      channelId,
      messageId,
      subchannelId
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, messageId, subchannelId]);

  const isSpoiler = useMemo(() => isValidSpoiler(content), [content]);
  const richTextId = useMemo(() => {
    if (messageId) return messageId;
    return uuidv1();
  }, [messageId]);

  return (
    <ErrorBoundary componentPath="Message/TextMessage/index">
      <div>
        {isEditing ? (
          <EditTextArea
            allowEmptyText
            contentId={messageId}
            contentType="chat"
            autoFocus
            disabled={!socketConnected}
            rows={2}
            maxRows={deviceIsMobile ? 5 : 10}
            text={content}
            onCancel={onEditCancel}
            onEditDone={onEditDone}
          />
        ) : (
          <>
            <div className={MessageStyle.messageWrapper}>
              <div>{Prefix}</div>
              {showFullIndicator ? (
                <ThinkingIndicator
                  status={aiThinkingStatus}
                  thoughtContent={aiThoughtContent}
                  isStreamingThoughts={
                    !!aiThoughtContent || aiThoughtIsThinkingHard
                  }
                  isThinkingHard={aiThoughtIsThinkingHard}
                />
              ) : isSpoiler ? (
                <Spoiler content={content} />
              ) : stringIsEmpty(content) ? null : (
                <>
                  <RichText
                    isAIMessage={isAIMessage}
                    voice={isCielMessage ? 'nova' : ''}
                    readMoreHeightFixed
                    contentId={richTextId}
                    contentType="chat"
                    section="main"
                    theme={displayedThemeColor}
                    maxLines={isAIMessage ? 5000 : undefined}
                    style={{
                      marginTop: isSubject ? '0.5rem' : 0,
                      marginBottom: isSubject ? '0.5rem' : 0,
                      color:
                        isNotification || isCallMsg ? Color.gray() : undefined
                    }}
                  >
                    {(content || '').trimEnd()}
                  </RichText>
                  {showCompactIndicator && (
                    <ThinkingIndicator status={aiThinkingStatus} compact />
                  )}
                </>
              )}
            </div>
            {!!isReloadedSubject && !!numMsgs && numMsgs > 0 && (
              <div className={MessageStyle.relatedConversationsButton}>
                <Button
                  color="logoBlue"
                  variant="soft"
                  tone="raised"
                  onClick={() => onShowSubjectMsgsModal({ subjectId, content })}
                >
                  Show responses
                </Button>
              </div>
            )}
          </>
        )}
        {!isContentContainsLink &&
          extractedUrl &&
          messageId &&
          !isAIMessage &&
          !attachmentHidden &&
          !isSpoiler && (
            <LinkAttachment
              style={{ marginTop: '2rem' }}
              messageId={messageId}
              defaultThumbUrl={thumbUrl}
              extractedUrl={extractedUrl}
              onHideAttachment={handleHideAttachment}
              userCanEditThis={userCanEditThis}
            />
          )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(TextMessage);
