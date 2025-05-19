import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { useKeyContext, useNotiContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import DailyGoals from './DailyGoals';
import AchievementProgress from './AchievementProgress';
import Loading from '~/components/Loading';
import { container } from './styles';

export default function TodayStats({
  isDailyRewardChecked,
  isDailyBonusButtonShown,
  myAchievementsObj,
  onSetMyAchievementsObj
}: {
  isDailyRewardChecked: boolean;
  isDailyBonusButtonShown: boolean;
  myAchievementsObj: any;
  onSetMyAchievementsObj: (myAchievementsObj: any) => void;
}) {
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
        className={container}
        style={{ marginBottom: '1rem', width: '100%' }}
      >
        {todayStats?.loaded ? (
          <div>
            <div style={{ width: '100%' }}>
              <b
                style={{
                  fontSize: '1.7rem',
                  color: Color[todayProgressTextColor](),
                  textShadow: todayProgressTextShadowColor
                    ? `0.05rem 0.05rem ${Color[todayProgressTextShadowColor]()}`
                    : `0.05rem 0.05rem 0.1rem ${Color[todayProgressTextColor](
                        0.5
                      )}`
                }}
              >{`Today's Progress`}</b>
              <div style={{ marginTop: '0.3rem', width: '100%' }}>
                <p
                  style={{
                    fontWeight: 'bold',
                    color: Color[xpNumberColor]()
                  }}
                >
                  <span
                    style={{
                      textShadow: `0.05rem 0.05rem 0.1rem ${Color[
                        xpNumberColor
                      ](0.5)}`
                    }}
                  >
                    {todayStats.xpEarned > 0 ? '+' : ''}
                    {addCommasToNumber(todayStats.xpEarned)}
                  </span>{' '}
                  <b
                    style={{
                      color: Color.gold(),
                      textShadow: `0.05rem 0.05rem 0.1rem ${Color.gold(0.5)}`
                    }}
                  >
                    XP
                  </b>
                </p>
                <p
                  style={{
                    fontWeight: 'bold',
                    color: Color.brownOrange(),
                    textShadow: `0.05rem 0.05rem 0.1rem ${Color.brownOrange(
                      0.5
                    )}`
                  }}
                >
                  {todayStats.coinsEarned > 0 ? '+' : ''}
                  {addCommasToNumber(todayStats.coinsEarned)} Coin
                  {todayStats.coinsEarned === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <DailyGoals
              achievedGoals={todayStats.achievedDailyGoals}
              isChecked={isDailyRewardChecked}
              isDailyBonusButtonShown={isDailyBonusButtonShown}
            />
            <AchievementProgress
              myAchievementsObj={myAchievementsObj}
              onSetMyAchievementsObj={onSetMyAchievementsObj}
            />
          </div>
        ) : (
          <Loading />
        )}
      </div>
    </ErrorBoundary>
  );
}
