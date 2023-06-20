import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { CIEL_PFP_URL, CIEL_TWINKLE_ID } from '~/constants/defaultValues';

export default function ConfirmModal({ onHide }: { onHide: () => void }) {
  const [usermenuShown, setUsermenuShown] = useState(false);
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
    <Modal onHide={usermenuShown ? () => null : onHide}>
      <header>Under Construction</header>
      <main>
        <div>
          <UsernameText
            onMenuShownChange={setUsermenuShown}
            color={Color.logoBlue()}
            user={{
              username: 'Mikey',
              id: 5
            }}
          />{' '}
          is still working on this feature.
        </div>
        <div style={{ marginTop: '1rem' }}>
          <span>
            {`In the mean time, you can talk to Zero's younger sister, `}
          </span>
          <UsernameText
            onMenuShownChange={setUsermenuShown}
            color={Color.pink()}
            user={{
              username: 'Ciel',
              id: CIEL_TWINKLE_ID
            }}
          />
          <span>, without the need for energy!</span>
        </div>
        <div style={{ marginTop: '1rem' }}>
          {`Click Ciel's picture below to chat with Ciel`}
        </div>
        <div onClick={handleLinkClick}>
          <ProfilePic
            style={{
              marginTop: '2rem',
              width: '10rem',
              cursor: 'pointer'
            }}
            userId={CIEL_TWINKLE_ID}
            profilePicUrl={CIEL_PFP_URL as string}
            statusShown
            large
          />
        </div>
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
