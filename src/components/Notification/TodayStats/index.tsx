import React, { useState, useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useNotiContext, useAppContext, useKeyContext } from '~/contexts';
import { isCommunityFundRechargeAvailable } from '~/helpers/aiEnergy';
import { formatTodayAmount } from './todayAmounts';
import { useAgentScreenState } from '~/helpers/websiteAgentScreenState';
import DailyGoals from './DailyGoals';
import AchievementProgress from './AchievementProgress';
import TodayXPRankings from './TodayXPRankings';
import LiveNow, { useHeldWhileInteracting, useLiveNowApps } from './LiveNow';
import MyClassesRow from './MyClassesRow';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import AiEnergyCard from '~/components/AiEnergyCard';
import { themedCardBase } from '~/theme/card';
import { useThemedCardVars } from '~/theme/hooks/useThemedCardVars';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import AiEnergyDashboardModal from '~/components/AiEnergyDashboardModal';
import { FULL_RECHARGE_COST } from '~/components/AiEnergyDashboardModal/helpers';

const DEFAULT_PROGRESS_COLOR = 'rgba(65, 140, 235, 1)';
const DEFAULT_XP_NUMBER_COLOR = 'rgba(97, 226, 101, 1)';
const DEFAULT_REWARD_COLOR = 'rgba(255, 203, 50, 1)';
const DEFAULT_RECOMMENDATION_COLOR = 'rgba(245, 190, 70, 1)';

// Today's Progress lives in columns, never the full window: the phone menu
// drawer (70%), Home's right column (27%), Explore's side panel (31rem, 20rem
// on tablets). This frame is the query container, so the card and everything
// in it size from the card's OWN width (container queries), in both layouts.
// Breakpoints below are the card's outer width.
const cardFrame = css`
  container: today-card / inline-size;
`;

const container = css`
  ${themedCardBase};
  padding: 1.6rem 2rem;
  background: #fff;
  border: 1px solid var(--ui-border);
  @media (max-width: 767px) {
    border: 0;
    border-radius: 0;
  }
  @container today-card (max-width: 25.9rem) {
    /* Narrow columns (small-phone drawer, tablet side panel): less side air. */
    padding-left: 1rem;
    padding-right: 1rem;
  }
  @container today-card (max-width: 20.9rem) {
    /* The narrowest side panels: the normal title may wrap. */
    .today-title {
      white-space: normal !important;
    }
  }
`;

// Title and amounts on one line beside the trophy when they fit; otherwise the
// amounts drop to their own line under the title.
const compactHeader = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  .today-titles {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 0.6rem;
    row-gap: 0.1rem;
  }
  .today-titles > b {
    font-size: 1.6rem;
    white-space: nowrap;
  }
  .today-amounts {
    display: inline-flex;
    flex-wrap: wrap;
    column-gap: 0.8rem;
    font-size: 1.3rem;
    font-weight: bold;
  }
  .today-amounts > span {
    white-space: nowrap;
  }
  > button {
    flex: 0 0 auto;
  }
  @container today-card (min-width: 34rem) {
    gap: 1rem;
    .today-titles {
      column-gap: 1rem;
    }
  }
  @container today-card (max-width: 20.9rem) {
    /* Tablet side panels (20rem): the title wraps rather than overflow. */
    .today-titles > b {
      white-space: normal;
    }
  }
`;

// Goals and badges. Narrow cards (most real columns): the circle row, then the
// badge row, both at the compact size; badges go 3 + 2 when even 5 don't fit.
// Wide cards (34rem+): one row, badges after a hairline divider. DailyGoals'
// root steps aside (display: contents) so its rows are grid items; anything
// else it shows (streak repair, "Great job") spans the full width below.
const goalsAndBadgesCompactCls = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  align-items: center;
  .today-goals {
    display: contents;
  }
  .today-goals > * {
    grid-column: 1 / -1;
    justify-self: stretch;
  }
  .today-goals > .today-goals-row {
    grid-column: 1;
    grid-row: 1;
    justify-self: center;
  }
  .today-badges {
    grid-column: 1;
    grid-row: 2;
    margin-top: 0.2rem;
    max-width: 100%;
  }
  .today-badges > div {
    flex-wrap: wrap;
    justify-content: center;
  }
  @container today-card (min-width: 38.5rem) {
    grid-template-columns: auto auto;
    justify-content: center;
    .today-badges {
      grid-column: 2;
      grid-row: 1;
      margin-top: 0.6rem;
      margin-left: 0.4rem;
      padding-left: 0.4rem;
      border-left: 1px solid var(--ui-border);
    }
  }
`;

const header = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 0.5rem;
  @media (max-width: 1024px) {
    /* Stack title and button on tablets and below */
    flex-direction: column;
    align-items: center;
    /* Hide the left spacer to remove empty row */
    > div:first-child {
      display: none !important;
    }
    /* Center the trophy button under the title */
    > div:last-child {
      justify-content: center !important;
      margin-top: 0.5rem;
      width: 100%;
    }
  }
`;
const buttonRankTextClass = css`
  font-size: 1.2rem;
  font-weight: 700;
  margin-left: 0.35rem;
  display: inline-flex;
  align-items: center;
`;
const buttonRankTextOnlyClass = css`
  font-size: 1.2rem;
  font-weight: 700;
`;

const aiEnergyPanelCls = css`
  margin: 1rem auto 0.9rem;
  max-width: 40rem;
  padding: 1rem 1.05rem 1.05rem;
  border: 1px solid var(--ui-border);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.98);
  @container today-card (max-width: 25.9rem) {
    padding: 0.8rem 0.7rem 0.9rem;
  }
`;

const aiEnergyPanelButtonWrapCls = css`
  display: flex;
  justify-content: center;
  margin-top: 0.8rem;
  /* One line ("Open AI Energy") rather than an awkward wrap inside. */
  button {
    max-width: 100%;
    white-space: nowrap;
  }

  @media (max-width: 767px) {
    width: 100%;
  }
`;

interface AiUsagePolicy {
  dayIndex?: number;
  energyPercent?: number;
  energySegments?: number;
  energyRemaining?: number;
  resetCost?: number;
  communityFundRechargeCoinsRemaining?: number;
  currentMode?: 'full_quality' | 'low_energy';
  communityFundResetEligibility?: {
    eligible: boolean;
    requirements: Array<{
      key: string;
      done: boolean;
    }>;
  };
}

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
  const [aiEnergyDashboardModalShown, setAiEnergyDashboardModalShown] =
    useState(false);
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
  const myId = useKeyContext((v) => v.myState.userId);
  // Anyone live in an app: show Live now and compact the top of the card so
  // its height stays about the same. Nobody live: the card is unchanged.
  // A profile popup opened from a Live now face keeps the list (and the row)
  // in place until it closes, even if that app empties meanwhile.
  const [liveNowPopupOpen, setLiveNowPopupOpen] = useState(false);
  const { displayed: liveApps, handlers: liveNowHoldHandlers } =
    useHeldWhileInteracting(useLiveNowApps(myId), liveNowPopupOpen);
  const compact = liveApps.length > 0;
  const communityFunds = useKeyContext((v) => v.myState.communityFunds);
  const communityFundsLoaded = useKeyContext(
    (v) => v.myState.communityFundsLoaded
  );
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const aiUsagePolicy = todayStats?.aiUsagePolicy as AiUsagePolicy | null;
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const loadTodayRankings = useAppContext(
    (v) => v.requestHelpers.loadTodayRankings
  );

  const { cardVars } = useThemedCardVars({
    role: 'sectionPanel',
    intensity: 0.05
  });
  const energyPercentValue = Math.max(
    0,
    Math.min(100, Number(aiUsagePolicy?.energyPercent ?? 0))
  );
  const energySegments = Math.max(
    1,
    Number(aiUsagePolicy?.energySegments || 5)
  );
  const rechargeCost = Math.max(
    1,
    Number(aiUsagePolicy?.resetCost || FULL_RECHARGE_COST)
  );
  const energyIsEmpty = Number(aiUsagePolicy?.energyRemaining || 0) <= 0;
  const communityChargeAvailable = isCommunityFundRechargeAvailable({
    aiUsagePolicy,
    communityFunds,
    communityFundsKnown: communityFundsLoaded
  });
  const energyChargeAttentionKey = aiUsagePolicy
    ? [
        'today-stats',
        aiUsagePolicy.dayIndex || 'unknown',
        energyIsEmpty ? 'empty' : 'full',
        communityChargeAvailable ? 'free' : 'paid',
        rechargeCost
      ].join(':')
    : '';
  const energyButtonLabel = energyIsEmpty ? 'Charge' : 'Open AI Energy';

  // Hands Zero and Ciel today's progress card as shown: XP and Coins earned,
  // the user's rank, which daily tasks are done and the AI Energy left.
  useAgentScreenState(
    'todayProgress',
    todayStats?.loaded
      ? {
          xpEarned: Number(todayStats.xpEarned || 0),
          coinsEarned: Number(todayStats.coinsEarned || 0),
          todayRank: myTodayRank,
          dailyTasksDone: {
            wordle: (todayStats.achievedDailyGoals || []).includes('W'),
            grammarbles: (todayStats.achievedDailyGoals || []).includes('G'),
            aiStory: (todayStats.achievedDailyGoals || []).includes('A')
          },
          dailyRewardChecked: isDailyRewardChecked,
          dailyBonusButtonShown: isDailyBonusButtonShown,
          aiEnergyPercent: aiUsagePolicy ? energyPercentValue : null
        }
      : null,
    { background: true }
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchTodayRank() {
      if (Number(todayStats?.xpEarned || 0) > 0) {
        try {
          const { myTodayRank } = await loadTodayRankings({ limit: 1 });
          if (!cancelled) {
            setMyTodayRank(myTodayRank);
          }
        } catch (error) {
          if (!cancelled) {
            console.error('Error fetching today rank:', error);
          }
        }
      } else if (!cancelled) {
        setMyTodayRank(null);
      }
    }

    if (todayStats?.loaded) {
      fetchTodayRank();
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStats?.xpEarned, todayStats?.loaded]);

  const xpAmount = formatTodayAmount(Number(todayStats?.xpEarned || 0));
  const coinsAmount = formatTodayAmount(Number(todayStats?.coinsEarned || 0));
  const coinsLabel = Number(todayStats?.coinsEarned) === 1 ? 'Coin' : 'Coins';

  const trophyButton = (
    <Button
      onClick={() =>
        onUpdateTodayStats({
          newStats: { showXPRankings: !todayStats?.showXPRankings }
        })
      }
      color={buttonColor}
      style={{
        minWidth: '3.5rem',
        height: 'fit-content',
        marginTop: '0.2rem',
        padding: myTodayRank ? '0.3rem 0.5rem' : '0.5rem',
        fontSize: myTodayRank ? '1.5rem' : 'inherit',
        fontWeight: myTodayRank ? 'bold' : 'normal'
      }}
      variant={todayStats?.showXPRankings ? 'solid' : 'soft'}
      tone={!todayStats?.showXPRankings ? 'raised' : undefined}
    >
      {myTodayRank ? (
        myTodayRank <= 3 ? (
          <>
            <Icon icon="trophy" />
            <span className={buttonRankTextClass}>#{myTodayRank}</span>
          </>
        ) : (
          <span className={buttonRankTextOnlyClass}>#{myTodayRank}</span>
        )
      ) : (
        <Icon icon="trophy" />
      )}
    </Button>
  );

  return (
    <ErrorBoundary componentPath="Notification/TodayStats">
      <div className={cardFrame}>
        <div
          className={container}
          {...liveNowHoldHandlers}
          style={{
            marginBottom: '1rem',
            ...(compact
              ? { paddingTop: '1.2rem', paddingBottom: '1.2rem' }
              : {}),
            ...cardVars
          }}
        >
          {todayStats?.loaded ? (
            <div>
              {compact ? (
                <div className={compactHeader}>
                  <div className="today-titles">
                    <b style={{ color: todayProgressColor }}>
                      {`Today's Progress`}
                    </b>
                    <span className="today-amounts">
                      <span
                        style={{ color: xpNumberColor }}
                        title={
                          xpAmount.exact ? `${xpAmount.exact} XP` : undefined
                        }
                      >
                        {xpAmount.text} <b style={{ color: rewardColor }}>XP</b>
                      </span>
                      <span
                        style={{ color: coinsColor }}
                        title={
                          coinsAmount.exact
                            ? `${coinsAmount.exact} ${coinsLabel}`
                            : undefined
                        }
                      >
                        {coinsAmount.text} {coinsLabel}
                      </span>
                    </span>
                  </div>
                  {trophyButton}
                </div>
              ) : (
                <div className={header}>
                  <div style={{ flex: 1 }}></div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <b
                      className="today-title"
                      style={{
                        fontSize: '1.7rem',
                        color: todayProgressColor,
                        whiteSpace: 'nowrap'
                      }}
                    >{`Today's Progress`}</b>
                    <div style={{ marginTop: '0.3rem' }}>
                      <p
                        style={{ fontWeight: 'bold', color: xpNumberColor }}
                        title={
                          xpAmount.exact ? `${xpAmount.exact} XP` : undefined
                        }
                      >
                        <span>{xpAmount.text}</span>{' '}
                        <b style={{ color: rewardColor }}>XP</b>
                      </p>
                      <p
                        style={{ fontWeight: 'bold', color: coinsColor }}
                        title={
                          coinsAmount.exact
                            ? `${coinsAmount.exact} ${coinsLabel}`
                            : undefined
                        }
                      >
                        {coinsAmount.text} {coinsLabel}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }}
                  >
                    {trophyButton}
                  </div>
                </div>
              )}
              {/* One stable tree in both layouts: switching compact only swaps
                CSS, so AchievementProgress (which loads achievements on
                mount) and any open achievement window never remount. */}
              <div className={compact ? goalsAndBadgesCompactCls : undefined}>
                <DailyGoals
                  compact={compact}
                  achievedGoals={todayStats.achievedDailyGoals || []}
                  isChecked={isDailyRewardChecked}
                  isDailyBonusButtonShown={isDailyBonusButtonShown}
                />
                <AchievementProgress
                  compact={compact}
                  myAchievementsObj={myAchievementsObj}
                  onSetMyAchievementsObj={onSetMyAchievementsObj}
                />
              </div>
              {compact ? (
                <LiveNow
                  apps={liveApps}
                  myId={myId}
                  accentColor={todayProgressColor}
                  buttonColor={buttonColor}
                  onPopupOpenChange={setLiveNowPopupOpen}
                />
              ) : null}
              {/* approved teachers only: their classes (renders nothing otherwise) */}
              <MyClassesRow
                accentColor={todayProgressColor}
                buttonColor={buttonColor}
              />
              {!!aiUsagePolicy && (
                <div className={aiEnergyPanelCls}>
                  <AiEnergyCard
                    variant="inline"
                    wrapWhenNarrow
                    energyPercent={energyPercentValue}
                    energyPolicy={aiUsagePolicy}
                    energySegments={energySegments}
                    mode={aiUsagePolicy?.currentMode}
                    resetNeeded={energyIsEmpty}
                    resetCost={rechargeCost}
                    communityFundsEligible={communityChargeAvailable}
                    chargeCtaAttentionKey={energyChargeAttentionKey}
                    themeColor={buttonColor}
                  />
                  <div className={aiEnergyPanelButtonWrapCls}>
                    <Button
                      color={buttonColor}
                      variant="soft"
                      tone="raised"
                      size="sm"
                      uppercase={false}
                      onClick={() => setAiEnergyDashboardModalShown(true)}
                      style={{
                        minWidth: '10.5rem'
                      }}
                    >
                      <Icon icon="bolt" />
                      <span>{energyButtonLabel}</span>
                    </Button>
                  </div>
                </div>
              )}
              {todayStats.showXPRankings && <TodayXPRankings />}
              {aiEnergyDashboardModalShown && (
                <AiEnergyDashboardModal
                  modalLevel={3}
                  onHide={() => setAiEnergyDashboardModalShown(false)}
                />
              )}
            </div>
          ) : (
            <Loading />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
