import React from 'react';
import OfferDetail from './OfferDetail';
import WantDetail from './WantDetail';
import { User } from '~/types';

export default function Details({
  coinsOffered,
  coinsWanted,
  cardIdsOffered,
  cardIdsWanted,
  isAICardModalShown,
  selectedOption,
  onSetAICardModalCardId,
  partner
}: {
  coinsOffered: number;
  coinsWanted: number;
  cardIdsOffered: number[];
  cardIdsWanted: number[];
  isAICardModalShown: boolean;
  selectedOption: string;
  onSetAICardModalCardId: (cardId: number) => void;
  partner: User;
}) {
  return (
    <div style={{ width: '100%' }}>
      {selectedOption === 'want' &&
        (!!cardIdsWanted.length || !!coinsWanted) && (
          <WantDetail
            isAICardModalShown={isAICardModalShown}
            isExpressingInterest={!cardIdsOffered.length && !coinsOffered}
            cardIds={cardIdsWanted}
            coins={coinsWanted}
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
        )}
      {(selectedOption !== 'want' ||
        !!cardIdsOffered.length ||
        !!coinsOffered) && (
        <OfferDetail
          isAICardModalShown={isAICardModalShown}
          isShowing={!cardIdsWanted.length && !coinsWanted}
          selectedOption={selectedOption}
          cardIds={cardIdsOffered}
          coins={coinsOffered}
          partner={partner}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      )}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginTop: '1rem',
          padding: '1rem',
          fontWeight: 'bold'
        }}
      >
        Are you sure?
      </div>
    </div>
  );
}
