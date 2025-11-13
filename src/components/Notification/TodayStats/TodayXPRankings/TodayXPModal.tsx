import React, { useState, useEffect, useRef } from 'react';
import Button from '~/components/Button';
import FilterBar from '~/components/FilterBar';
import Loading from '~/components/Loading';
import Modal from '~/components/Modal';
import RankingsListItem from '~/components/RankingsListItem';import { useKeyContext, useAppContext } from '~/contexts';
import LeaderboardList from '~/components/LeaderboardList';

const myRankingLabel = 'My Ranking';
const top30Label = 'Top 30';

export default function TodayXPModal({ onHide }: { onHide: () => void }) {
  const myId = useKeyContext((v) => v.myState.userId);
  const loadAllTodayRankings = useAppContext(
    (v) => v.requestHelpers.loadAllTodayRankings
  );
  const loadTop30TodayRankings = useAppContext(
    (v) => v.requestHelpers.loadTop30TodayRankings
  );

  const [loading, setLoading] = useState(true);
  const [allRankings, setAllRankings] = useState<any[]>([]);
  const [top30Rankings, setTop30Rankings] = useState<any[]>([]);
  const [myTodayRank, setMyTodayRank] = useState<number | null>(null);

  const [rankingsTab, setRankingsTab] = useState('top30');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
    async function init() {
      try {
        const [allData, top30Data] = await Promise.all([
          loadAllTodayRankings(),
          loadTop30TodayRankings()
        ]);

        setAllRankings(allData.all || []);
        setTop30Rankings(top30Data.all || []);
        setMyTodayRank(allData.myTodayRank || top30Data.myTodayRank || null);

        const userHasRank = allData.myTodayRank || top30Data.myTodayRank;
        setRankingsTab(userHasRank ? 'all' : 'top30');

        setLoading(false);
      } catch (error) {
        console.error('Failed to load rankings:', error);
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to top when tab changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [rankingsTab]);

  return (
    <Modal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Today's XP Rankings</header>
      <main style={{ padding: 0, marginTop: 0 }}>
        {loading ? (
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
            {myTodayRank && (
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
                  onClick={() => setRankingsTab('all')}
                >
                  {myRankingLabel}
                </nav>
                <nav
                  className={rankingsTab === 'top30' ? 'active' : ''}
                  onClick={() => setRankingsTab('top30')}
                >
                  {top30Label}
                </nav>
              </FilterBar>
            )}
            {allRankings.length > 0 || top30Rankings.length > 0 ? (
              <LeaderboardList
                height="100%"
                width="35rem"
                listRef={scrollContainerRef}
                padding="2rem 1rem 3.5rem"
                mobilePadding="1.5rem 0.75rem 3rem"
              >
                {(myTodayRank && rankingsTab === 'all'
                  ? allRankings
                  : top30Rankings
                ).map((user: any) => (
                  <RankingsListItem
                    small
                    key={user.id}
                    user={user}
                    myId={myId}
                    target="xpEarned"
                    activityContext="subjectPostXP"
                  />
                ))}
              </LeaderboardList>
            ) : (
              <div
                style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: '#999',
                  fontStyle: 'italic'
                }}
              >
                No XP has been earned by anyone today yet.
                <br />
                Be the first to start earning!
              </div>
            )}
          </div>
        )}
      </main>
      <footer>
        <Button variant="ghost" onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
