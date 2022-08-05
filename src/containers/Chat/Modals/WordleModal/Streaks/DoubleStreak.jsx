import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import RoundList from '~/components/RoundList';
import StreakItem from './StreakItem';
import { useAppContext } from '~/contexts';

DoubleStreaks.propTypes = {
  channelId: PropTypes.number,
  myId: PropTypes.number,
  theme: PropTypes.string
};

export default function DoubleStreaks({ channelId, myId, theme }) {
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
