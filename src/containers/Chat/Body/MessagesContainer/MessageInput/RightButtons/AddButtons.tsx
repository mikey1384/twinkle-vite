import React, { useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import UploadButton from '~/components/Buttons/UploadButton';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';

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
  const isGoldTheme = alertRole.themeName === 'gold';
  const isOrangeTheme = alertRole.themeName === 'orange';
  const buttonRole = useRoleColor('button', { fallback: 'logoBlue' });
  const buttonColorKey = buttonRole.colorKey;
  const buttonHoverRole = useRoleColor('buttonHovered', {
    fallback: buttonColorKey
  });
  const buttonHoverColorKey = buttonHoverRole.colorKey || buttonColorKey;

  // Override base colors for gold and orange theme buttons to keep contrast high
  const baseButtonColorKey = isGoldTheme
    ? 'bluerGray'
    : isOrangeTheme
    ? 'darkGray'
    : buttonColorKey;
  const baseHoverColorKey = isGoldTheme
    ? 'darkBluerGray'
    : isOrangeTheme
    ? 'darkerGray'
    : buttonHoverColorKey;

  // Helper to tint Color keys
  const getTint = (key: string, alpha: number, fallbackKey = 'gold') => {
    const fn = (Color as any)[key];
    if (typeof fn === 'function') return fn(alpha);
    const fallbackFn = (Color as any)[fallbackKey];
    return typeof fallbackFn === 'function' ? fallbackFn(alpha) : fallbackKey;
  };

  // All glow effects are gold regardless of theme
  const glowHoverKey = 'gold';
  const hoveredSoftBg = getTint(glowHoverKey, 0.18);
  const hoveredSoftBorder = getTint(glowHoverKey, 0.32);
  const hoveredText = getTint(glowHoverKey, 1);

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
          disabled={disabled}
          onClick={onSetTransactionModalShown}
          color={baseButtonColorKey}
          mobilePadding="0.5rem"
          hoverColor={baseHoverColorKey}
          style={
            transactionButtonIsGlowing
              ? {
                  background: hoveredSoftBg,
                  borderColor: hoveredSoftBorder,
                  color: hoveredText
                }
              : undefined
          }
        >
          <Icon size="lg" icon={['far', 'badge-dollar']} />
        </Button>
      )}
      <UploadButton
        icon="upload"
        disabled={disabled}
        onFileSelect={onFileSelect}
        color={baseButtonColorKey}
        hoverColor={baseHoverColorKey}
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
          color={baseButtonColorKey}
          hoverColor={baseHoverColorKey}
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
