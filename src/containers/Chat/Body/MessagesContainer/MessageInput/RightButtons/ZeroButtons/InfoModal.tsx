import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { CIEL_PFP_URL, CIEL_TWINKLE_ID } from '~/constants/defaultValues';

export default function ConfirmModal({ onHide }: { onHide: () => void }) {
  const { userId, username, profilePicUrl, authLevel } = useKeyContext(
    (v) => v.myState
  );
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const navigate = useNavigate();

  return (
    <Modal onHide={onHide}>
      <header>Under Construction</header>
      <main>
        <p>Still working on this feature.</p>
        <p>
          You can talk to Ciel instead by clicking this link{' '}
          <a onClick={handleLinkClick}>Ciel</a>
        </p>
      </main>
      <footer>
        <Button color={doneColor} onClick={onHide}>
          Okay
        </Button>
      </footer>
    </Modal>
  );

  async function handleLinkClick() {
    const { pathId } = await loadDMChannel({
      recipient: {
        id: CIEL_TWINKLE_ID,
        username: 'Ciel',
        profilePicUrl: CIEL_PFP_URL
      }
    });
    if (!pathId) {
      onOpenNewChatTab({
        user: { username, id: userId, profilePicUrl, authLevel },
        recipient: {
          username: 'Ciel',
          id: CIEL_TWINKLE_ID,
          profilePicUrl: CIEL_PFP_URL
        }
      });
    }
    setTimeout(() => navigate(pathId ? `/chat/${pathId}` : `/chat/new`), 0);
  }
}
