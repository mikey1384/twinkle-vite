import React, {
  memo,
  useContext,
  useCallback,
  useEffect,
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
import Spoiler from '../Spoiler';
import LocalContext from '../../Context';

const deviceIsMobile = isMobile(navigator);

function TextMessage({
  attachmentHidden,
  channelId,
  content,
  displayedThemeColor,
  extractedUrl,
  isNotification,
  isReloadedSubject,
  isSubject,
  forceRefreshForMobile,
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
  isNotification: boolean;
  isReloadedSubject: boolean;
  isSubject: boolean;
  forceRefreshForMobile: () => void;
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

  useEffect(() => {
    if (deviceIsMobile && isEditing) {
      forceRefreshForMobile?.();
    }
  }, [isEditing, forceRefreshForMobile]);

  const isSpoiler = useMemo(() => isValidSpoiler(content), [content]);

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
              {Prefix}
              {isSpoiler ? (
                <Spoiler content={content} />
              ) : stringIsEmpty(content) ? null : (
                <RichText
                  contentId={messageId}
                  contentType="chat"
                  section="main"
                  theme={displayedThemeColor}
                  readMoreHeightFixed
                  style={{
                    marginTop: isSubject ? '0.5rem' : 0,
                    marginBottom: isSubject ? '0.5rem' : 0,
                    color: isNotification ? Color.gray() : undefined
                  }}
                >
                  {(content || '').trim()}
                </RichText>
              )}
            </div>
            {!!isReloadedSubject && !!numMsgs && numMsgs > 0 && (
              <div className={MessageStyle.relatedConversationsButton}>
                <Button
                  filled
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
        {extractedUrl && messageId && !attachmentHidden && !isSpoiler && (
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
