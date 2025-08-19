import React, { useEffect, useMemo, useState } from 'react';
import FilterBar from '~/components/FilterBar';
import localize from '~/constants/localize';
import Loading from '~/components/Loading';
import Leaderboard from './Leaderboard';
import { useAppContext, useKeyContext } from '~/contexts';

const myRankingLabel = localize('myRanking');
const top30Label = localize('top30');

export default function Rankings({ isActive = true }: { isActive?: boolean }) {
  const loadChessRankings = useAppContext(
    (v) => v.requestHelpers.loadChessRankings
  );
  const myId = useKeyContext((v) => v.myState.userId);
  const [rankingsTab, setRankingsTab] = useState<'all' | 'top30'>('all');
  const [loading, setLoading] = useState(true);
  const [allRanks, setAllRanks] = useState<any[]>([]);
  const [top30s, setTop30s] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);

  const users = useMemo(
    () => (rankingsTab === 'all' ? allRanks : top30s),
    [allRanks, rankingsTab, top30s]
  );

  useEffect(() => {
    if (!isActive) return;
    setLoading(true);
    (async () => {
      try {
        const { all, top30s, myRank } = await loadChessRankings();
        setAllRanks(all || []);
        setTop30s(top30s || []);
        setMyRank(myRank ?? null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  if (loading) return <Loading style={{ height: 'CALC(100vh - 30rem)' }} />;

  return (
    <div
      style={{
        height: 'CALC(100vh - 32rem)',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {!!myRank && (
        <FilterBar
          style={{
            width: '100%',
            height: '5.2rem',
            fontSize: '1.6rem',
            marginBottom: 0
          }}
        >
          <nav
            className={rankingsTab === 'all' ? 'active' : ''}
            onClick={() => setRankingsTab('all')}
            style={{ paddingBottom: '0.4rem' }}
          >
            {myRankingLabel}
          </nav>
          <nav
            className={rankingsTab === 'top30' ? 'active' : ''}
            onClick={() => setRankingsTab('top30')}
            style={{ paddingBottom: '0.4rem' }}
          >
            {top30Label}
          </nav>
        </FilterBar>
      )}

      <div
        style={{
          height: '100%',
          width: '100%',
          paddingTop: myRank ? '1.5rem' : '0.5rem'
        }}
      >
        <Leaderboard users={users} myId={myId} />
      </div>
    </div>
  );
}
