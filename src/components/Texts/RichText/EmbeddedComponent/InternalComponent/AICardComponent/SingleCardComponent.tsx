import React from 'react';
import AICard from '~/components/AICard';
import { Card as CardType } from '~/types';

export default function SingleCardComponent({ card }: { card: CardType }) {
  return (
    <AICard card={card} onClick={() => console.log('clicked')} detailShown />
  );
}
