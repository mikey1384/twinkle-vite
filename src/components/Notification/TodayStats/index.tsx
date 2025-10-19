import React, { useState, useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useNotiContext, useAppContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import DailyGoals from './DailyGoals';
import AchievementProgress from './AchievementProgress';
import TodayXPRankings from './TodayXPRankings';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { themedCardBase } from '~/theme/themedCard';
import { Color } from '~/constants/css';
import { useThemedCardVars } from '~/theme/useThemedCardVars';
import { useRoleColor } from '~/theme/useRoleColor';

const DEFAULT_PROGRESS_COLOR = 'rgba(65, 140, 235, 1)';
const DEFAULT_PROGRESS_ACCENT = 'rgba(65, 140, 235, 0.24)';
const DEFAULT_XP_NUMBER_COLOR = 'rgba(97, 226, 101, 1)';
const DEFAULT_REWARD_COLOR = 'rgba(255, 203, 50, 1)';
const DEFAULT_RECOMMENDATION_COLOR = 'rgba(245, 190, 70, 1)';
const DEFAULT_CARD_BORDER = 'rgba(204, 204, 204, 0.65)';

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
  const todayProgressRole = useRoleColor('todayProgressText', {
    fallback: 'logoBlue'
  });
  const xpNumberRole = useRoleColor('xpNumber', { fallback: 'logoGreen' });
  const buttonRole = useRoleColor('button', { fallback: 'logoBlue' });
  const recommendationRole = useRoleColor('recommendation', {
    fallback: 'brownOrange'
  });

  const todayProgressColor =
    todayProgressRole.getColor() || DEFAULT_PROGRESS_COLOR;
  const xpNumberColor = xpNumberRole.getColor() || DEFAULT_XP_NUMBER_COLOR;

  const rewardColor = DEFAULT_REWARD_COLOR;

  const coinsColor =
    recommendationRole.getColor() || DEFAULT_RECOMMENDATION_COLOR;

  const buttonColor = buttonRole.colorKey;
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const loadTodayRankings = useAppContext(
    (v) => v.requestHelpers.loadTodayRankings
  );

  const progressAccent =
    todayProgressRole.getColor(0.24) || DEFAULT_PROGRESS_ACCENT;
  const { cardVars } = useThemedCardVars({
    accentColor: progressAccent,
    intensity: 0.05,
    blendWeight: 0.98,
    borderFallback: DEFAULT_CARD_BORDER
  });

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
          ...cardVars,
          ['--themed-card-bg' as any]: '#ffffff',
          ['--themed-card-border' as any]: Color.borderGray(0.6)
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
                    color: todayProgressColor,
                    textShadow: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >{`Today's Progress`}</b>
                <div style={{ marginTop: '0.3rem', width: '100%' }}>
                  <p style={{ fontWeight: 'bold', color: xpNumberColor }}>
                    <span
                      style={{
                        textShadow: 'none'
                      }}
                    >
                      {todayStats.xpEarned > 0 ? '+' : ''}
                      {addCommasToNumber(todayStats.xpEarned)}
                    </span>{' '}
                    <b style={{ color: rewardColor, textShadow: 'none' }}>XP</b>
                  </p>
                  <p
                    style={{
                      fontWeight: 'bold',
                      color: coinsColor,
                      textShadow: 'none'
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
