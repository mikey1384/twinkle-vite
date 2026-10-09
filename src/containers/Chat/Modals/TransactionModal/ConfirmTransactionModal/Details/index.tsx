import {
  AppOwnershipNotice,
  type TradeBuild
} from '~/components/Build/TradeBuilds';
import React from 'react';
import OfferDetail from './OfferDetail';
import WantDetail from './WantDetail';
import { User } from '~/types';

export default function Details({
  offeredBuilds,
  wantedBuilds,
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
  offeredBuilds: TradeBuild[];
  wantedBuilds: TradeBuild[];
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
          !!groupIdsWanted.length ||
          !!wantedBuilds.length) && (
          <WantDetail
            builds={wantedBuilds}
            isAICardModalShown={isAICardModalShown}
            isExpressingInterest={
              !cardIdsOffered.length &&
              !coinsOffered &&
              !groupIdsOffered.length &&
              !offeredBuilds.length
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
        !!groupIdsOffered.length ||
        !!offeredBuilds.length) && (
        <OfferDetail
          builds={offeredBuilds}
          isAICardModalShown={isAICardModalShown}
          isShowing={
            !cardIdsWanted.length &&
            !coinsWanted &&
            !groupIdsWanted.length &&
            !wantedBuilds.length
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
      {(offeredBuilds.length > 0 ||
        (selectedOption === 'want' && wantedBuilds.length > 0)) && (
        <AppOwnershipNotice />
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
