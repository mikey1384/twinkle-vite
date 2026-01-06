import React, { useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import RichText from '~/components/Texts/RichText';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import {
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID,
  BookmarkView
} from '~/constants/defaultValues';

export default function BookmarkModal({
  channelId,
  isCielChat,
  isCurrentlyBookmarked,
  onHide,
  bookmark,
  displayedThemeColor,
  bookmarkView
}: {
  channelId: number;
  isCielChat: boolean;
  isCurrentlyBookmarked: boolean;
  onHide: () => void;
  bookmark: any;
  displayedThemeColor: string;
  bookmarkView: BookmarkView;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const successColor = useKeyContext((v) => v.theme.success.color);
  const bookmarkChatMessage = useAppContext(
    (v) => v.requestHelpers.bookmarkChatMessage
  );
  const unbookmarkChatMessage = useAppContext(
    (v) => v.requestHelpers.unbookmarkChatMessage
  );
  const onAddBookmarkedMessage = useChatContext(
    (v) => v.actions.onAddBookmarkedMessage
  );
  const onRemoveBookmarkedMessage = useChatContext(
    (v) => v.actions.onRemoveBookmarkedMessage
  );
  const onSetReplyTarget = useChatContext((v) => v.actions.onSetReplyTarget);
  const [addingBookmark, setAddingBookmark] = useState(false);
  const [removingBookmark, setRemovingBookmark] = useState(false);
  const isAIMessage = [ZERO_TWINKLE_ID, CIEL_TWINKLE_ID].includes(
    bookmark.userId
  );
  const replyUsername = isAIMessage
    ? bookmark.userId === CIEL_TWINKLE_ID
      ? 'Ciel'
      : 'Zero'
    : bookmark.username;

  return (
    <Modal modalKey="BookmarkModal" isOpen onClose={onHide} hasHeader={false} bodyPadding={0}>
      <LegacyModalLayout>
        <main>
          <div style={{ height: '100%', width: '100%', padding: '3rem 1rem' }}>
            <RichText
              isAIMessage={isAIMessage}
              voice={isAIMessage ? (isCielChat ? 'nova' : '') : ''}
              theme={displayedThemeColor}
              contentType="chat"
              contentId={bookmark.id}
              section="main"
            >
              {(bookmark.content || '').trimEnd()}
            </RichText>
          </div>
        </main>
        <footer style={{ justifyContent: 'space-between' }}>
          <div>
            {isCurrentlyBookmarked && (
              <Button
                loading={removingBookmark}
                color="red"
                variant="ghost"
                onClick={handleRemoveBookmark}
              >
                <Icon icon={['far', 'bookmark']} />
                <span style={{ marginLeft: '1rem' }}>Remove</span>
              </Button>
            )}
          </div>
          <div style={{ display: 'flex' }}>
            {!isCurrentlyBookmarked && (
              <Button
                style={{ marginRight: '0.7rem' }}
                loading={addingBookmark}
                variant="ghost"
                color={doneColor}
                onClick={handleAddBookmark}
              >
                <Icon icon="bookmark" />
                <span style={{ marginLeft: '1rem' }}>Bookmark</span>
              </Button>
            )}
            <Button color={successColor} onClick={handleReplyClick}>
              <Icon icon="comment-alt" />
              <span style={{ marginLeft: '1rem' }}>Reply</span>
            </Button>
            <Button
              style={{ marginLeft: '0.7rem' }}
              variant="ghost"
              onClick={onHide}
            >
              Close
            </Button>
          </div>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );

  async function handleAddBookmark() {
    setAddingBookmark(true);
    try {
      const savedBookmark = await bookmarkChatMessage({
        messageId: bookmark.id,
        channelId,
        topicId: bookmark.subjectId
      });
      if (savedBookmark) {
        onAddBookmarkedMessage({
          channelId,
          bookmark: savedBookmark,
          topicId: bookmark.subjectId,
          view: bookmarkView
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAddingBookmark(false);
    }
  }

  async function handleRemoveBookmark() {
    setRemovingBookmark(true);
    try {
      await unbookmarkChatMessage({
        messageId: bookmark.id,
        channelId,
        topicId: bookmark.subjectId
      });
      onRemoveBookmarkedMessage({
        channelId,
        messageId: bookmark.id,
        topicId: bookmark.subjectId,
        view: bookmarkView
      });
    } catch (error) {
      console.error(error);
    } finally {
      setRemovingBookmark(false);
    }
  }

  function handleReplyClick() {
    onSetReplyTarget({
      channelId,
      target: {
        ...bookmark,
        username: replyUsername
      }
    });
    onHide();
  }
}
