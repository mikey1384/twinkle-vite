import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useKeyContext, useNotiContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import TwinkleLogo from './twinkle-logo.png';
import DailyGoals from './DailyGoals';
import AchievementProgress from './AchievementProgress';
import Loading from '~/components/Loading';

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
        style={{ marginBottom: '1rem', width: '100%' }}
        className={css`
          position: relative;
          padding: 1.5rem 0;
          text-align: center;
          border-radius: ${borderRadius};
          border: 1px solid ${Color.borderGray()};
          z-index: 0; // Ensure the container is behind the ::after pseudo-element
          &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url(${TwinkleLogo}) center center;
            background-size: auto 100%;
            background-position-x: 15%;
            opacity: 0.2;
            z-index: -1; // Place the pseudo-element behind the content
          }
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-left: 0;
            border-right: 0;
            &::after {
              background-position-x: 5%;
            }
          }
        `}
      >
        {todayStats?.loaded ? (
          <div>
            <div style={{ width: '100%' }}>
              <b
                className={css`
                  color: ${Color[todayProgressTextColor]()};
                  text-shadow: 0.05rem 0.05rem 0.1rem
                    ${Color[todayProgressTextColor](0.5)};
                  ${todayProgressTextShadowColor
                    ? `text-shadow: 0.05rem 0.05rem ${Color[
                        todayProgressTextShadowColor
                      ]()};`
                    : ''}
                `}
                style={{ fontSize: '1.7rem' }}
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
