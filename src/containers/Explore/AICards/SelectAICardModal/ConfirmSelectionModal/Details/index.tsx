import React from 'react';
import SelectedCardDetail from './SelectedCardDetail';

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
      <SelectedCardDetail
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
        Set the price for the selected cards
      </div>
    </div>
  );
}
