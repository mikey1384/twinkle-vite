import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import PurchaseModal, {
  ChatPurchaseReceipt
} from './SettingsModal/PurchaseModal';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Icon from '~/components/Icon';
import { priceTable } from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function BuyTopicsModal({
  channelId,
  canChangeSubject,
  onDone,
  onScrollToBottom,
  userIsChannelOwner
}: {
  channelId: number;
  channelName?: string;
  canChangeSubject: string;
  onDone: (v: any) => void | Promise<void>;
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
  const [purchased, setPurchased] = useState(false);
  const hasTopics = Boolean(canChangeSubject || purchased);
  const [editedCanChangeSubject, setEditedCanChangeSubject] =
    useState(canChangeSubject);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const insufficientFunds = useMemo(
    () =>
      !Number.isFinite(twinkleCoins) || twinkleCoins < priceTable.chatSubject,
    [twinkleCoins]
  );

  return (
    <Modal
      modalKey="BuyTopicsModal"
      isOpen
      onClose={handleClose}
      aria-label={hasTopics ? 'Topic permissions' : 'Enable topics'}
      header={
        <span style={{ fontSize: '20px', lineHeight: 1.4 }}>
          {hasTopics ? 'Topic permissions' : 'Enable topics'}
        </span>
      }
      size="sm"
      footer={
        <div style={{ width: '100%', textAlign: 'right' }}>
          {saveError && (
            <p role="alert" style={{ fontSize: '16px', lineHeight: 1.5 }}>
              {saveError}
            </p>
          )}
          <Button
            variant="ghost"
            onClick={handleClose}
            loading={saving}
            disabled={saving}
            style={{ minHeight: '44px', fontSize: '14px' }}
          >
            {editedCanChangeSubject !== canChangeSubject
              ? 'Save and close'
              : 'Close'}
          </Button>
        </div>
      }
    >
      <div
        className={css`
          width: 100%;
          min-width: 0;
          padding: 8px;
          font-size: 16px;
          line-height: 1.5;
          p {
            margin: 0;
          }
          .permission-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            width: 100%;
          }
          .permission-row label {
            min-height: 44px;
            display: inline-flex;
            align-items: center;
          }
        `}
      >
        {userIsChannelOwner && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'stretch'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p
                style={{
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                <span style={{ color: Color.logoBlue() }}>
                  Topics{hasTopics ? ' enabled' : ''}
                </span>
              </p>
            </div>
            {!hasTopics ? (
              <div>
                <p style={{ marginBottom: '16px' }}>
                  Organize this channel’s conversations with topics.
                </p>
                <Button
                  disabled={saving || insufficientFunds}
                  onClick={() =>
                    insufficientFunds || savingRef.current
                      ? null
                      : setConfirmModalShown(true)
                  }
                  variant="soft"
                  tone="raised"
                  color="logoBlue"
                  style={{
                    fontSize: '14px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    background: insufficientFunds ? Color.logoBlue(0.2) : '',
                    cursor: insufficientFunds ? 'default' : 'pointer',
                    boxShadow: insufficientFunds ? 'none' : '',
                    borderColor: insufficientFunds ? Color.logoBlue(0.2) : '',
                    outline: insufficientFunds ? 'none' : ''
                  }}
                >
                  <Icon size="lg" icon="coins" />
                  <span style={{ marginLeft: '0.5rem' }}>Buy</span>
                </Button>
                <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
                  {priceTable.chatSubject.toLocaleString()} coins
                </p>
                {insufficientFunds && (
                  <p
                    role="status"
                    style={{ fontSize: '14px', lineHeight: 1.5 }}
                  >
                    {Number.isFinite(twinkleCoins)
                      ? `You need ${(priceTable.chatSubject - twinkleCoins).toLocaleString()} more coins.`
                      : 'Your coin balance is unavailable.'}
                  </p>
                )}
              </div>
            ) : (
              <div className="permission-row">
                <p
                  style={{
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  Allow anyone to add topics
                </p>
                <SwitchButton
                  disabled={saving}
                  ariaLabel="Allow anyone to add topics"
                  style={{ flexShrink: 0 }}
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
      {confirmModalShown && (
        <PurchaseModal
          scope={`${userId}:${channelId}:topics`}
          onHide={() => setConfirmModalShown(false)}
          title={'Purchase "Topics" Feature'}
          description="Enable topics for this channel."
          price={priceTable.chatSubject}
          balance={Number.isFinite(twinkleCoins) ? twinkleCoins : 0}
          onPurchase={async () => {
            if (
              !userIsChannelOwner ||
              savingRef.current ||
              !Number.isSafeInteger(channelId) ||
              channelId <= 0
            )
              throw Error('Purchase unavailable');
            return buyChatSubject(channelId);
          }}
          validateReceipt={(receipt) =>
            Boolean(
              receipt.topic &&
              Number.isSafeInteger(receipt.topic.id) &&
              receipt.topic.id > 0 &&
              typeof receipt.topic.content === 'string'
            )
          }
          onApply={handleApplyPurchase}
        />
      )}
    </Modal>
  );

  async function handleClose() {
    if (savingRef.current || confirmModalShown || !mounted.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError('');
    try {
      await onDone(editedCanChangeSubject);
    } catch {
      if (mounted.current)
        setSaveError(
          'Could not save topic permissions. Your selection is still here; try saving again.'
        );
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  function handleApplyPurchase({ coins, topic }: ChatPurchaseReceipt) {
    if (!mounted.current) return;
    onEnableChatSubject({ channelId, topic });
    onSetUserState({ userId, newState: { twinkleCoins: coins } });
    setEditedCanChangeSubject('owner');
    setPurchased(true);
    onScrollToBottom();
  }
}
