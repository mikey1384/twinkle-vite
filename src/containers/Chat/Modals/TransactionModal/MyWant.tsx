import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import Button from '~/components/Button';
import SelectedCards from './SelectedCards';
import SelectedGroups from './SelectedGroups';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';

export default function MyWant({
  coinAmount,
  style,
  onSetAICardModalCardId,
  onSetCoinAmount,
  onShowAICardSelector,
  selectedCardIds,
  onDeselect,
  partnerId,
  onDeselectGroup,
  onShowGroupSelector,
  selectedGroupIds,
  groupObjs
}: {
  coinAmount: number;
  style?: React.CSSProperties;
  onSetCoinAmount: (v: any) => any;
  onSetAICardModalCardId: (v: any) => any;
  onShowAICardSelector: () => any;
  selectedCardIds: any[];
  onDeselect: (v: any) => any;
  partnerId: number;
  onDeselectGroup: (id: number) => void;
  onShowGroupSelector: () => void;
  selectedGroupIds: number[];
  groupObjs: Record<number, any>;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const selectedGroups = useMemo(
    () => selectedGroupIds.map((id) => groupObjs[id]).filter(Boolean),
    [selectedGroupIds, groupObjs]
  );

  return (
    <div
      style={{
        width: '100%',
        ...style
      }}
    >
      <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>I want...</p>
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
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {selectedCardIds.length || selectedGroups.length ? ( // Changed from selectedGroupIds.length
            <>
              <div style={{ marginBottom: '2rem', width: '100%' }}>
                <div
                  className={css`
                    font-weight: bold;
                    font-size: 1.6rem;
                    color: ${Color.darkerGray()};
                    margin-bottom: 0.5rem;
                    text-align: center;
                  `}
                >
                  AI Cards
                </div>
                {selectedCardIds.length ? (
                  <SelectedCards
                    type="want"
                    selectedCardIds={selectedCardIds}
                    onDeselect={onDeselect}
                    onSetAICardModalCardId={onSetAICardModalCardId}
                    onShowAICardSelector={onShowAICardSelector}
                    partnerId={partnerId}
                  />
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
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
                  </div>
                )}
              </div>
              <div style={{ width: '100%' }}>
                <div
                  className={css`
                    font-weight: bold;
                    font-size: 1.6rem;
                    color: ${Color.darkerGray()};
                    margin-bottom: 1rem;
                    text-align: center;
                  `}
                >
                  Groups
                </div>
                {selectedGroups.length ? (
                  <SelectedGroups
                    selectedGroups={selectedGroups}
                    onDeselectGroup={onDeselectGroup}
                    onShowGroupSelector={onShowGroupSelector}
                  />
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
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
                  </div>
                )}
              </div>
            </>
          ) : (
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
                    text-align: center;
                  `}
                >
                  AI Cards
                </div>
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
                    text-align: center;
                  `}
                >
                  Groups
                </div>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function handleAmountChange(amount: any) {
    const newAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!isNaN(newAmount)) {
      onSetCoinAmount(Math.min(newAmount, 999_999_999));
    } else {
      onSetCoinAmount(0);
    }
  }
}
