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
  const twinkleXP = useKeyContext((v) => v.myState.twinkleXP);
  const userId = useKeyContext((v) => v.myState.userId);
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
