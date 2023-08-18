import React from 'react';
import GrammarBadge from '~/assets/grammar.png';
import ItemPanel from './ItemPanel';

export default function Grammar({
  isNotification,
  data: { isUnlocked, ap, title, description },
  style
}: {
  isNotification?: boolean;
  data: {
    ap: number;
    isUnlocked: boolean;
    title: string;
    description: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemPanel
      isNotification={isNotification}
      style={style}
      ap={ap}
      isUnlocked={isUnlocked}
      itemName={title}
      description={description}
      requirement="Earn 100,000 Twinkle Coins playing Grammarbles"
      badgeSrc={GrammarBadge}
    />
  );
}
