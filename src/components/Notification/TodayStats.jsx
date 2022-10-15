import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import { useNotiContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import Loading from '~/components/Loading';

export default function TodayStats() {
  const todayStats = useNotiContext((v) => v.state.todayStats);

  return (
    <ErrorBoundary componentPath="Notification/TodayStats">
      <div
        style={{ marginBottom: '1rem' }}
        className={css`
          padding: 1.5rem 0;
          text-align: center;
          border-radius: ${borderRadius};
          border: 1px solid ${Color.borderGray()};
          background: #fff;
        `}
      >
        {todayStats?.loaded ? (
          <div>
            <b style={{ fontSize: '1.7rem' }}>{`Today's Progress`}</b>
            <div style={{ marginTop: '1rem' }}>
              <p>XP Earned: {addCommasToNumber(todayStats.xpEarned)}</p>
              <p>Coins Earned: {addCommasToNumber(todayStats.coinsEarned)}</p>
            </div>
          </div>
        ) : (
          <Loading />
        )}
      </div>
    </ErrorBoundary>
  );
}
