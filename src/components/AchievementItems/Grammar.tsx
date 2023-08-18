import React from 'react';
import GrammarBadge from '~/assets/grammar.png';
import ItemPanel from './ItemPanel';

export default function Grammar({
  isNotification,
  data: { isUnlocked, ap, title, description, unlockMessage },
  style
}: {
  isNotification?: boolean;
  data: {
    ap: number;
    isUnlocked: boolean;
    title: string;
    description: string;
    unlockMessage: string;
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
      unlockMessage={unlockMessage}
      requirement="Earn 100,000 Twinkle Coins playing Grammarbles"
      badgeSrc={GrammarBadge}
    />
  );
}
