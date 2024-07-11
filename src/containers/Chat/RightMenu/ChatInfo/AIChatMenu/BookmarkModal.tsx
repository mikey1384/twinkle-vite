import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RichText from '~/components/Texts/RichText';
import { useKeyContext } from '~/contexts';

export default function BookmarkModal({
  isCielChat,
  onHide,
  bookmark,
  displayedThemeColor
}: {
  isCielChat: boolean;
  onHide: () => void;
  bookmark: any;
  displayedThemeColor: string;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal onHide={onHide}>
      <main>
        <div style={{ height: '100%', padding: '3rem 1rem' }}>
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
      <footer>
        <Button color={doneColor} onClick={onHide}>
          OK
        </Button>
      </footer>
    </Modal>
  );
}
