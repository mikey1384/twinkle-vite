import React from 'react';
import AICardsPreview from '~/components/AICardsPreview';

export default function MultiCardComponent({
  color,
  isBuyNow,
  quality,
  owner,
  word
}: {
  color?: string | null;
  isBuyNow?: string | null;
  quality?: string | null;
  owner?: string | null;
  word?: string | null;
}) {
  return (
    <div>
      <div>multiple card mode enabled</div>
      <div>color: {color}</div>
      <div>buynow: {isBuyNow}</div>
      <div>quality {quality}</div>
      <div>owner {owner}</div>
      <div>word {word}</div>
      <AICardsPreview isAICardModalShown={false} cardIds={[]} />
    </div>
  );
}
