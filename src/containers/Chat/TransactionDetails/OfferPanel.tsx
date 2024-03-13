import React from 'react';
import AICardsPreview from '~/components/AICardsPreview';
import Icon from '~/components/Icon';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

export default function OfferPanel({
  imOffering,
  isAICardModalShown,
  isOnModal,
  isTrade,
  offerCardIds,
  offerCoins,
  onSetAICardModalCardId,
  showCardDetailsOnThumbClick
}: {
  imOffering: boolean;
  isAICardModalShown: boolean;
  isOnModal?: boolean;
  isTrade?: boolean;
  offerCardIds: number[];
  offerCoins: number;
  onSetAICardModalCardId: (cardId: number) => void;
  showCardDetailsOnThumbClick: boolean;
}) {
  return (
    <div
      className="panel"
      style={{
        width: '100%',
        borderRadius,
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      {isTrade ? (
        <div
          className={css`
            font-size: 1.6rem;
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
          <span style={{ marginRight: '1rem' }}>Offered...</span>
          <Icon
            icon={`arrow-${imOffering ? 'up' : 'down'}`}
            color={imOffering ? Color.red() : Color.green()}
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
        {offerCardIds.length ? (
          <div style={{ textAlign: 'center' }}>
            <AICardsPreview
              isAICardModalShown={isAICardModalShown}
              isOnModal={isOnModal}
              cardIds={offerCardIds}
              onSetAICardModalCardId={
                showCardDetailsOnThumbClick ? onSetAICardModalCardId : undefined
              }
            />
            {offerCoins > 0 && (
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
        {offerCoins > 0 && (
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
              {addCommasToNumber(offerCoins)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
