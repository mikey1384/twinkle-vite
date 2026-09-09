import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import PurchaseModal, { ChatPurchaseReceipt } from './SettingsModal/PurchaseModal';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Icon from '~/components/Icon';
import { priceTable } from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { chatFormModalClass } from './chatFormStyles';

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
  const onEnableChatSubject = useChatContext((v) => v.actions.onEnableChatSubject);
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
    () => !Number.isFinite(twinkleCoins) || twinkleCoins < priceTable.chatSubject,
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
      className={chatFormModalClass}
      footer={
        <>
          {saveError && (
            <p
              role="alert"
              style={{
                width: '100%',
                margin: 0,
                fontSize: '16px',
                lineHeight: 1.5
              }}
            >
              {saveError}
            </p>
          )}
          <Button
            variant="ghost"
            onClick={handleClose}
            loading={saving}
            disabled={saving}
          >
            {editedCanChangeSubject !== canChangeSubject
              ? 'Save and close'
              : 'Close'}
          </Button>
          {userIsChannelOwner && !hasTopics && (
            <Button
              color="blue"
              disabled={saving || insufficientFunds}
              aria-label={`Enable topics for ${priceTable.chatSubject.toLocaleString()} coins`}
              onClick={handleShowPurchase}
            >
              Enable topics
            </Button>
          )}
        </>
      }
    >
      <div
        className={css`
          width: 100%;
          min-width: 0;
          padding: 8px;
          font-size: 16px;
          line-height: 1.5;
          color: #253247;
          p {
            margin: 0;
          }
          .topic-intro {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 4px 4px 12px;
            text-align: center;
          }
          .topic-icon {
            display: grid;
            place-items: center;
            width: 52px;
            height: 52px;
            margin-bottom: 16px;
            border-radius: 50%;
            background: ${Color.logoBlue(0.08)};
            color: ${Color.logoBlue()};
            font-size: 24px;
          }
          .topic-heading {
            margin: 0 0 8px;
            font-size: 18px;
            font-weight: 600;
            line-height: 1.4;
          }
          .topic-description {
            max-width: 300px;
            color: #526176;
            font-size: 15px;
          }
          .topic-price {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 24px;
          }
          .topic-price > svg {
            color: ${Color.gold()};
            font-size: 22px;
          }
          .topic-price strong {
            font-size: 28px;
            font-weight: 600;
            line-height: 1.3;
          }
          .topic-price span {
            color: #526176;
            font-size: 15px;
          }
          .topic-cost-note {
            margin-top: 6px;
            color: #526176;
            font-size: 14px;
          }
          .topic-balance-status {
            margin-top: 12px;
            font-size: 14px;
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
            {!hasTopics ? (
              <div className="topic-intro">
                <div className="topic-icon" aria-hidden="true">
                  <Icon icon="comments" />
                </div>
                <h3 className="topic-heading">Keep conversations organized</h3>
                <p className="topic-description">
                  Give ideas, questions, and updates their own place in this
                  channel.
                </p>
                <div className="topic-price">
                  <Icon icon="coins" aria-hidden="true" />
                  <strong>{priceTable.chatSubject.toLocaleString()}</strong>
                  <span>coins</span>
                </div>
                <p className="topic-cost-note">
                  One-time unlock for this channel
                </p>
                {insufficientFunds && (
                  <p role="status" className="topic-balance-status">
                    {Number.isFinite(twinkleCoins)
                      ? `You need ${(priceTable.chatSubject - twinkleCoins).toLocaleString()} more coins.`
                      : 'Your coin balance is unavailable.'}
                  </p>
                )}
              </div>
            ) : (
              <>
                <p style={{ color: Color.logoBlue(), fontWeight: 600 }}>
                  Topics enabled
                </p>
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
              </>
            )}
          </div>
        )}
      </div>
      {confirmModalShown && (
        <PurchaseModal
          scope={`${userId}:${channelId}:topics`}
          onHide={() => setConfirmModalShown(false)}
          title="Enable topics"
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

  function handleShowPurchase() {
    if (insufficientFunds || savingRef.current || !userIsChannelOwner) return;
    setConfirmModalShown(true);
  }

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
