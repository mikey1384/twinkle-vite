import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import RoundList from '~/components/RoundList';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import StreakItem from './StreakItem';

Streaks.propTypes = {
  channelId: PropTypes.number.isRequired
};

export default function Streaks({ channelId }) {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const loadWordleStreaks = useAppContext(
    (v) => v.requestHelpers.loadWordleStreaks
  );
  const [loading, setLoading] = useState(true);
  const [streakObj, setStreakObj] = useState({});
  const [streaks, setStreaks] = useState([]);
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
        className={css`
          padding-left: 1rem;
          padding-right: 1rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding-left: 0;
            padding-right: 0;
          }
        `}
      >
        <RoundList style={{ marginTop: 0 }}>
          {streaks.map((streak, index) => (
            <StreakItem
              key={streak}
              rank={index + 1}
              streak={streak}
              streakObj={streakObj}
              myId={myId}
            />
          ))}
        </RoundList>
        <div style={{ width: '100%', padding: '1rem' }} />
      </div>
    </div>
  );
}
