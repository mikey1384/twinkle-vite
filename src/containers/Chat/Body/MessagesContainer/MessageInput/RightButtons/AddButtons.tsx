import React, { useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';

export default function AddButtons({
  channelId,
  currentTransactionId,
  disabled,
  isTradeButtonShown,
  isTwoPeopleChannel,
  isAIChannel,
  myId,
  onUploadButtonClick,
  onSelectVideoButtonClick,
  onSetTransactionModalShown
}: {
  channelId: number;
  currentTransactionId: number;
  disabled: boolean;
  isTradeButtonShown: boolean;
  isTwoPeopleChannel: boolean;
  isAIChannel?: boolean;
  myId: number;
  onUploadButtonClick: () => any;
  onSelectVideoButtonClick: () => any;
  onSetTransactionModalShown: (v: boolean) => any;
}) {
  const [transactionButtonIsGlowing, setTransactionButtonIsGlowing] =
    useState(false);
  const {
    alert: { color: alertColor },
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor }
  } = useKeyContext((v) => v.theme);
  const loadPendingTransaction = useAppContext(
    (v) => v.requestHelpers.loadPendingTransaction
  );

  useEffect(() => {
    if (isTwoPeopleChannel) {
      init();
    }
    if (!currentTransactionId) {
      setTransactionButtonIsGlowing(false);
    }
    async function init() {
      const { transaction } = await loadPendingTransaction(channelId);
      setTransactionButtonIsGlowing(transaction && transaction.from !== myId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, currentTransactionId]);

  return (
    <div
      style={{
        display: 'flex',
        margin: '0.2rem 0 0.2rem 0',
        alignItems: 'center'
      }}
    >
      {isTwoPeopleChannel && isTradeButtonShown && !isAIChannel && (
        <Button
          skeuomorphic
          filled={transactionButtonIsGlowing}
          disabled={disabled}
          onClick={onSetTransactionModalShown}
          color={transactionButtonIsGlowing ? alertColor : buttonColor}
          mobilePadding="0.5rem"
          hoverColor={transactionButtonIsGlowing ? alertColor : buttonColor}
        >
          <Icon size="lg" icon={['far', 'badge-dollar']} />
        </Button>
      )}
      <Button
        skeuomorphic
        disabled={disabled}
        onClick={onUploadButtonClick}
        color={buttonColor}
        hoverColor={buttonHoverColor}
        mobilePadding={isTwoPeopleChannel ? '0.5rem' : undefined}
        style={{
          marginLeft: isTwoPeopleChannel && !isAIChannel ? '0.5rem' : 0
        }}
      >
        <Icon size="lg" icon="upload" />
      </Button>
      {!isAIChannel && (
        <Button
          skeuomorphic
          disabled={disabled}
          color={buttonColor}
          hoverColor={buttonHoverColor}
          onClick={onSelectVideoButtonClick}
          mobilePadding={isTwoPeopleChannel ? '0.5rem' : undefined}
          style={{ marginLeft: '0.5rem' }}
        >
          <Icon size="lg" icon="film" />
        </Button>
      )}
    </div>
  );
}
