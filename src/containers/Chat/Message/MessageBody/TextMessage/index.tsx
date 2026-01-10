import React, { memo, useMemo } from 'react';
import Button from '~/components/Button';
import EditTextArea from '~/components/Texts/EditTextArea';
import ErrorBoundary from '~/components/ErrorBoundary';
import RichText from '~/components/Texts/RichText';
import VideoAttachment from './VideoAttachment';
import { Color } from '~/constants/css';
import {
  isValidSpoiler,
  stringIsEmpty,
  isValidYoutubeUrl,
  extractVideoIdFromTwinkleVideoUrl
} from '~/helpers/stringHelpers';
import { isMobile } from '~/helpers';
import { v1 as uuidv1 } from 'uuid';
import Spoiler from '../Spoiler';
import ThinkingIndicator from './ThinkingIndicator';

const deviceIsMobile = isMobile(navigator);

function TextMessage({
  aiThinkingStatus,
  aiThoughtContent,
  aiThoughtIsThinkingHard,
  attachmentHidden,
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
  onHideAttachment,
  subjectId,
  onShowSubjectMsgsModal,
  socketConnected,
  userCanEditThis
}: {
  aiThinkingStatus?: string;
  aiThoughtContent?: string;
  aiThoughtIsThinkingHard?: boolean;
  attachmentHidden?: boolean;
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
  onHideAttachment?: () => void;
  onShowSubjectMsgsModal: (v: any) => void;
  socketConnected: boolean;
  subjectId: number;
  userCanEditThis?: boolean;
}) {
  const isVideoUrl = useMemo(() => {
    if (!extractedUrl) return false;
    return (
      isValidYoutubeUrl(extractedUrl) ||
      !!extractVideoIdFromTwinkleVideoUrl(extractedUrl)
    );
  }, [extractedUrl]);

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
        {isVideoUrl &&
          extractedUrl &&
          messageId &&
          !isAIMessage &&
          !isSpoiler &&
          !attachmentHidden && (
            <VideoAttachment
              style={{ marginTop: '2rem' }}
              messageId={messageId}
              extractedUrl={extractedUrl}
              onHideAttachment={onHideAttachment}
              userCanEditThis={userCanEditThis}
            />
          )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(TextMessage);
