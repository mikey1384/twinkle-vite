import React, {
  memo,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo
} from 'react';
import Button from '~/components/Button';
import EditTextArea from '~/components/Texts/EditTextArea';
import ErrorBoundary from '~/components/ErrorBoundary';
import LinkAttachment from './LinkAttachment';
import RichText from '~/components/Texts/RichText';
import { Color } from '~/constants/css';
import { isValidSpoiler, stringIsEmpty } from '~/helpers/stringHelpers';
import { socket } from '~/constants/io';
import { isMobile } from '~/helpers';
import { v1 as uuidv1 } from 'uuid';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import Spoiler from '../Spoiler';
import LocalContext from '../../../Context';

const regex =
  /\[.*?\]\((https?:\/\/.*?|www.*?)\)|!\[.*?\]\((https?:\/\/.*?|www.*?)\)/;
const deviceIsMobile = isMobile(navigator);

function TextMessage({
  attachmentHidden,
  channelId,
  content,
  displayedThemeColor,
  extractedUrl,
  isCielMessage,
  isCallMsg,
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
  attachmentHidden: boolean;
  channelId: number;
  content: string;
  displayedThemeColor: string;
  extractedUrl: string;
  isCielMessage?: boolean;
  isCallMsg: boolean;
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

  const [isLoading, setIsLoading] = useState(false);

  const isContentContainsLink = useMemo(() => {
    return regex.test(content);
  }, [content]);

  useEffect(() => {
    let timeout: any;
    if (content) {
      setIsLoading(false);
    }
    if (isAIMessage && !content && isLastMsg) {
      setIsLoading(true);
      timeout = setTimeout(() => {
        setIsLoading(false);
      }, 60000);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [isAIMessage, isLastMsg, content]);

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
              {isLoading ? (
                <div
                  className={css`
                    margin-top: 1.5rem;
                    display: flex;
                    align-items: center;
                    color: ${Color.gray()};
                  `}
                >
                  <Icon icon="spinner" pulse />
                  <span style={{ marginLeft: '0.5rem' }}>Thinking...</span>
                </div>
              ) : isSpoiler ? (
                <Spoiler content={content} />
              ) : stringIsEmpty(content) ? null : (
                <RichText
                  isAIMessage={isAIMessage}
                  voice={isCielMessage ? 'nova' : ''}
                  readMoreHeightFixed
                  contentId={richTextId}
                  contentType="chat"
                  section="main"
                  theme={displayedThemeColor}
                  maxLines={isAIMessage ? 1000 : undefined}
                  style={{
                    marginTop: isSubject ? '0.5rem' : 0,
                    marginBottom: isSubject ? '0.5rem' : 0,
                    color:
                      isNotification || isCallMsg ? Color.gray() : undefined
                  }}
                >
                  {(content || '').trimEnd()}
                </RichText>
              )}
            </div>
            {!!isReloadedSubject && !!numMsgs && numMsgs > 0 && (
              <div className={MessageStyle.relatedConversationsButton}>
                <Button
                  color="logoBlue"
                  skeuomorphic
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
