import React, { useEffect, useMemo, useState } from 'react';
import NextDayCountdown from '~/components/NextDayCountdown';
import ErrorBoundary from '~/components/ErrorBoundary';
import Marble from '../Marble';
import TodayResult from './TodayResult';
import DailyGoals from '../DailyGoals';
import {
  useAppContext,
  useHomeContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { buildTodayStatsPatchFromDailyTaskStatus, isMobile } from '~/helpers';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import {
  scoreTable,
  perfectScoreBonus,
  fullClearBonusMultiplier,
  allPerfectBonusMultiplier
} from '../constants';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import ReviewSkeletonList from '~/components/SkeletonLoader';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import NeonButton from '../ClassicArcade/NeonButton';
import { LOGO_SRC, NEON, PIXEL_FONT, bob, rgba } from '../ClassicArcade/theme';
// removed pre-play of correct sound to avoid iOS beeps on start screen

const grammarGameLabel = 'Grammarbles';
const deviceIsMobile = isMobile(navigator);

const funFont =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

export default function StartScreen({
  onGameStart,
  timesPlayedToday,
  onSetTimesPlayedToday,
  loading,
  readyToBegin,
  onSetDailyTaskUnlocked
}: {
  loading: boolean;
  onGameStart: () => void;
  timesPlayedToday: number;
  onSetTimesPlayedToday: (arg0: number) => void;
  onHide: () => void;
  readyToBegin: boolean;
  onSetDailyTaskUnlocked?: (v: boolean) => void;
}) {
  const [results, setResults] = useState([]);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const grammarLoadingStatus = useHomeContext(
    (v) => v.state.grammarLoadingStatus
  );
  const grammarGenerationProgress = useHomeContext(
    (v) => v.state.grammarGenerationProgress
  );
  const onUpdateGrammarLoadingStatus = useHomeContext(
    (v) => v.actions.onUpdateGrammarLoadingStatus
  );
  const nextDayTimeStamp = useNotiContext(
    (v) => v.state.todayStats.nextDayTimeStamp
  );
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const [dailyTask, setDailyTask] = useState<any>(null);

  const xpNumberRole = useRoleColor('xpNumber', { fallback: 'logoGreen' });
  const xpNumberColor = xpNumberRole.getColor() || Color.logoGreen();
  const xpLabelColor = Color.gold();
  const checkNumGrammarGamesPlayedToday = useAppContext(
    (v) => v.requestHelpers.checkNumGrammarGamesPlayedToday
  );
  const [loaded, setLoaded] = useState(false);
  const levelsCleared = useMemo(() => {
    try {
      return (results || []).filter((row: any[]) => {
        if (!Array.isArray(row) || row.length === 0) return false;
        const sum = row.reduce(
          (acc: number, grade: string) => acc + (scoreTable[grade] || 0),
          0
        );
        return sum >= 700;
      }).length;
    } catch {
      return 0;
    }
  }, [results]);

  const currentLevel = useMemo(
    () => Math.min(levelsCleared + 1, 5),
    [levelsCleared]
  );
  type Variant = 'logoBlue' | 'pink' | 'orange' | 'magenta' | 'gold';
  const startVariant = useMemo<Variant>(() => {
    switch (currentLevel) {
      case 1:
        return 'logoBlue';
      case 2:
        return 'pink';
      case 3:
        return 'orange';
      case 4:
        return 'magenta';
      default:
        return 'gold';
    }
  }, [currentLevel]);

  useEffect(() => {
    init();
    async function init() {
      let attempts = 0;
      let success = false;

      while (attempts < 3 && !success) {
        try {
          const {
            attemptResults,
            attemptNumber,
            earnedCoins,
            dailyTaskStatus,
            dailyTask,
            nextDayTimeStamp: newNextDayTimeStamp
          } = await checkNumGrammarGamesPlayedToday();
          setResults(attemptResults);
          setDailyTask(dailyTaskStatus?.grammarbles || dailyTask || null);
          // a Grammar Quest run that cleared its stop also unlocks the day's
          // Grammarbles requirement (Mikey 10-07)
          const dailyTaskUnlocked =
            typeof dailyTaskStatus?.grammarbles?.earnedCoins === 'boolean'
              ? dailyTaskStatus.grammarbles.earnedCoins ||
                !!dailyTaskStatus.grammarbles.questCleared
              : earnedCoins;
          if (typeof dailyTaskUnlocked === 'boolean') {
            onSetDailyTaskUnlocked?.(dailyTaskUnlocked);
          }
          onApplyTodayStatsProgress({
            newStats: {
              ...buildTodayStatsPatchFromDailyTaskStatus(dailyTaskStatus),
              nextDayTimeStamp: newNextDayTimeStamp
            }
          });
          onSetTimesPlayedToday(attemptNumber);
          success = true;
        } catch (error) {
          attempts += 1;
          console.error(`Attempt ${attempts} failed. Retrying in 1 second...`);

          await new Promise((resolve) => setTimeout(resolve, 1000));

          if (attempts === 3) throw error;
        } finally {
          if (attempts === 3 || success) {
            setLoaded(true);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxTimesPlayedToday = useMemo(
    () => timesPlayedToday >= 5,
    [timesPlayedToday]
  );

  const hasFailedToday = useMemo(() => {
    try {
      return (results || []).some((row: any[]) => {
        if (!Array.isArray(row)) return false;
        if (row.length === 0) return true;
        const sum = row.reduce(
          (acc: number, grade: string) => acc + (scoreTable[grade] || 0),
          0
        );
        return sum < 700;
      });
    } catch {
      return false;
    }
  }, [results]);

  const isGameConcluded = useMemo(
    () => !!(hasFailedToday || maxTimesPlayedToday),
    [hasFailedToday, maxTimesPlayedToday]
  );

  const isCompletedAll = useMemo(
    () => !!(maxTimesPlayedToday && !hasFailedToday),
    [maxTimesPlayedToday, hasFailedToday]
  );

  const badgeColors = useMemo(() => {
    if (isCompletedAll) {
      // gold
      return {
        bg: '#FFD564',
        border: '#E3A40F',
        shadow: '#C4890A',
        text: '#1a1a1a'
      };
    }
    if (hasFailedToday) {
      // gray
      return {
        bg: '#94a3b8',
        border: '#64748b',
        shadow: '#475569',
        text: '#ffffff'
      };
    }
    // in-progress (no failure yet)
    return {
      bg: '#22c55e',
      border: '#16a34a',
      shadow: '#15803d',
      text: '#ffffff'
    };
  }, [hasFailedToday, isCompletedAll]);

  if (!loaded) {
    return (
      <ErrorBoundary componentPath="Earn/GrammarGameModal/StartScreen/Skeleton">
        <div
          className={css`
            padding: 2.5rem;
          `}
        >
          <ReviewSkeletonList />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/StartScreen">
      {/* one screen (Mikey 10-07): wide screens put the logo and the start
          button beside the level board; phones stack logo, board, button */}
      <div className={startRootCls}>
        <div className={topCls}>
          <div
            className={css`
              display: flex;
              justify-content: center;
            `}
          >
            <img
              src={LOGO_SRC}
              alt={`${grammarGameLabel} Classic`}
              draggable={false}
              className={css`
                display: block;
                width: auto;
                max-width: 100%;
                /* sized by the screen's height so the board always fits */
                height: clamp(6rem, 17vh, 15rem);
                @media (max-width: 900px), (max-height: 520px) {
                  height: clamp(4rem, 9vh, 8rem);
                }
                /* the logo sits on dark navy; fade only its very edges into the page */
                -webkit-mask-image:
                  linear-gradient(
                    90deg,
                    transparent 0%,
                    #000 7%,
                    #000 93%,
                    transparent 100%
                  ),
                  linear-gradient(
                    180deg,
                    transparent 0%,
                    #000 8%,
                    #000 92%,
                    transparent 100%
                  );
                -webkit-mask-composite: source-in;
                mask-image:
                  linear-gradient(
                    90deg,
                    transparent 0%,
                    #000 7%,
                    #000 93%,
                    transparent 100%
                  ),
                  linear-gradient(
                    180deg,
                    transparent 0%,
                    #000 8%,
                    #000 92%,
                    transparent 100%
                  );
                mask-composite: intersect;
                filter: drop-shadow(0 0 14px ${rgba(NEON.cyanRgb, 0.35)});
                animation: ${bob} 3.6s ease-in-out infinite;
                user-select: none;
              `}
            />
          </div>
          <div
            className={css`
              display: flex;
              justify-content: center;
              margin-top: 1rem;
            `}
          >
            <NeonButton
              icon={showHowToPlay ? 'arrow-left' : 'lightbulb'}
              onClick={() => setShowHowToPlay((s) => !s)}
            >
              {showHowToPlay ? 'Go Back' : 'How to Play'}
            </NeonButton>
          </div>
        </div>
        <div className={boardCls}>
          {showHowToPlay ? (
            <div style={{ fontFamily: funFont }}>
              <p>Answer 10 fill-in-the-blank grammar questions.</p>
              <p style={{ marginTop: '1rem' }}>
                The <b style={{ color: '#ff8a65' }}>faster</b> you select the
                correct choice, the more <b style={{ color: NEON.gold }}>XP</b>{' '}
                you earn.
              </p>
              {!deviceIsMobile && (
                <p style={{ marginTop: '1rem' }}>
                  You can use the <b>1, 2, 3, 4 keys</b> on your <b>keyboard</b>{' '}
                  or use your mouse to select the choices
                </p>
              )}
              <div style={{ marginTop: '2rem' }}>
                <div>
                  <Marble letterGrade="S" />{' '}
                  <XPValue
                    amount={scoreTable.S}
                    xpLabelColor={xpLabelColor}
                    xpNumberColor={xpNumberColor}
                  />
                  <Marble style={{ marginLeft: '1.5rem' }} letterGrade="A" />{' '}
                  <XPValue
                    amount={scoreTable.A}
                    xpLabelColor={xpLabelColor}
                    xpNumberColor={xpNumberColor}
                  />
                  <Marble style={{ marginLeft: '1.5rem' }} letterGrade="B" />{' '}
                  <XPValue
                    amount={scoreTable.B}
                    xpLabelColor={xpLabelColor}
                    xpNumberColor={xpNumberColor}
                  />
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <Marble letterGrade="C" />{' '}
                  <XPValue
                    amount={scoreTable.C}
                    xpLabelColor={xpLabelColor}
                    xpNumberColor={xpNumberColor}
                  />
                  <Marble style={{ marginLeft: '1.5rem' }} letterGrade="D" />{' '}
                  <XPValue
                    amount={scoreTable.D}
                    xpLabelColor={xpLabelColor}
                    xpNumberColor={xpNumberColor}
                  />
                  <Marble style={{ marginLeft: '1.5rem' }} letterGrade="F" />{' '}
                  <XPValue
                    amount={scoreTable.F}
                    xpLabelColor={xpLabelColor}
                    xpNumberColor={xpNumberColor}
                  />
                </div>
                <div style={{ marginTop: '1rem' }}>
                  Perfect score bonus:{' '}
                  <b style={{ color: NEON.violet }}>x{perfectScoreBonus}</b>{' '}
                  (each game)
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  Clear all 5 levels bonus:{' '}
                  <b style={{ color: NEON.cyan }}>
                    x{fullClearBonusMultiplier}
                  </b>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  All 5 levels perfect bonus:{' '}
                  <b style={{ color: NEON.gold }}>
                    x{allPerfectBonusMultiplier}
                  </b>
                </div>
                <div
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '1.3rem',
                    lineHeight: 1.5
                  }}
                >
                  <div>
                    <span>Daily clear: </span>
                    <XPValue
                      amount={100}
                      xpLabelColor={xpLabelColor}
                      xpNumberColor={xpNumberColor}
                    />{' '}
                    × 10 (questions){' '}
                    <b
                      style={{
                        display: 'inline-flex',
                        alignItems: 'baseline',
                        fontWeight: 800,
                        color: NEON.violet
                      }}
                    >
                      <span>×</span>
                      <span style={{ marginLeft: '0.35rem' }}>
                        {perfectScoreBonus}
                      </span>
                    </b>{' '}
                    × <span>5 (levels)</span> ={' '}
                    <XPValue
                      amount="50,000"
                      xpLabelColor={xpLabelColor}
                      xpNumberColor={xpNumberColor}
                    />
                  </div>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span>All five levels clear bonus: </span>
                    <XPValue
                      amount="50,000"
                      xpLabelColor={xpLabelColor}
                      xpNumberColor={xpNumberColor}
                    />{' '}
                    <span style={{ color: NEON.cyan, fontWeight: 700 }}>
                      × {fullClearBonusMultiplier}
                    </span>{' '}
                    ={' '}
                    <XPValue
                      amount="250,000"
                      xpLabelColor={xpLabelColor}
                      xpNumberColor={xpNumberColor}
                    />
                  </div>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span>All five perfect: </span>
                    <XPValue
                      amount="250,000"
                      xpLabelColor={xpLabelColor}
                      xpNumberColor={xpNumberColor}
                    />{' '}
                    <span style={{ color: NEON.gold, fontWeight: 700 }}>
                      × {allPerfectBonusMultiplier}
                    </span>{' '}
                    ={' '}
                    <XPValue
                      amount="5,000,000"
                      xpLabelColor={xpLabelColor}
                      xpNumberColor={xpNumberColor}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <TodayResult results={results || []} />
          )}
        </div>
        <div className={actionsCls}>
          {/* Grammarbles' own Basic / Excellence board: Classic or Quest */}
          <DailyGoals look="classic" status={dailyTask} />
          {loaded && (
            <div
              className={css`
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.7rem 1.1rem;
                /* phones: the level board already shows today's clears */
                @media (max-width: 900px), (max-height: 520px) {
                  display: none;
                }
                border-radius: 9999px;
                font-family: ${PIXEL_FONT};
                font-size: 1rem;
                line-height: 1.5;
                text-align: center;
                color: ${badgeColors.text};
                background: ${badgeColors.bg};
                border: 2px solid ${badgeColors.border};
                box-shadow:
                  0 3px 0 ${badgeColors.shadow},
                  0 0 14px ${badgeColors.bg};
              `}
            >
              {levelsCleared}/5 levels cleared today
            </div>
          )}
          {!readyToBegin ? (
            <div>
              <GameCTAButton
                icon={isGameConcluded ? 'clock' : 'play'}
                onClick={handleStartClick}
                disabled={!userId || isGameConcluded || loading}
                loading={loading}
                variant={startVariant}
                size="xl"
                shiny
                arcade
              >
                {isGameConcluded ? (
                  nextDayTimeStamp ? (
                    <span>
                      Next game in{' '}
                      <NextDayCountdown
                        inline
                        nextDayTimeStamp={nextDayTimeStamp}
                      />
                    </span>
                  ) : (
                    'Try again later'
                  )
                ) : userId ? (
                  `Start Level ${currentLevel}`
                ) : (
                  'Log in to play'
                )}
              </GameCTAButton>
            </div>
          ) : null}
          {grammarLoadingStatus ? (
            <div
              className={css`
                margin-top: 1.2rem;
                font-family: ${PIXEL_FONT};
                font-size: 1rem;
                line-height: 1.7;
                text-align: center;
                min-height: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
              `}
              style={{
                color: /limit|error|fail/i.test(grammarLoadingStatus)
                  ? NEON.red
                  : NEON.cyan,
                textShadow: `0 0 8px ${
                  /limit|error|fail/i.test(grammarLoadingStatus)
                    ? rgba(NEON.redRgb, 0.6)
                    : rgba(NEON.cyanRgb, 0.6)
                }`
              }}
              aria-live="polite"
            >
              {grammarLoadingStatus}
            </div>
          ) : grammarGenerationProgress ? (
            <div
              className={css`
                width: 100%;
                display: flex;
                justify-content: center;
                margin-top: 1rem;
                min-height: 2rem;
              `}
            >
              <div
                className={css`
                  width: 60%;
                  max-width: 420px;
                  height: 10px;
                  border-radius: 9999px;
                  background: rgba(8, 10, 40, 0.8);
                  border: 1px solid ${rgba(NEON.cyanRgb, 0.45)};
                  box-shadow: 0 0 10px ${rgba(NEON.cyanRgb, 0.3)};
                  overflow: hidden;
                `}
                aria-label="Question generation progress"
              >
                <div
                  className={css`
                    height: 100%;
                    transition: width 250ms ease;
                    background: linear-gradient(
                      90deg,
                      ${NEON.violet} 0%,
                      ${NEON.cyan} 100%
                    );
                    box-shadow: 0 0 8px ${NEON.cyan};
                  `}
                  style={(() => {
                    const current = grammarGenerationProgress?.current || 0;
                    const total = grammarGenerationProgress?.total || 10;
                    const percent = Math.max(
                      0,
                      Math.min(100, Math.round((current / total) * 100))
                    );
                    return { width: `${percent}%` };
                  })()}
                />
              </div>
            </div>
          ) : (
            <div
              className={css`
                min-height: 2rem;
              `}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleStartClick() {
    if (!userId) return;
    try {
      onUpdateGrammarLoadingStatus?.('loading...');
    } catch {
      // no-op
    }
    onGameStart();
  }
}

function XPValue({
  amount,
  style,
  xpLabelColor,
  xpNumberColor
}: {
  amount: React.ReactNode;
  style?: React.CSSProperties;
  xpLabelColor: string;
  xpNumberColor: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.35rem',
        fontFamily: PIXEL_FONT,
        fontSize: '0.8em',
        ...style
      }}
    >
      <span
        style={{
          color: xpNumberColor,
          textShadow: `0 0 6px ${xpNumberColor}`
        }}
      >
        {amount}
      </span>
      <span
        style={{
          color: xpLabelColor,
          fontSize: '0.9rem'
        }}
      >
        XP
      </span>
    </span>
  );
}

const startRootCls = css`
  flex: 1;
  min-height: 0;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    'top board'
    'actions board';
  column-gap: 2.4rem;
  row-gap: 1.2rem;
  align-items: center;
  padding: 1.2rem 2rem 1.6rem;
  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'top'
      'board'
      'actions';
    row-gap: 0.8rem;
    padding: 0.6rem 0.8rem 1rem;
  }
  /* phones on their side: back to two columns (the board beside) */
  @media (max-height: 520px) and (orientation: landscape) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-areas:
      'top board'
      'actions board';
    column-gap: 1rem;
    row-gap: 0.4rem;
    padding: 0.3rem 0.8rem 0.4rem;
  }
`;
const topCls = css`
  grid-area: top;
  align-self: end;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  @media (max-width: 900px), (max-height: 520px) {
    /* logo and How to Play side by side */
    flex-direction: row;
    justify-content: center;
    gap: 0.8rem;
    align-self: start;
  }
`;
// the level board (or How to Play), scrolling inside only if a screen is
// too short even for its compact rows
const boardCls = css`
  grid-area: board;
  align-self: stretch;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.7;
  text-align: center;
  > * {
    flex: none;
  }
`;
const actionsCls = css`
  grid-area: actions;
  align-self: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  @media (max-width: 900px) {
    gap: 0.6rem;
  }
`;
