import React, { useState, useEffect, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color, getThemeStyles } from '~/constants/css';
import { css } from '@emotion/css';
import { useKeyContext, useNotiContext, useAppContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import DailyGoals from './DailyGoals';
import AchievementProgress from './AchievementProgress';
import TodayXPRankings from './TodayXPRankings';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { themedCardBase } from '~/theme/themedCard';

function blendWithWhite(color: string, weight: number) {
  const match = color
    .replace(/\s+/g, '')
    .match(/rgba?\(([\d.]+),([\d.]+),([\d.]+)(?:,([\d.]+))?\)/i);
  if (!match) return '#f8f9ff';
  const [, r, g, b, a] = match;
  const w = Math.max(0, Math.min(1, weight));
  const mix = (channel: number) => Math.round(channel * (1 - w) + 255 * w);
  const alpha = a ? Number(a) : 1;
  return `rgba(${mix(Number(r))}, ${mix(Number(g))}, ${mix(
    Number(b)
  )}, ${alpha.toFixed(3)})`;
}

const container = css`
  ${themedCardBase};
  position: relative;
  padding: 1.6rem 2rem;
  text-align: center;
  overflow: hidden;
`;

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
  const [myTodayRank, setMyTodayRank] = useState<number | null>(null);
  const todayProgressTextColor = useKeyContext(
    (v) => v.theme.todayProgressText.color
  );
  const todayProgressTextShadowColor = useKeyContext(
    (v) => v.theme.todayProgressText.shadow
  );
  const xpNumberColor = useKeyContext((v) => v.theme.xpNumber.color);
  const buttonColor = useKeyContext((v) => v.theme.button.color);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const loadTodayRankings = useAppContext(
    (v) => v.requestHelpers.loadTodayRankings
  );

  const panelBg = useMemo(() => {
    const accent =
      Color[todayProgressTextColor as keyof typeof Color]?.(0.24) ||
      getThemeStyles((profileTheme || 'logoBlue') as string, 0.06).hoverBg ||
      '#f0f4ff';
    return blendWithWhite(accent, 0.93);
  }, [profileTheme, todayProgressTextColor]);

  useEffect(() => {
    async function fetchTodayRank() {
      if (Number(todayStats?.xpEarned || 0) > 0) {
        try {
          const { myTodayRank } = await loadTodayRankings({ limit: 1 });
          setMyTodayRank(myTodayRank);
        } catch (error) {
          console.error('Error fetching today rank:', error);
        }
      } else {
        setMyTodayRank(null);
      }
    }

    if (todayStats?.loaded) {
      fetchTodayRank();
    }
  }, [todayStats?.xpEarned, todayStats?.loaded, loadTodayRankings]);

  return (
    <ErrorBoundary componentPath="Notification/TodayStats">
      <div
        className={container}
        style={{
          marginBottom: '1rem',
          width: '100%',
          ['--themed-card-bg' as any]: panelBg,
          ['--themed-card-border' as any]: Color.borderGray(0.65)
        }}
      >
        {todayStats?.loaded ? (
          <div>
            <div
              className={css`
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                width: 100%;
                margin-bottom: 0.5rem;
              `}
            >
              <div style={{ flex: 1 }}></div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <b
                  style={{
                    fontSize: '1.7rem',
                    color: Color[todayProgressTextColor](),
                    textShadow: todayProgressTextShadowColor
                      ? `0.05rem 0.05rem ${Color[
                          todayProgressTextShadowColor
                        ]()}`
                      : `0.05rem 0.05rem 0.1rem ${Color[todayProgressTextColor](
                          0.5
                        )}`,
                    whiteSpace: 'nowrap'
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
              <div
                style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}
              >
                <Button
                  onClick={() =>
                    onUpdateTodayStats({
                      newStats: { showXPRankings: !todayStats.showXPRankings }
                    })
                  }
                  color={buttonColor}
                  filled={todayStats.showXPRankings}
                  style={{
                    minWidth: '3.5rem',
                    height: 'fit-content',
                    marginTop: '0.2rem',
                    padding: myTodayRank ? '0.3rem 0.5rem' : '0.5rem',
                    fontSize: myTodayRank ? '1.5rem' : 'inherit',
                    fontWeight: myTodayRank ? 'bold' : 'normal'
                  }}
                  variant={todayStats.showXPRankings ? 'solid' : 'soft'}
                  tone={!todayStats.showXPRankings ? 'raised' : undefined}
                >
                  {myTodayRank ? (
                    myTodayRank <= 3 ? (
                      <>
                        <Icon icon="trophy" />
                        <span style={{ marginLeft: '0.3rem' }}>
                          #{myTodayRank}
                        </span>
                      </>
                    ) : (
                      <span>#{myTodayRank}</span>
                    )
                  ) : (
                    <Icon icon="trophy" />
                  )}
                </Button>
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
            {todayStats.showXPRankings && <TodayXPRankings />}
          </div>
        ) : (
          <Loading />
        )}
      </div>
    </ErrorBoundary>
  );
}
