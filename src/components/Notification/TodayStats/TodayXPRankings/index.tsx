import React, { useEffect, useState } from 'react';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import RoundList from '~/components/RoundList';
import RankingsListItem from '~/components/RankingsListItem';
import Loading from '~/components/Loading';
import TodayXPModal from './TodayXPModal';

export default function TodayXPRankings() {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const theme = useKeyContext((v) => v.theme);
  const {
    todayProgressText: { color: todayProgressTextColor }
  } = theme;
  const loadTodayRankings = useAppContext(
    (v) => v.requestHelpers.loadTodayRankings
  );
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function fetchInitialRankings() {
      try {
        const { all, hasMore: moreExist } = await loadTodayRankings();

        onUpdateTodayStats({
          newStats: {
            todayXPRanking: all || [],
            todayXPRankingLoaded: true,
            todayXPRankingHasMore: moreExist || false
          }
        });
      } catch (error) {
        console.error('Failed to load today rankings:', error);
      }
    }

    if (todayStats?.loaded) {
      fetchInitialRankings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStats?.xpEarned]);

  if (!todayStats?.todayXPRankingLoaded) {
    return <Loading style={{ height: '7rem' }} />;
  }
  return (
    <div style={{ marginTop: '1rem' }}>
      <div
        style={{
          fontWeight: 'bold',
          fontSize: '1.4rem',
          color: Color[todayProgressTextColor](),
          marginBottom: '1rem'
        }}
      >
        Today's XP Ranking
      </div>

      {todayStats?.todayXPRanking?.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: Color.darkerGray(),
            fontSize: '1.3rem',
            fontStyle: 'italic'
          }}
        >
          No one has earned XP today yet. Be the first!
        </div>
      ) : (
        <RoundList style={{ marginTop: 0 }}>
          {todayStats?.todayXPRanking?.map((user: any) => (
            <RankingsListItem
              key={user.id}
              user={user}
              myId={myId}
              target="xpEarned"
              activityContext="subjectPostXP"
              small
              style={{
                padding: user.id === myId ? '1rem' : '0.8rem'
              }}
            />
          ))}
        </RoundList>
      )}

      {todayStats?.todayXPRankingHasMore && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <a
            style={{
              fontWeight: 'bold',
              cursor: 'pointer',
              color: Color[todayProgressTextColor]()
            }}
            onClick={handleShowMore}
          >
            Show more
          </a>
        </div>
      )}

      {showModal && <TodayXPModal onHide={() => setShowModal(false)} />}
    </div>
  );

  function handleShowMore() {
    setShowModal(true);
  }
}
