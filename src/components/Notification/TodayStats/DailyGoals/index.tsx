import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Badge from './Badge';
import CollectRewardsButton from './CollectRewardsButton';
import DailyBonusButton from './DailyBonusButton';
import { useKeyContext, useNotiContext } from '~/contexts';
import { css } from '@emotion/css';

const badgeItems = ['W', 'G', 'A'];

export default function DailyGoals({
  isChecked,
  isDailyBonusButtonShown,
  dailyRewardModalShown,
  dailyBonusModalShown,
  achievedGoals,
  onCollectRewardButtonClick,
  onDailyBonusButtonClick
}: {
  isChecked: boolean;
  isDailyBonusButtonShown: boolean;
  dailyRewardModalShown: boolean;
  dailyBonusModalShown: boolean;
  achievedGoals: string[];
  onCollectRewardButtonClick: () => void;
  onDailyBonusButtonClick: () => void;
}) {
  const isAchieved = useCallback(
    (goal: any) => achievedGoals.includes(goal),
    [achievedGoals]
  );
  const { countdownCompleted } = useNotiContext((v) => v.state.todayStats);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const { isAchievementsLoaded } = useKeyContext((v) => v.myState);
  const [ampedBadgeIndex, setAmpedBadgeIndex] = useState(0);
  const intervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const allGoalsAchieved = useMemo(
    () => achievedGoals.length === badgeItems.length,
    [achievedGoals.length]
  );

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onUpdateTodayStats({
        newStats: {
          countdownCompleted: true
        }
      });
    }, 3000);
    intervalRef.current = setInterval(() => {
      setAmpedBadgeIndex((prevIndex: number) =>
        prevIndex < badgeItems.length - 1 ? prevIndex + 1 : 0
      );
    }, 200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAchievementsLoaded && countdownCompleted) {
      clearInterval(intervalRef.current);
    }
  }, [isAchievementsLoaded, countdownCompleted]);

  return (
    <div>
      <div
        style={{ marginTop: '0.5rem' }}
        className={css`
          display: flex;
          justify-content: center;
          align-items: center;
        `}
      >
        {badgeItems.map((item, index) => (
          <Badge
            key={item}
            isAmped={
              !(isAchievementsLoaded && countdownCompleted) &&
              index === ampedBadgeIndex
            }
            isAchieved={isAchieved(item)}
          >
            {item}
          </Badge>
        ))}
      </div>
      {allGoalsAchieved && (
        <div
          className={css`
            text-align: center;
            margin-top: 1.2rem;
            margin-bottom: 1rem;
          `}
        >
          <p
            className={css`
              font-size: 1.2rem;
              font-weight: bold;
              color: #333;
              margin-bottom: 1rem;
            `}
          >
            {`Great job! You've completed the daily goals!`}
          </p>
          {isDailyBonusButtonShown ? (
            <DailyBonusButton
              onClick={onDailyBonusButtonClick}
              dailyBonusModalShown={dailyBonusModalShown}
            />
          ) : (
            <CollectRewardsButton
              isChecked={isChecked}
              onClick={onCollectRewardButtonClick}
              dailyRewardModalShown={dailyRewardModalShown}
            />
          )}
        </div>
      )}
    </div>
  );
}
