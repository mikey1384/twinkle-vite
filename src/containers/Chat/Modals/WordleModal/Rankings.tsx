import React, { useEffect, useMemo, useState } from 'react';
import FilterBar from '~/components/FilterBar';
import localize from '~/constants/localize';
import RoundList from '~/components/RoundList';
import RankingsListItem from '~/components/RankingsListItem';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';

const myRankingLabel = localize('myRanking');
const top30Label = localize('top30');

export default function Rankings({
  channelId,
  rankingsTab,
  onSetRankingsTab
}: {
  channelId: number;
  onSetRankingsTab: (arg0: string) => void;
  rankingsTab: string;
}) {
  const loadWordleRankings = useAppContext(
    (v) => v.requestHelpers.loadWordleRankings
  );
  const [loading, setLoading] = useState(true);
  const [allRanks, setAllRanks] = useState([]);
  const [top30s, setTop30s] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const { userId: myId } = useKeyContext((v) => v.myState);
  const users = useMemo(
    () => (rankingsTab === 'all' ? allRanks : top30s),
    [allRanks, rankingsTab, top30s]
  );
  useEffect(() => {
    init();
    async function init() {
      const {
        all,
        top30s,
        myRank: loadedMyRank
      } = await loadWordleRankings(channelId);
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
      <div
        style={{
          height: '100%',
          overflow: 'scroll',
          width: '100%',
          paddingTop: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <RoundList style={{ marginTop: 0 }} width="35rem" mobileWidth="100%">
          {(users || []).map((user: { id: number }) => (
            <RankingsListItem
              small
              key={user.id}
              user={user}
              myId={myId}
              target="xpEarned"
              activityContext="wordleXP"
            />
          ))}
        </RoundList>
        <div style={{ width: '100%', padding: '1rem' }} />
      </div>
    </div>
  );
}
