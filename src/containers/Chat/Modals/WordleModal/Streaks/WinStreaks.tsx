import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import RoundList from '~/components/RoundList';
import StreakItem from './StreakItem';
import { useAppContext } from '~/contexts';

export default function WinStreaks({
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
  const loadWordleStreaks = useAppContext(
    (v) => v.requestHelpers.loadWordleStreaks
  );
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    init();
    async function init() {
      const { bestStreaks, bestStreakObj } = await loadWordleStreaks(channelId);
      setStreakObj(bestStreakObj);
      setStreaks(bestStreaks);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loading ? (
    <Loading style={{ height: 'CALC(100% - 6rem)' }} />
  ) : (
    <RoundList style={{ marginTop: 0 }}>
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
    </RoundList>
  );
}
