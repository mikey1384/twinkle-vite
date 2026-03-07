import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Badge from './Badge';
import Button from '~/components/Button';
import CollectRewardsButton from '~/components/Buttons/CollectRewardsButton';
import DailyBonusButton from '~/components/Buttons/DailyBonusButton';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

const badgeItems = ['W', 'G', 'A'];

export default function DailyGoals({
  isChecked,
  isDailyBonusButtonShown,
  achievedGoals
}: {
  isChecked: boolean;
  isDailyBonusButtonShown: boolean;
  achievedGoals: string[];
}) {
  const { userId, isAchievementsLoaded, twinkleCoins } = useKeyContext(
    (v) => v.myState
  );
  const purchaseDailyTaskRepair = useAppContext(
    (v) => v.requestHelpers.purchaseDailyTaskRepair
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const isAchieved = useCallback(
    (goal: any) => achievedGoals.includes(goal),
    [achievedGoals]
  );
  const { countdownCompleted, dailyTaskStatus } = useNotiContext(
    (v) => v.state.todayStats
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const [ampedBadgeIndex, setAmpedBadgeIndex] = useState(0);
  const [purchasingRepair, setPurchasingRepair] = useState(false);
  const [repairError, setRepairError] = useState('');
  const intervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const allGoalsAchieved = useMemo(
    () => achievedGoals.length === badgeItems.length,
    [achievedGoals.length]
  );
  const streakStatus = dailyTaskStatus?.streak || {};
  const repairableStreak = Math.max(
    0,
    Number(streakStatus.repairableStreak) || 0
  );
  const repairCost = Math.max(0, Number(streakStatus.repairCost) || 0);
  const streakAtRisk = !!streakStatus.streakAtRisk && repairableStreak > 0;
  const streakRepairAvailable = !!streakStatus.streakRepairAvailable;
  const hasEnoughCoins = (twinkleCoins || 0) >= repairCost;

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

  useEffect(() => {
    if (!streakAtRisk) {
      setRepairError('');
      setPurchasingRepair(false);
    }
  }, [streakAtRisk]);

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
      {streakAtRisk && (
        <div
          className={css`
            margin: 0.9rem auto 0;
            max-width: 32rem;
            padding: 1rem 1.1rem;
            border-radius: 1rem;
            background: ${streakRepairAvailable
              ? Color.green(0.08)
              : Color.rose(0.08)};
            border: 1px solid
              ${streakRepairAvailable
                ? Color.green(0.24)
                : Color.rose(0.24)};
            text-align: center;
          `}
        >
          <p
            className={css`
              font-size: 1.2rem;
              font-weight: 800;
              color: ${streakRepairAvailable
                ? Color.green()
                : Color.rose()};
              margin-bottom: 0.45rem;
            `}
          >
            {streakRepairAvailable
              ? 'Daily Tasks repair ready'
              : 'Daily Tasks streak at risk'}
          </p>
          <p
            className={css`
              font-size: 1.1rem;
              line-height: 1.5;
              color: ${Color.darkerGray()};
              margin-bottom: ${streakRepairAvailable ? '0' : '0.9rem'};
            `}
          >
            {streakRepairAvailable
              ? `Complete all 3 tasks today to restore your ${repairableStreak}-day streak and continue to ${repairableStreak + 1} days.`
              : `You missed yesterday. Restore your ${repairableStreak}-day Daily Tasks streak today and continue to ${repairableStreak + 1} days when you complete all 3 tasks.`}
          </p>
          {!streakRepairAvailable && (
            <Button
              variant="solid"
              color="orange"
              loading={purchasingRepair}
              disabled={purchasingRepair || !hasEnoughCoins || repairCost < 1}
              onClick={handlePurchaseRepair}
            >
              <Icon icon="wrench" style={{ marginRight: '0.5rem' }} />
              {hasEnoughCoins
                ? `Restore Streak (${repairCost.toLocaleString()} coins)`
                : `Need ${repairCost.toLocaleString()} coins (you have ${(twinkleCoins || 0).toLocaleString()})`}
            </Button>
          )}
          {repairError && (
            <p
              className={css`
                margin-top: 0.75rem;
                font-size: 1.05rem;
                color: ${Color.rose()};
                font-weight: 700;
              `}
            >
              {repairError}
            </p>
          )}
        </div>
      )}
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
            <DailyBonusButton />
          ) : (
            <CollectRewardsButton isChecked={isChecked} />
          )}
        </div>
      )}
    </div>
  );

  async function handlePurchaseRepair() {
    if (purchasingRepair || !streakAtRisk || streakRepairAvailable) return;

    setPurchasingRepair(true);
    setRepairError('');
    try {
      const result = await purchaseDailyTaskRepair();
      if (typeof result?.newBalance === 'number') {
        onSetUserState({
          userId,
          newState: { twinkleCoins: result.newBalance }
        });
      }
      if (result?.dailyTaskStatus) {
        onUpdateTodayStats({
          newStats: {
            achievedDailyGoals: result.dailyTaskStatus.achievedDailyGoals || [],
            dailyTaskStatus: result.dailyTaskStatus,
            dailyTaskStreak: result.dailyTaskStatus?.streak?.currentStreak || 0,
            dailyTaskBestStreak:
              result.dailyTaskStatus?.streak?.longestStreak || 0
          }
        });
      }
    } catch (error) {
      console.error(error);
      setRepairError(
        typeof (error as any)?.message === 'string' && (error as any).message
          ? (error as any).message
          : 'Failed to purchase Daily Tasks streak repair'
      );
    } finally {
      setPurchasingRepair(false);
    }
  }
}
