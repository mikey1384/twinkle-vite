import React from 'react';
import SummonerBadge from './summoner.png';
import ItemPanel from '../ItemPanel';

export default function Summoner({ style }: { style?: React.CSSProperties }) {
  return (
    <ItemPanel
      style={style}
      itemName="Cybernetic Summoner"
      description="Bestowed upon the select few who have unraveled the enigmas of the AI Card Conjuring. Your odyssey into the realms of AI wizardry has not only earned you this esteemed recognition but also transformed you into a revered Summoner of the Cybernetic Realm. Step forth, intrepid explorer of digital dimensions, your journey has just begun."
      requirements={['Unlock the AI Card Summoner License']}
      badgeSrc={SummonerBadge}
    />
  );
}
