import React from 'react';
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
  const {
    done: { color: doneColor },
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
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
            <Button color="red" transparent onClick={handleRemoveBookmark}>
              <Icon icon={['far', 'bookmark']} />
              <span style={{ marginLeft: '1rem' }}>Remove</span>
            </Button>
          )}
        </div>
        <div style={{ display: 'flex' }}>
          {!isCurrentlyBookmarked && (
            <Button
              style={{ marginRight: '0.7rem' }}
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
    await bookmarkAIMessage({
      messageId: bookmark.id,
      channelId
    });
    onAddBookmarkedMessage({
      channelId,
      message: bookmark
    });
  }

  async function handleRemoveBookmark() {
    await unBookmarkAIMessage({
      messageId: bookmark.id,
      channelId
    });
    onRemoveBookmarkedMessage({
      channelId,
      messageId: bookmark.id
    });
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
