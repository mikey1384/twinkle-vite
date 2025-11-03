import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import LeaderboardList from '~/components/LeaderboardList';
import StreakItem from './StreakItem';
import { useAppContext } from '~/contexts';

export default function DoubleStreaks({
  channelId,
  myId,
  theme
}: {
  channelId: number;
  myId: number;
  theme: string;
}) {
  const [streakObj, setStreakObj] = useState({});
  const [streaks, setStreaks] = useState([]);
  const loadWordleDoubleStreaks = useAppContext(
    (v) => v.requestHelpers.loadWordleDoubleStreaks
  );
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    init();
    async function init() {
      const { bestStreaks, bestStreakObj } = await loadWordleDoubleStreaks(
        channelId
      );
      setStreakObj(bestStreakObj);
      setStreaks(bestStreaks);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loading ? (
    <Loading style={{ height: 'calc(100% - 6rem)' }} />
  ) : (
    <LeaderboardList
      height="100%"
      padding="0"
      mobilePadding="0"
      bottomPadding="0"
    >
      {streaks.map((streak, index) => (
        <StreakItem
          key={streak}
          rank={index + 1}
          streak={streak}
          streakObj={streakObj}
          theme={theme}
          myId={myId}
        />
      ))}
    </LeaderboardList>
  );
}
