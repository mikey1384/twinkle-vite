import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SelectNewOwnerModal from '../SelectNewOwnerModal';
import SwitchButton from '~/components/Buttons/SwitchButton';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import Icon from '~/components/Icon';
import ColorSelector from './ColorSelector';
import NameChanger from './NameChanger';
import { priceTable } from '~/constants/defaultValues';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const changeThemeLabel = localize('changeTheme');

export default function SettingsModal({
  channelId,
  channelName,
  canChangeSubject,
  isClass,
  isClosed,
  members,
  onDone,
  onHide,
  onPurchaseSubject,
  onSelectNewOwner,
  onScrollToBottom,
  selectingNewOwner,
  theme,
  unlockedThemes,
  userIsChannelOwner
}: {
  channelId: number;
  channelName?: string;
  canChangeSubject: string;
  isClass: boolean;
  isClosed: boolean;
  members: any[];
  onDone: (v: any) => void;
  onHide: () => void;
  onPurchaseSubject: (v: any) => void;
  onSelectNewOwner: (v: any) => void;
  onScrollToBottom: () => void;
  selectingNewOwner: boolean;
  theme: string;
  unlockedThemes: string[];
  userIsChannelOwner: boolean;
}) {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const buyChatSubject = useAppContext((v) => v.requestHelpers.buyChatSubject);
  const buyChatTheme = useAppContext((v) => v.requestHelpers.buyChatTheme);
  const customChannelNames = useChatContext((v) => v.state.customChannelNames);
  const onEnableChatSubject = useChatContext(
    (v) => v.actions.onEnableChatSubject
  );
  const onEnableTheme = useChatContext((v) => v.actions.onEnableTheme);
  const { twinkleCoins, userId } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [hovered, setHovered] = useState(false);
  const [selectNewOwnerModalShown, setSelectNewOwnerModalShown] =
    useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [editedChannelName, setEditedChannelName] = useState(
    customChannelNames[channelId] || channelName
  );
  const [editedIsClosed, setEditedIsClosed] = useState(isClosed);
  const [editedCanChangeSubject, setEditedCanChangeSubject] =
    useState(canChangeSubject);
  const currentTheme = theme || 'logoBlue';
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [themeToPurchase, setThemeToPurchase] = useState('');
  const insufficientFunds = useMemo(
    () => twinkleCoins < priceTable.chatSubject,
    [twinkleCoins]
  );
  const disabled = useMemo(() => {
    const customChannelName = customChannelNames[channelId];
    let channelNameDidNotChange = editedChannelName === channelName;
    if (
      !!customChannelName &&
      !stringIsEmpty(customChannelName) &&
      customChannelName !== editedChannelName
    ) {
      channelNameDidNotChange = false;
    }
    return (
      (channelNameDidNotChange &&
        isClosed === editedIsClosed &&
        editedCanChangeSubject === canChangeSubject &&
        currentTheme === selectedTheme) ||
      (userIsChannelOwner && stringIsEmpty(editedChannelName))
    );
  }, [
    canChangeSubject,
    channelId,
    channelName,
    currentTheme,
    customChannelNames,
    editedCanChangeSubject,
    editedChannelName,
    editedIsClosed,
    isClosed,
    selectedTheme,
    userIsChannelOwner
  ]);

  return (
    <Modal wrapped onHide={onHide}>
      <header>{userIsChannelOwner ? 'Settings' : 'Edit Group Name'}</header>
      <main>
        <div
          className={css`
            width: 80%;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          <NameChanger
            editedChannelName={editedChannelName}
            onSetEditedChannelName={setEditedChannelName}
            userIsChannelOwner={userIsChannelOwner}
            actualChannelName={channelName}
            usingCustomName={!!customChannelNames[channelId]}
          />
          {userIsChannelOwner && !isClass && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '1.5rem'
              }}
            >
              <p style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>
                <span style={{ color: Color.logoBlue() }}>Anyone</span> can
                invite new members:
              </p>
              <SwitchButton
                style={{ marginLeft: '1rem' }}
                checked={!editedIsClosed}
                onChange={() => setEditedIsClosed((isClosed) => !isClosed)}
              />
            </div>
          )}
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
                  <span style={{ color: Color.logoBlue() }}>Anyone</span> can
                  add topics:
                </p>
                <SwitchButton
                  disabled={!canChangeSubject}
                  style={{ marginLeft: '1rem' }}
                  checked={editedCanChangeSubject === 'all'}
                  onChange={() =>
                    setEditedCanChangeSubject((prevValue) =>
                      !prevValue || prevValue === 'all' ? 'owner' : 'all'
                    )
                  }
                />
              </div>
              {!canChangeSubject && (
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
              )}
            </div>
          )}
          {!!canChangeSubject && userIsChannelOwner && (
            <div
              style={{
                width: '100%',
                marginTop: '2rem',
                justifyContent: 'space-between',
                display: 'flex'
              }}
            >
              <div
                style={{
                  width: '50%',
                  fontWeight: 'bold',
                  fontSize: '1.7rem'
                }}
              >
                {changeThemeLabel}:
              </div>
              <ColorSelector
                colors={[
                  'green',
                  'orange',
                  'red',
                  'rose',
                  'pink',
                  'purple',
                  'darkBlue',
                  'logoBlue'
                ]}
                unlocked={unlockedThemes}
                onSetColor={handleSetColor}
                selectedColor={selectedTheme}
                style={{
                  marginTop: '1rem',
                  height: 'auto',
                  justifyContent: 'flex-end'
                }}
              />
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row'
            }}
          >
            {userIsChannelOwner && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '2rem'
                }}
              >
                <Button
                  onClick={() => setSelectNewOwnerModalShown(true)}
                  filled
                >
                  Change Owner
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          color={doneColor}
          disabled={disabled}
          onClick={() =>
            onDone({
              editedChannelName:
                !userIsChannelOwner && editedChannelName === channelName
                  ? null
                  : editedChannelName,
              editedIsClosed,
              editedCanChangeSubject,
              editedTheme: selectedTheme
            })
          }
        >
          Done
        </Button>
      </footer>
      {selectNewOwnerModalShown && (
        <SelectNewOwnerModal
          loading={selectingNewOwner}
          modalOverModal
          onHide={() => setSelectNewOwnerModalShown(false)}
          members={members}
          onSubmit={({ newOwner }) => {
            onSelectNewOwner({ newOwner });
            onHide();
          }}
          isClass={isClass}
        />
      )}
      {confirmModalShown && (
        <ConfirmModal
          modalOverModal
          onHide={() => setConfirmModalShown(false)}
          title={`Purchase "Topic" Feature`}
          description={`Purchase "Topic" Feature for ${priceTable.chatSubject} Twinkle Coins?`}
          descriptionFontSize="2rem"
          onConfirm={handlePurchaseSubject}
        />
      )}
      {themeToPurchase && (
        <ConfirmModal
          modalOverModal
          onHide={() => setThemeToPurchase('')}
          title={`Purchase theme`}
          description={
            <div>
              Purchase{' '}
              <b style={{ color: Color[themeToPurchase]() }}>this theme</b> for{' '}
              {priceTable.chatTheme} Twinkle Coins?
            </div>
          }
          descriptionFontSize="2rem"
          onConfirm={handlePurchaseTheme}
        />
      )}
    </Modal>
  );

  function handleSetColor(color: string) {
    if (
      unlockedThemes.includes(color) ||
      color === 'green' ||
      color === 'logoBlue'
    ) {
      return setSelectedTheme(color);
    }
    setThemeToPurchase(color);
  }

  async function handlePurchaseSubject() {
    try {
      const { coins, topic } = await buyChatSubject(channelId);
      onEnableChatSubject({ channelId, topic });
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

  async function handlePurchaseTheme() {
    try {
      const { coins } = await buyChatTheme({
        channelId,
        theme: themeToPurchase
      });
      onEnableTheme({ channelId, theme: themeToPurchase });
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      setThemeToPurchase('');
    } catch (error) {
      console.error(error);
      setThemeToPurchase('');
    }
  }
}
