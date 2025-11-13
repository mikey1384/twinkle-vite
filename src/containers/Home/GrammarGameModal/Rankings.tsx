import React, { useEffect, useMemo, useState } from 'react';
import FilterBar from '~/components/FilterBar';import RankingsListItem from '~/components/RankingsListItem';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import LeaderboardList from '~/components/LeaderboardList';

const myRankingLabel = 'My Ranking';
const top30Label = 'Top 30';

export default function Rankings({
  rankingsTab,
  onSetRankingsTab
}: {
  rankingsTab: string;
  onSetRankingsTab: (arg0: string) => void;
}) {
  const loadGrammarRankings = useAppContext(
    (v) => v.requestHelpers.loadGrammarRankings
  );
  const [loading, setLoading] = useState(true);
  const [allRanks, setAllRanks] = useState([]);
  const [top30s, setTop30s] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const myId = useKeyContext((v) => v.myState.userId);
  const users = useMemo(
    () => (rankingsTab === 'all' ? allRanks : top30s),
    [allRanks, rankingsTab, top30s]
  );
  const desktopPaddingTop = myRank ? '2rem' : '1rem';
  const mobilePaddingTop = myRank ? '1.5rem' : '1rem';
  useEffect(() => {
    init();
    async function init() {
      const { all, top30s, myRank: loadedMyRank } = await loadGrammarRankings();
      setMyRank(loadedMyRank);
      setAllRanks(all);
      setTop30s(top30s);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loading ? (
    <Loading style={{ height: 'CALC(100vh - 30rem)' }} />
  ) : (
    <div
      style={{
        height: 'CALC(100vh - 30rem)',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column'
      }}
    >
      {!!myRank && (
        <FilterBar
          style={{
            width: '100%',
            height: '4.5rem',
            fontSize: '1.6rem',
            marginBottom: 0
          }}
        >
          <nav
            className={rankingsTab === 'all' ? 'active' : ''}
            onClick={() => onSetRankingsTab('all')}
          >
            {myRankingLabel}
          </nav>
          <nav
            className={rankingsTab === 'top30' ? 'active' : ''}
            onClick={() => onSetRankingsTab('top30')}
          >
            {top30Label}
          </nav>
        </FilterBar>
      )}
      <LeaderboardList
        height="100%"
        width="35rem"
        padding={`${desktopPaddingTop} 1rem 3.5rem`}
        mobilePadding={`${mobilePaddingTop} 0.75rem 3rem`}
      >
        {users.map((user: { id: number }) => (
          <RankingsListItem
            small
            key={user.id}
            user={user}
            myId={myId}
            target="xpEarned"
            activityContext="grammar"
          />
        ))}
      </LeaderboardList>
    </div>
  );
}
