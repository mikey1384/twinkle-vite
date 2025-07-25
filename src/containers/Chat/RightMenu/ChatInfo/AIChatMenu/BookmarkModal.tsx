import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RichText from '~/components/Texts/RichText';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';

export default function BookmarkModal({
  channelId,
  isCielChat,
  isCurrentlyBookmarked,
  onHide,
  bookmark,
  displayedThemeColor
}: {
  channelId: number;
  isCielChat: boolean;
  isCurrentlyBookmarked: boolean;
  onHide: () => void;
  bookmark: any;
  displayedThemeColor: string;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const successColor = useKeyContext((v) => v.theme.success.color);
  const bookmarkAIMessage = useAppContext(
    (v) => v.requestHelpers.bookmarkAIMessage
  );
  const unBookmarkAIMessage = useAppContext(
    (v) => v.requestHelpers.unBookmarkAIMessage
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

  return (
    <Modal onHide={onHide}>
      <main>
        <div style={{ height: '100%', width: '100%', padding: '3rem 1rem' }}>
          <RichText
            isAIMessage
            voice={isCielChat ? 'nova' : ''}
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
              transparent
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
              transparent
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
          <Button style={{ marginLeft: '0.7rem' }} transparent onClick={onHide}>
            Close
          </Button>
        </div>
      </footer>
    </Modal>
  );

  async function handleAddBookmark() {
    setAddingBookmark(true);
    try {
      await bookmarkAIMessage({
        messageId: bookmark.id,
        channelId,
        topicId: bookmark.subjectId
      });
      onAddBookmarkedMessage({
        channelId,
        message: bookmark,
        topicId: bookmark.subjectId
      });
    } catch (error) {
      console.error(error);
    } finally {
      setAddingBookmark(false);
    }
  }

  async function handleRemoveBookmark() {
    setRemovingBookmark(true);
    try {
      await unBookmarkAIMessage({
        messageId: bookmark.id,
        channelId,
        topicId: bookmark.subjectId
      });
      onRemoveBookmarkedMessage({
        channelId,
        messageId: bookmark.id,
        topicId: bookmark.subjectId
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
        username: isCielChat ? 'Ciel' : 'Zero'
      }
    });
    onHide();
  }
}
