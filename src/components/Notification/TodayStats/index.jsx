import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useKeyContext, useNotiContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import MissionLink from './MissionLink';
import Loading from '~/components/Loading';

export default function TodayStats() {
  const theme = useKeyContext((v) => v.theme);
  const {
    todayProgressText: {
      color: todayProgressTextColor,
      shadow: todayProgressTextShadowColor
    },
    xpNumber: { color: xpNumberColor }
  } = theme;
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
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-left: 0;
            border-right: 0;
          }
        `}
      >
        {todayStats?.loaded ? (
          <div>
            <div>
              <b
                className={css`
                  color: ${Color[todayProgressTextColor]()};
                  ${todayProgressTextShadowColor
                    ? `text-shadow: 0.05rem 0.05rem ${Color[
                        todayProgressTextShadowColor
                      ]()};`
                    : ''}
                `}
                style={{ fontSize: '1.7rem' }}
              >{`Today's Progress`}</b>
              <div style={{ marginTop: '0.3rem' }}>
                <p
                  style={{
                    fontWeight: 'bold',
                    color: Color[xpNumberColor]()
                  }}
                >
                  {todayStats.xpEarned > 0 ? '+' : ''}
                  {addCommasToNumber(todayStats.xpEarned)}{' '}
                  <b style={{ color: Color.gold() }}>XP</b>
                </p>
                <p style={{ fontWeight: 'bold', color: Color.brownOrange() }}>
                  {todayStats.coinsEarned > 0 ? '+' : ''}
                  {addCommasToNumber(todayStats.coinsEarned)} Coin
                  {todayStats.coinsEarned === 1 ? '' : 's'}
                </p>
                {todayStats.nextMission ? (
                  <MissionLink
                    rootMissionType={todayStats.nextMission.rootMissionType}
                    missionName={todayStats.nextMission.title}
                    missionType={todayStats.nextMission.missionType}
                    xpReward={todayStats.nextMission.xpReward}
                    coinReward={todayStats.nextMission.coinReward}
                  />
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <Loading />
        )}
      </div>
    </ErrorBoundary>
  );
}
