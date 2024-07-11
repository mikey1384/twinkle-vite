import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RichText from '~/components/Texts/RichText';
import Icon from '~/components/Icon';
import { useKeyContext, useChatContext } from '~/contexts';

export default function BookmarkModal({
  channelId,
  isCielChat,
  onHide,
  bookmark,
  displayedThemeColor
}: {
  channelId: number;
  isCielChat: boolean;
  onHide: () => void;
  bookmark: any;
  displayedThemeColor: string;
}) {
  const {
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
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
          <Button
            color="red"
            transparent
            onClick={() => console.log('remove bookmark')}
          >
            <Icon icon={['far', 'bookmark']} />
            <span style={{ marginLeft: '1rem' }}>Remove</span>
          </Button>
        </div>
        <div style={{ display: 'flex' }}>
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
