import React, { useState, useEffect, useRef } from 'react';
import Button from '~/components/Button';
import FilterBar from '~/components/FilterBar';
import Loading from '~/components/Loading';
import Modal from '~/components/Modal';
import RankingsListItem from '~/components/RankingsListItem';
import RoundList from '~/components/RoundList';
import localize from '~/constants/localize';
import { useKeyContext, useAppContext } from '~/contexts';

const myRankingLabel = localize('myRanking');
const top30Label = localize('top30');

export default function TodayXPModal({ onHide }: { onHide: () => void }) {
  const { userId: myId } = useKeyContext((v) => v.myState);
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
    <Modal onHide={onHide}>
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
            <div
              ref={scrollContainerRef}
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
              {allRankings.length > 0 || top30Rankings.length > 0 ? (
                <RoundList
                  style={{ marginTop: 0 }}
                  width="35rem"
                  mobileWidth="100%"
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
                </RoundList>
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
              <div style={{ width: '100%', padding: '1rem' }} />
            </div>
          </div>
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
