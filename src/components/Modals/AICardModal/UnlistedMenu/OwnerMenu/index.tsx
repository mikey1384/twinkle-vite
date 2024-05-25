import React from 'react';
import Menu from './Menu';

export default function OwnerMenu({
  burnXP,
  cardLevel,
  cardQuality,
  onSetSellModalShown,
  onBurnConfirm,
  twinkleCoins,
  xpNumberColor
}: {
  burnXP: number;
  cardLevel: number;
  cardQuality: string;
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
        xpNumberColor={xpNumberColor}
        onBurnConfirm={onBurnConfirm}
        onSetSellModalShown={onSetSellModalShown}
        twinkleCoins={twinkleCoins}
      />
    </div>
  );
}
