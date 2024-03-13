import React from 'react';
import AICardsPreview from '~/components/AICardsPreview';
import Icon from '~/components/Icon';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

export default function WantPanel({
  imOffering,
  isAICardModalShown,
  isOnModal,
  isTrade,
  onSetAICardModalCardId,
  wantCardIds,
  wantCoins,
  showCardDetailsOnThumbClick,
  style
}: {
  imOffering: boolean;
  isAICardModalShown: boolean;
  isOnModal?: boolean;
  isTrade: boolean;
  onSetAICardModalCardId: (cardId: number) => void;
  wantCardIds: number[];
  wantCoins: number;
  showCardDetailsOnThumbClick: boolean;
  style: React.CSSProperties;
}) {
  return (
    <div
      className="panel"
      style={{
        width: '100%',
        borderRadius,
        fontFamily: 'Roboto, monospace',
        border: `1px solid ${Color.borderGray()}`,
        ...style
      }}
    >
      {isTrade ? (
        <div
          className={css`
            font-size: 1.7rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
          style={{
            padding: '1rem',
            fontWeight: 'bold',
            fontFamily: 'Roboto, monospace',
            textAlign: 'center',
            borderBottom: `1px solid ${Color.borderGray()}`
          }}
        >
          <span style={{ marginRight: '1rem' }}>in exchange for...</span>
          <Icon
            icon={`arrow-${imOffering ? 'down' : 'up'}`}
            color={imOffering ? Color.green() : Color.red()}
          />
        </div>
      ) : null}
      <div
        style={{
          padding: '1rem',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        {wantCardIds.length ? (
          <div style={{ textAlign: 'center' }}>
            <AICardsPreview
              isAICardModalShown={isAICardModalShown}
              isOnModal={isOnModal}
              cardIds={wantCardIds}
              onSetAICardModalCardId={
                showCardDetailsOnThumbClick ? onSetAICardModalCardId : undefined
              }
            />
            {wantCoins > 0 && (
              <div
                style={{
                  padding: '0.5rem',
                  fontFamily: 'Roboto, Helvetica, monospace',
                  fontSize: '1.5rem'
                }}
              >
                and
              </div>
            )}
          </div>
        ) : null}
        {wantCoins > 0 && (
          <div>
            <Icon
              style={{ color: Color.brownOrange() }}
              icon={['far', 'badge-dollar']}
            />
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: Color.darkerGray(),
                marginLeft: '0.3rem'
              }}
            >
              {addCommasToNumber(wantCoins)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
