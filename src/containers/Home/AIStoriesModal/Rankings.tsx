import React, { useEffect, useMemo, useState } from 'react';
import FilterBar from '~/components/FilterBar';
import localize from '~/constants/localize';
import RankingsListItem from '~/components/RankingsListItem';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { User } from '~/types';
import LeaderboardList from '~/components/LeaderboardList';

const myRankingLabel = localize('myRanking');
const top30Label = localize('top30');

export default function Rankings({
  rankingsTab,
  onSetUsermenuShown,
  onSetRankingsTab
}: {
  rankingsTab: string;
  onSetUsermenuShown: (shown: boolean) => void;
  onSetRankingsTab: (tab: string) => void;
}) {
  const loadAIStoryRankings = useAppContext(
    (v) => v.requestHelpers.loadAIStoryRankings
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
      const { all, top30s, myRank: loadedMyRank } = await loadAIStoryRankings();
      setMyRank(loadedMyRank);
      setAllRanks(all);
      setTop30s(top30s);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loading ? (
    <Loading style={{ height: '100%' }} />
  ) : (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 0
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
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          flex: 1,
          minHeight: 0
        }}
      >
        <LeaderboardList
          height="100%"
          width="35rem"
          padding={`${desktopPaddingTop} 1rem 3.5rem`}
          mobilePadding={`${mobilePaddingTop} 0.75rem 3rem`}
        >
          {users.map((user: User) => (
            <RankingsListItem
              small
              key={user.id}
              user={user}
              myId={myId}
              onUsermenuShownChange={onSetUsermenuShown}
              target="xpEarned"
              activityContext="aiStories"
            />
          ))}
        </LeaderboardList>
      </div>
    </div>
  );
}
