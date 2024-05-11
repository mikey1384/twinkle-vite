import React from 'react';
import SelectedCardDetail from './SelectedCardDetail';
import Input from '~/components/Texts/Input';
import { borderRadius } from '~/constants/css';

export default function Details({
  selectedCardIds,
  isAICardModalShown,
  onSetPrice,
  onSetAICardModalCardId,
  price
}: {
  selectedCardIds: number[];
  isAICardModalShown: boolean;
  onSetPrice: (v: number) => void;
  onSetAICardModalCardId: (cardId: number) => void;
  price: number;
}) {
  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>
          Selected Cards
        </p>
        <SelectedCardDetail
          isAICardModalShown={isAICardModalShown}
          cardIds={selectedCardIds}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      </div>
      <p
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
      </p>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div>
          <Input
            onChange={handlePriceChange}
            placeholder="Price"
            value={price}
            style={{
              fontSize: '1.7rem',
              padding: '0.5rem',
              borderRadius,
              lineHeight: 1.5
            }}
          />
        </div>
      </div>
    </div>
  );

  function handlePriceChange(amount: string) {
    const newAmount = Number(amount.replace(/[^0-9]/g, ''));
    onSetPrice(Math.min(newAmount, 999_999_999));
  }
}
