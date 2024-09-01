import React from 'react';
import OfferDetail from './OfferDetail';
import WantDetail from './WantDetail';
import { User } from '~/types';

export default function Details({
  coinsOffered,
  coinsWanted,
  cardIdsOffered,
  cardIdsWanted,
  groupIdsOffered,
  groupIdsWanted,
  isAICardModalShown,
  selectedOption,
  onSetAICardModalCardId,
  partner,
  groupObjs
}: {
  coinsOffered: number;
  coinsWanted: number;
  cardIdsOffered: number[];
  cardIdsWanted: number[];
  groupIdsOffered: number[];
  groupIdsWanted: number[];
  isAICardModalShown: boolean;
  selectedOption: string;
  onSetAICardModalCardId: (cardId: number) => void;
  partner: User;
  groupObjs: Record<number, any>;
}) {
  return (
    <div style={{ width: '100%' }}>
      {selectedOption === 'want' &&
        (!!cardIdsWanted.length ||
          !!coinsWanted ||
          !!groupIdsWanted.length) && (
          <WantDetail
            isAICardModalShown={isAICardModalShown}
            isExpressingInterest={
              !cardIdsOffered.length && !coinsOffered && !groupIdsOffered.length
            }
            cardIds={cardIdsWanted}
            groupIds={groupIdsWanted}
            coins={coinsWanted}
            onSetAICardModalCardId={onSetAICardModalCardId}
            groupObjs={groupObjs}
          />
        )}
      {(selectedOption !== 'want' ||
        !!cardIdsOffered.length ||
        !!coinsOffered ||
        !!groupIdsOffered.length) && (
        <OfferDetail
          isAICardModalShown={isAICardModalShown}
          isShowing={
            !cardIdsWanted.length && !coinsWanted && !groupIdsWanted.length
          }
          selectedOption={selectedOption}
          cardIds={cardIdsOffered}
          groupIds={groupIdsOffered}
          coins={coinsOffered}
          partner={partner}
          onSetAICardModalCardId={onSetAICardModalCardId}
          groupObjs={groupObjs}
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
