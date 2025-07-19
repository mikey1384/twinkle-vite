import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Icon from '~/components/Icon';
import { priceTable } from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function BuyTopicsModal({
  channelId,
  canChangeSubject,
  onPurchaseSubject,
  onDone,
  onScrollToBottom,
  userIsChannelOwner
}: {
  channelId: number;
  channelName?: string;
  canChangeSubject: string;
  onDone: (v: any) => void;
  onPurchaseSubject: (v: any) => void;
  onScrollToBottom: () => void;
  userIsChannelOwner: boolean;
}) {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const buyChatSubject = useAppContext((v) => v.requestHelpers.buyChatSubject);
  const onEnableChatSubject = useChatContext(
    (v) => v.actions.onEnableChatSubject
  );
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const userId = useKeyContext((v) => v.myState.userId);
  const [hovered, setHovered] = useState(false);
  const [editedCanChangeSubject, setEditedCanChangeSubject] =
    useState(canChangeSubject);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const insufficientFunds = useMemo(
    () => twinkleCoins < priceTable.chatSubject,
    [twinkleCoins]
  );

  return (
    <Modal wrapped onHide={handleClose}>
      <header>{`Purchase "Topics" Feature`}</header>
      <main>
        <div
          className={css`
            width: 80%;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          {userIsChannelOwner && (
            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p
                  style={{
                    fontWeight: 'bold',
                    fontSize: '1.7rem',
                    opacity: canChangeSubject ? 1 : 0.3
                  }}
                >
                  <span style={{ color: Color.logoBlue() }}>
                    Topics{canChangeSubject ? ' enabled' : ''}
                  </span>
                </p>
              </div>
              {!canChangeSubject ? (
                <div>
                  <Button
                    onClick={() =>
                      insufficientFunds ? null : setConfirmModalShown(true)
                    }
                    filled
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    color="logoBlue"
                    style={{
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      background: insufficientFunds ? Color.logoBlue(0.2) : '',
                      cursor: insufficientFunds ? 'default' : 'pointer',
                      boxShadow: insufficientFunds ? 'none' : '',
                      borderColor: insufficientFunds ? Color.logoBlue(0.2) : '',
                      outline: insufficientFunds ? 'none' : ''
                    }}
                  >
                    <Icon size="lg" icon={['far', 'badge-dollar']} />
                    <span style={{ marginLeft: '0.5rem' }}>Buy</span>
                  </Button>
                  {insufficientFunds && hovered && (
                    <FullTextReveal
                      show
                      direction="left"
                      style={{ color: '#000', marginTop: '0.5rem' }}
                      text={`You need ${
                        priceTable.chatSubject - twinkleCoins
                      } more Twinkle Coins`}
                    />
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <p
                    style={{
                      fontWeight: 'bold',
                      fontSize: '1.7rem',
                      opacity: canChangeSubject ? 1 : 0.3
                    }}
                  >
                    <span style={{ color: Color.logoBlue() }}>Anyone</span> can
                    add topics:
                  </p>
                  <SwitchButton
                    style={{ marginLeft: '1rem' }}
                    checked={editedCanChangeSubject === 'all'}
                    onChange={() =>
                      setEditedCanChangeSubject((prevValue) =>
                        !prevValue || prevValue === 'all' ? 'owner' : 'all'
                      )
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <footer>
        <Button transparent onClick={handleClose}>
          Close
        </Button>
      </footer>
      {confirmModalShown && (
        <ConfirmModal
          modalOverModal
          onHide={() => setConfirmModalShown(false)}
          title={`Purchase "Topics" Feature`}
          description={`Purchase "Topics" Feature for ${priceTable.chatSubject} Twinkle Coins?`}
          descriptionFontSize="2rem"
          onConfirm={handlePurchaseTopic}
        />
      )}
    </Modal>
  );

  function handleClose() {
    onDone(editedCanChangeSubject);
  }

  async function handlePurchaseTopic() {
    try {
      const { coins, topic } = await buyChatSubject(channelId);
      onEnableChatSubject({
        channelId,
        topic
      });
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      onPurchaseSubject(topic);
      setEditedCanChangeSubject('owner');
      onScrollToBottom();
      setConfirmModalShown(false);
    } catch (error) {
      console.error(error);
      setConfirmModalShown(false);
    }
  }
}
