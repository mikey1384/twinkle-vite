import React from 'react';
import OfferDetail from './OfferDetail';

export default function Details({
  selectedCardIds,
  isAICardModalShown,
  onSetAICardModalCardId
}: {
  selectedCardIds: number[];
  isAICardModalShown: boolean;
  onSetAICardModalCardId: (cardId: number) => void;
}) {
  return (
    <div style={{ width: '100%' }}>
      <OfferDetail
        isAICardModalShown={isAICardModalShown}
        cardIds={selectedCardIds}
        onSetAICardModalCardId={onSetAICardModalCardId}
      />
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
