import React from 'react';
import GrammarBadge from '~/assets/grammar.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Grammar({
  isUnlocked,
  thumbSize,
  data: { title, progressObj }
}: {
  isUnlocked?: boolean;
  thumbSize?: string;
  data: {
    progressObj: { label: string; currentValue: number; targetValue: number };
    title: string;
  };
}) {
  return (
    <ItemThumbPanel
      isUnlocked={isUnlocked}
      thumbSize={thumbSize}
      itemName={title}
      progressObj={progressObj}
      badgeSrc={GrammarBadge}
    />
  );
}
