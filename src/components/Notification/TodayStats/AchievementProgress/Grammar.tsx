import React from 'react';
import GrammarBadge from '~/assets/badges-small/grammar.webp';
import ItemThumb from './ItemThumb';

export default function Grammar({
  isUnlocked,
  thumbSize,
  data
}: {
  isUnlocked?: boolean;
  thumbSize?: string;
  data: any;
}) {
  return (
    <ItemThumb
      achievement={data}
      isUnlocked={isUnlocked}
      thumbSize={thumbSize}
      badgeSrc={GrammarBadge}
    />
  );
}
