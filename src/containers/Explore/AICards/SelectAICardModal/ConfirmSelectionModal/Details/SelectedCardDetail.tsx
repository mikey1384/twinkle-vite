import React from 'react';
import AICardsPreview from '~/components/AICardsPreview';
import { borderRadius, Color } from '~/constants/css';

export default function SelectedCardDetail({
  isAICardModalShown,
  cardIds,
  onSetAICardModalCardId
}: {
  isAICardModalShown: boolean;
  cardIds: number[];
  onSetAICardModalCardId: (v: number) => void;
}) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius,
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      <div
        style={{
          width: '100%',
          borderTop: `1px solid ${Color.borderGray()}`,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        <AICardsPreview
          isOnModal
          isAICardModalShown={isAICardModalShown}
          cardIds={cardIds}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      </div>
    </div>
  );
}
