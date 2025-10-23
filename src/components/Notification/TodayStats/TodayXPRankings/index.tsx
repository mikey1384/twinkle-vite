import React, { useEffect, useMemo, useState } from 'react';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import RankingsListItem from '~/components/RankingsListItem';
import Loading from '~/components/Loading';
import TodayXPModal from './TodayXPModal';
import { useRoleColor } from '~/theme/useRoleColor';
import LeaderboardList from '~/components/LeaderboardList';

export default function TodayXPRankings() {
  const myId = useKeyContext((v) => v.myState.userId);
  const progressRole = useRoleColor('todayProgressText', {
    fallback: 'logoBlue'
  });
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

  const progressColor = useMemo(
    () => progressRole.getColor() || Color.logoBlue(),
    [progressRole]
  );

  if (!todayStats?.todayXPRankingLoaded) {
    return <Loading style={{ height: '7rem' }} />;
  }
  return (
    <div style={{ marginTop: '1rem' }}>
      <div
        style={{
          fontWeight: 'bold',
          fontSize: '1.4rem',
          color: progressColor,
          marginBottom: '1rem'
        }}
      >
        Today's XP Rankings
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
        <LeaderboardList
          scrollable={false}
          padding="0"
          mobilePadding="0"
          bottomPadding="0"
          gap="0.75rem"
        >
          {todayStats?.todayXPRanking?.map((user: any) => (
            <RankingsListItem
              key={user.id}
              user={user}
              myId={myId}
              target="xpEarned"
              activityContext="subjectPostXP"
              small
            />
          ))}
        </LeaderboardList>
      )}

      {todayStats?.todayXPRankingHasMore && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <a
            style={{
              fontWeight: 'bold',
              cursor: 'pointer',
              color: progressColor
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
