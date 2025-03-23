import React, { useContext } from 'react';
import BottomMenu from './BottomMenu';
import TopMenu from './TopMenu';
import LocalContext from '../../Context';
import { useKeyContext, useNotiContext } from '~/contexts';
import WordCollectionBar from './WordCollectionBar';

export default function VocabInfo() {
  const {
    state: { allRanks }
  } = useContext(LocalContext);
  const { myAllTimeRank } = useNotiContext((v) => v.state);
  const { twinkleXP, userId, wordsHitToday } = useKeyContext((v) => v.myState);

  return (
    <div
      style={{
        height: '100%',
        position: 'relative',
        display: 'flex'
      }}
    >
      <WordCollectionBar wordsHitToday={wordsHitToday} />
      <div
        style={{
          flexGrow: 1,
          marginLeft: 32
        }}
      >
        <TopMenu />
        <BottomMenu
          rank={myAllTimeRank}
          allRanks={allRanks}
          twinkleXP={twinkleXP}
          userId={userId}
        />
      </div>
    </div>
  );
}
