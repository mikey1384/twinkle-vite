import React, { useRef, useEffect } from 'react';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import Button from '~/components/Button';
import SelectedCards from './SelectedCards';
import SelectedGroups from './SelectedGroups'; // Add this import
import { css } from '@emotion/css';
import { borderRadius, Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';

export default function MyOffer({
  focusOnMount,
  isSelectAICardModalShown,
  coinAmount,
  onShowAICardSelector,
  selectedCardIds,
  selectedOption,
  onDeselect,
  onSetCoinAmount,
  onSetAICardModalCardId,
  style,
  ModalRef,
  selectedGroupIds,
  onDeselectGroup,
  onShowGroupSelector
}: {
  focusOnMount?: boolean;
  isSelectAICardModalShown?: boolean;
  coinAmount: number;
  onShowAICardSelector: () => any;
  selectedCardIds: any[];
  selectedOption: string;
  onDeselect: (v: any) => any;
  onSetCoinAmount: (v: any) => any;
  onSetAICardModalCardId: (v: any) => any;
  style?: React.CSSProperties;
  ModalRef: React.RefObject<any>;
  selectedGroupIds: number[];
  onDeselectGroup: (id: number) => void;
  onShowGroupSelector: () => void;
}) {
  const ContainerRef: React.RefObject<any> = useRef(null);
  useEffect(() => {
    if (focusOnMount) {
      if (!isSelectAICardModalShown) {
        ModalRef.current.scrollTop = ContainerRef.current.offsetTop;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelectAICardModalShown]);

  const { twinkleCoins, profileTheme } = useKeyContext((v) => v.myState);
  return (
    <div
      ref={ContainerRef}
      style={{
        width: '100%',
        ...style
      }}
    >
      <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>
        I{' '}
        {selectedOption === 'want'
          ? 'offer'
          : selectedOption === 'send'
          ? 'want to send'
          : 'have'}
        ...
      </p>
      <div
        style={{
          marginTop: '0.5rem',
          padding: '2rem',
          border: `1px solid ${Color.borderGray()}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          borderRadius
        }}
      >
        <div style={{ width: 'auto' }}>
          <div
            className={css`
              font-weight: bold;
              font-size: 1.6rem;
              color: ${Color.darkerGray()};
              display: flex;
              align-items: center;
            `}
          >
            Twinkle Coins (
            <Icon
              style={{ color: Color.brownOrange() }}
              icon={['far', 'badge-dollar']}
            />
            )
          </div>
          <Input
            onChange={handleAmountChange}
            placeholder="Amount"
            value={coinAmount}
            style={{
              fontSize: '1.7rem',
              padding: '0.5rem',
              borderRadius,
              lineHeight: 1.5,
              marginTop: '0.5rem'
            }}
          />
        </div>
        <div
          style={{
            marginTop: '2rem',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div
                className={css`
                  font-weight: bold;
                  font-size: 1.6rem;
                  color: ${Color.darkerGray()};
                  margin-bottom: 0.5rem;
                `}
              >
                AI Cards
              </div>
              {selectedCardIds.length ? (
                <SelectedCards
                  type="offer"
                  selectedCardIds={selectedCardIds}
                  onDeselect={onDeselect}
                  onSetAICardModalCardId={onSetAICardModalCardId}
                  onShowAICardSelector={onShowAICardSelector}
                />
              ) : (
                <Button
                  skeuomorphic
                  style={{
                    fontSize: '3.5rem',
                    padding: '1.5rem'
                  }}
                  color={profileTheme}
                  onClick={onShowAICardSelector}
                >
                  <Icon icon="cards-blank" />
                </Button>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div
                className={css`
                  font-weight: bold;
                  font-size: 1.6rem;
                  color: ${Color.darkerGray()};
                  margin-bottom: 0.5rem;
                `}
              >
                Groups
              </div>
              {selectedGroupIds.length ? (
                <SelectedGroups
                  selectedGroupIds={selectedGroupIds}
                  onDeselect={onDeselectGroup}
                />
              ) : (
                <Button
                  skeuomorphic
                  style={{
                    fontSize: '3.5rem',
                    padding: '1.5rem'
                  }}
                  color={profileTheme}
                  onClick={onShowGroupSelector}
                >
                  <Icon icon="users" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function handleAmountChange(amount: any) {
    const newAmount = Number(amount.replace(/[^0-9]/g, ''));
    const minAmount = Math.min(newAmount, twinkleCoins);

    if (!isNaN(minAmount)) {
      onSetCoinAmount(minAmount);
    } else {
      onSetCoinAmount(0);
    }
  }
}
