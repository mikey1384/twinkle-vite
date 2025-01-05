import React, { useState } from 'react';
import FilterBar from '~/components/FilterBar';
import XPRankings from './XPRankings';
import League from './League';

export default function BottomMenu({
  rank,
  allRanks,
  twinkleXP,
  userId
}: {
  rank: number;
  allRanks: any[];
  twinkleXP: number;
  userId: number;
}) {
  const [selected, setSelected] = useState('league');
  return (
    <div style={{ height: '50%' }}>
      <FilterBar
        style={{ fontSize: '1.5rem', height: '4rem', marginBottom: 0 }}
      >
        <nav
          onClick={() => setSelected('league')}
          className={selected === 'league' ? 'active' : ''}
        >
          2025 League
        </nav>
        <nav
          onClick={() => setSelected('xp')}
          className={selected === 'xp' ? 'active' : ''}
        >
          XP
        </nav>
      </FilterBar>
      <div style={{ overflow: 'scroll', height: 'calc(100% - 4rem )' }}>
        {selected === 'xp' ? (
          <XPRankings
            userId={userId}
            rank={rank}
            twinkleXP={twinkleXP}
            allRanks={allRanks}
          />
        ) : (
          <League />
        )}
      </div>
    </div>
  );
}
