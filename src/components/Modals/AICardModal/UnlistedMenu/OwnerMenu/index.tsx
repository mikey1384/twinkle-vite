import React from 'react';
import Menu from './Menu';
import type { CardCraftBadge } from '../../CraftedBadge';

export default function OwnerMenu({
  burnXP,
  cardLevel,
  cardQuality,
  craftBadge,
  onSetSellModalShown,
  onBurnConfirm,
  twinkleCoins,
  xpNumberColor
}: {
  burnXP: number | string;
  cardLevel: number;
  cardQuality: string;
  craftBadge: CardCraftBadge | null;
  onSetSellModalShown: (v: boolean) => void;
  onBurnConfirm: () => void;
  twinkleCoins: number;
  xpNumberColor: string;
}) {
  return (
    <div style={{ width: '100%', marginTop: 0 }}>
      <Menu
        burnXP={burnXP}
        cardLevel={cardLevel}
        cardQuality={cardQuality}
        craftBadge={craftBadge}
        xpNumberColor={xpNumberColor}
        onBurnConfirm={onBurnConfirm}
        onSetSellModalShown={onSetSellModalShown}
        twinkleCoins={twinkleCoins}
      />
    </div>
  );
}
