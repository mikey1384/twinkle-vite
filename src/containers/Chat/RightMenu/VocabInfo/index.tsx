import React, { useContext } from 'react';
import BottomMenu from './BottomMenu';
import TopMenu from './TopMenu';
import LocalContext from '../../Context';
import { useKeyContext, useNotiContext } from '~/contexts';

export default function VocabInfo() {
  const {
    state: { allRanks }
  } = useContext(LocalContext);
  const myAllTimeRank = useNotiContext((v) => v.state.myAllTimeRank);
  const { twinkleXP, userId } = useKeyContext((v) => v.myState);
  return (
    <div style={{ height: '100%' }}>
      <TopMenu />
      <BottomMenu
        rank={myAllTimeRank}
        allRanks={allRanks}
        twinkleXP={twinkleXP}
        userId={userId}
      />
    </div>
  );
}
