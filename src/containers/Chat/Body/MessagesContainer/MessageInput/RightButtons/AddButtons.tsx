import React, { useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import UploadButton from '~/components/Buttons/UploadButton';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';

export default function AddButtons({
  channelId,
  currentTransactionId,
  disabled,
  isTradeButtonShown,
  isTwoPeopleChannel,
  isAIChannel,
  myId,
  onFileSelect,
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
  onFileSelect: (file: File) => void;
  onSelectVideoButtonClick: () => any;
  onSetTransactionModalShown: (v: boolean) => any;
}) {
  const [transactionButtonIsGlowing, setTransactionButtonIsGlowing] =
    useState(false);
  const alertRole = useRoleColor('alert', { fallback: 'gold' });
  const alertColorKey = alertRole.colorKey || 'gold';
  const buttonRole = useRoleColor('button', { fallback: 'logoBlue' });
  const buttonColorKey = buttonRole.colorKey;
  const buttonHoverRole = useRoleColor('buttonHovered', {
    fallback: buttonColorKey
  });
  const buttonHoverColorKey =
    buttonHoverRole.colorKey || buttonColorKey;

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
          variant="soft"
          tone="raised"
          filled={transactionButtonIsGlowing}
          disabled={disabled}
          onClick={onSetTransactionModalShown}
          color={transactionButtonIsGlowing ? alertColorKey : buttonColorKey}
          mobilePadding="0.5rem"
          hoverColor={
            transactionButtonIsGlowing ? alertColorKey : buttonColorKey
          }
        >
          <Icon size="lg" icon={['far', 'badge-dollar']} />
        </Button>
      )}
      <UploadButton
        icon="upload"
        disabled={disabled}
        onFileSelect={onFileSelect}
        color={buttonColorKey}
        hoverColor={buttonHoverColorKey}
        mobilePadding={isTwoPeopleChannel ? '0.5rem' : undefined}
        style={{
          marginLeft: isTwoPeopleChannel && !isAIChannel ? '0.5rem' : 0
        }}
      />
      {!isAIChannel && (
        <Button
          variant="soft"
          tone="raised"
          disabled={disabled}
          color={buttonColorKey}
          hoverColor={buttonHoverColorKey}
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
