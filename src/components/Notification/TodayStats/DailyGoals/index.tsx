import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Badge from './Badge';
import CollectRewardsButton from '~/components/Buttons/CollectRewardsButton';
import DailyBonusButton from '~/components/Buttons/DailyBonusButton';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { buildTodayStatsPatchFromDailyTaskStatus } from '~/helpers';

const badgeItems = ['W', 'G', 'A'];
const funFont =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

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
  const setDailyTaskRepairNoticeHidden = useAppContext(
    (v) => v.requestHelpers.setDailyTaskRepairNoticeHidden
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
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
  );
  const [ampedBadgeIndex, setAmpedBadgeIndex] = useState(0);
  const [purchasingRepair, setPurchasingRepair] = useState(false);
  const [savingRepairNoticeHidden, setSavingRepairNoticeHidden] =
    useState(false);
  const [isRepairNoticeCollapsed, setIsRepairNoticeCollapsed] = useState(false);
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
  const repairNoticeHidden = !!streakStatus.repairNoticeHidden;
  const hasEnoughCoins = (twinkleCoins || 0) >= repairCost;
  const nextStreak = repairableStreak + 1;
  const repairNoticeAccent = streakRepairAvailable
    ? Color.green()
    : Color.orange();
  const repairNoticeBackground = Color.white();
  const repairNoticeBorder = streakRepairAvailable
    ? Color.green(0.65)
    : Color.orange(0.62);
  const repairNoticeBadgeBackground = streakRepairAvailable
    ? Color.green()
    : Color.orange();
  const repairNoticeIcon = streakRepairAvailable
    ? 'sparkles'
    : 'triangle-exclamation';
  const repairNoticeTitleColor = streakRepairAvailable
    ? Color.armyGreen()
    : Color.brownOrange();
  const repairNoticeBodyColor = Color.darkBluerGray();
  const collapsedRepairNoticeBorder = streakRepairAvailable
    ? repairNoticeBorder
    : Color.darkGray();
  const collapsedRepairNoticeAccent = streakRepairAvailable
    ? repairNoticeAccent
    : Color.darkGray();

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
      setIsRepairNoticeCollapsed(false);
    }
  }, [streakAtRisk]);

  useEffect(() => {
    if (!streakAtRisk) {
      setIsRepairNoticeCollapsed(false);
      return;
    }
    setIsRepairNoticeCollapsed(repairNoticeHidden);
  }, [repairNoticeHidden, streakAtRisk]);

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
        isRepairNoticeCollapsed ? (
          <div
            className={css`
              margin: 0.9rem auto 0;
              max-width: 32rem;
              padding: 0.85rem 1rem;
              border-radius: 1rem;
              background: ${Color.white()};
              border: 2px solid ${collapsedRepairNoticeBorder};
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 0.7rem;
              text-align: center;
            `}
          >
            <div
              className={css`
                min-width: 0;
                width: 100%;
              `}
            >
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.55rem;
                  font-size: 1.05rem;
                  font-weight: 800;
                  color: ${collapsedRepairNoticeAccent};
                  font-family: ${funFont};
                  margin-bottom: 0.2rem;
                `}
              >
                <Icon icon={repairNoticeIcon} />
                <span>
                  {streakRepairAvailable ? 'Repair ready' : 'Streak repair'}
                </span>
              </div>
              <p
                className={css`
                  font-size: 1rem;
                  color: ${repairNoticeBodyColor};
                  line-height: 1.35;
                  margin: 0;
                `}
              >
                {streakRepairAvailable
                  ? `Restore ${repairableStreak} days by finishing all 3 tasks today.`
                  : `${repairCost.toLocaleString()} coins restores your ${repairableStreak}-day streak.`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExpandRepairNotice}
              className={css`
                border: 0;
                background: transparent;
                color: ${Color.darkBlueGray()};
                font-size: 1.05rem;
                font-weight: 700;
                padding: 0.2rem 0;
                cursor: pointer;
                font-family: ${funFont};
              `}
            >
              Show
            </button>
          </div>
        ) : (
          <div
            className={css`
              margin: 0.9rem auto 0;
              max-width: 32rem;
              padding: 1.1rem 1.15rem;
              border-radius: 1.1rem;
              background: ${repairNoticeBackground};
              border: 2px solid ${repairNoticeBorder};
              text-align: center;
            `}
          >
            <div
              className={css`
                display: flex;
                justify-content: center;
                align-items: flex-start;
                gap: 0.75rem;
                margin-bottom: 0.85rem;
                position: relative;
              `}
            >
              <div
                className={css`
                  display: inline-flex;
                  align-items: center;
                  gap: 0.55rem;
                  min-width: 0;
                  padding: 0.45rem 0.7rem;
                  border-radius: 999px;
                  background: ${repairNoticeBadgeBackground};
                  color: ${Color.white()};
                  font-size: 0.95rem;
                  font-weight: 800;
                  letter-spacing: 0.01em;
                  font-family: ${funFont};
                `}
              >
                <Icon icon={repairNoticeIcon} />
                <span>
                  {streakRepairAvailable ? 'Repair ready' : 'Streak at risk'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCollapseRepairNotice}
                className={css`
                  position: absolute;
                  right: 0;
                  top: 0;
                  border: 0;
                  background: transparent;
                  color: ${Color.darkBlueGray()};
                  display: inline-flex;
                  align-items: center;
                  gap: 0.45rem;
                  font-size: 0.95rem;
                  font-weight: 700;
                  cursor: pointer;
                  padding: 0.2rem 0;
                  font-family: ${funFont};
                `}
              >
                <Icon icon="times" />
                <span>Hide</span>
              </button>
            </div>
            <p
              className={css`
                font-size: 1.5rem;
                font-weight: 800;
                color: ${repairNoticeTitleColor};
                line-height: 1.3;
                margin-bottom: 0.45rem;
                font-family: ${funFont};
              `}
            >
              {streakRepairAvailable
                ? `Your ${repairableStreak}-day streak is protected`
                : `Save your ${repairableStreak}-day streak`}
            </p>
            <p
              className={css`
                font-size: 1.08rem;
                line-height: 1.5;
                color: ${repairNoticeBodyColor};
                margin-bottom: 0.9rem;
              `}
            >
              {streakRepairAvailable
                ? `Complete all 3 tasks today to continue to ${nextStreak} days.`
                : `You missed yesterday, but you can still repair the streak today and continue to ${nextStreak} days once all 3 tasks are done.`}
            </p>
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 0.55rem;
                margin-bottom: ${streakRepairAvailable ? '0' : '0.95rem'};
              `}
            >
              <div
                className={css`
                  display: inline-flex;
                  align-items: center;
                  gap: 0.4rem;
                  padding: 0.45rem 0.7rem;
                  border-radius: 999px;
                  background: ${Color.gold(0.16)};
                  color: ${Color.darkGold()};
                  font-size: 0.98rem;
                  font-weight: 700;
                  box-shadow: inset 0 0 0 1px ${Color.gold(0.45)};
                `}
              >
                <Icon icon="fire" />
                <span>{repairableStreak}-day streak</span>
              </div>
              <div
                className={css`
                  display: inline-flex;
                  align-items: center;
                  gap: 0.4rem;
                  padding: 0.45rem 0.7rem;
                  border-radius: 999px;
                  background: ${Color.logoBlue(0.15)};
                  color: ${Color.darkBlue()};
                  font-size: 0.98rem;
                  font-weight: 700;
                  box-shadow: inset 0 0 0 1px ${Color.logoBlue(0.4)};
                `}
              >
                <Icon icon="sparkles" />
                <span>Continue to {nextStreak} days</span>
              </div>
            </div>
            {!streakRepairAvailable && (
              <GameCTAButton
                icon="wrench"
                variant="orange"
                shiny
                loading={purchasingRepair}
                disabled={purchasingRepair || !hasEnoughCoins || repairCost < 1}
                onClick={handlePurchaseRepair}
                style={{ marginTop: '0.1rem' }}
              >
                {hasEnoughCoins
                  ? `Buy repair (${repairCost.toLocaleString()} coins)`
                  : `Need ${repairCost.toLocaleString()} coins (you have ${(twinkleCoins || 0).toLocaleString()})`}
              </GameCTAButton>
            )}
            {repairError && (
              <p
                className={css`
                  margin-top: 0.75rem;
                  font-size: 1.05rem;
                  color: ${Color.rose()};
                  font-weight: 700;
                  margin-bottom: 0;
                `}
              >
                {repairError}
              </p>
            )}
          </div>
        )
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
        onApplyTodayStatsProgress({
          newStats: buildTodayStatsPatchFromDailyTaskStatus(
            result.dailyTaskStatus
          )
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

  function handleCollapseRepairNotice() {
    void handleSetRepairNoticeCollapsed(true);
  }

  function handleExpandRepairNotice() {
    void handleSetRepairNoticeCollapsed(false);
  }

  async function handleSetRepairNoticeCollapsed(collapsed: boolean) {
    if (savingRepairNoticeHidden) return;

    setIsRepairNoticeCollapsed(collapsed);

    if (!streakAtRisk) return;

    try {
      setSavingRepairNoticeHidden(true);
      const result = await setDailyTaskRepairNoticeHidden(collapsed);
      if (result?.dailyTaskStatus) {
        onApplyTodayStatsProgress({
          newStats: buildTodayStatsPatchFromDailyTaskStatus(
            result.dailyTaskStatus
          )
        });
      }
    } catch (error) {
      console.error(error);
      setIsRepairNoticeCollapsed(!collapsed);
    } finally {
      setSavingRepairNoticeHidden(false);
    }
  }
}
