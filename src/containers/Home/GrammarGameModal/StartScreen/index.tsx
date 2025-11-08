import React, { useEffect, useMemo, useState } from 'react';
import Countdown from 'react-countdown';
import ErrorBoundary from '~/components/ErrorBoundary';
import Marble from '../Marble';
import localize from '~/constants/localize';
import TodayResult from './TodayResult';
import {
  useAppContext,
  useHomeContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { isMobile } from '~/helpers';
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
import { useRoleColor } from '~/theme/useRoleColor';
// removed pre-play of correct sound to avoid iOS beeps on start screen

const grammarGameLabel = localize('grammarGame');
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
  const failRole = useRoleColor('fail', { fallback: 'black' });
  const failColorKey = failRole.colorKey;
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
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const userId = useKeyContext((v) => v.myState.userId);

  const roleS = useRoleColor('grammarGameScoreS', { fallback: 'gold' });
  const roleA = useRoleColor('grammarGameScoreA', { fallback: 'magenta' });
  const roleB = useRoleColor('grammarGameScoreB', { fallback: 'orange' });
  const roleC = useRoleColor('grammarGameScoreC', { fallback: 'pink' });
  const roleD = useRoleColor('grammarGameScoreD', { fallback: 'logoBlue' });
  const titlePalette = [
    roleS.colorKey,
    roleA.colorKey,
    roleB.colorKey,
    roleC.colorKey,
    roleD.colorKey
  ];
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
  const howToVariant = useMemo<Variant>(() => {
    const candidates: Variant[] = ['orange', 'magenta', 'pink', 'gold'];
    return candidates.find((v) => v !== startVariant) || 'magenta';
  }, [startVariant]);

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
            nextDayTimeStamp: newNextDayTimeStamp
          } = await checkNumGrammarGamesPlayedToday();
          setResults(attemptResults);
          if (typeof earnedCoins === 'boolean') {
            onSetDailyTaskUnlocked?.(earnedCoins);
          }
          onUpdateTodayStats({
            newStats: {
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2.5rem'
        }}
      >
        <div>
          <div
            style={{
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '3rem',
              fontFamily: funFont
            }}
          >
            <span>
              {grammarGameLabel.split('').map((ch, idx) => (
                <span
                  key={idx}
                  className={css`
                    color: ${Color[titlePalette[idx % titlePalette.length]]()};
                    display: inline-block;
                    transform: translateY(${(idx % 2) * 1}px);
                    letter-spacing: 0.5px;
                  `}
                >
                  {ch}
                </span>
              ))}
            </span>
          </div>
          <div
            className={css`
              display: flex;
              justify-content: center;
              margin-top: 1rem;
            `}
          >
            <GameCTAButton
              icon={showHowToPlay ? 'arrow-left' : 'lightbulb'}
              onClick={() => setShowHowToPlay((s) => !s)}
              variant={howToVariant}
            >
              {showHowToPlay ? 'Go Back' : 'How to Play'}
            </GameCTAButton>
          </div>
          <div
            style={{ marginTop: '3rem', lineHeight: 1.7, textAlign: 'center' }}
          >
            {showHowToPlay ? (
              <div style={{ fontFamily: funFont }}>
                <p>Answer 10 fill-in-the-blank grammar questions.</p>
                <p style={{ marginTop: '1rem' }}>
                  The <b style={{ color: Color.redOrange() }}>faster</b> you
                  select the correct choice, the more{' '}
                  <b style={{ color: Color.darkGold() }}>XP</b> you earn.
                </p>
                {!deviceIsMobile && (
                  <p style={{ marginTop: '1rem' }}>
                    You can use the <b>1, 2, 3, 4 keys</b> on your{' '}
                    <b>keyboard</b> or use your mouse to select the choices
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
                    <b style={{ color: Color.purple() }}>
                      x{perfectScoreBonus}
                    </b>{' '}
                    (each game)
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    Clear all 5 levels bonus:{' '}
                    <b style={{ color: Color.logoBlue() }}>
                      x{fullClearBonusMultiplier}
                    </b>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    All 5 levels perfect bonus:{' '}
                    <b style={{ color: Color.gold() }}>
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
                          color: Color.purple()
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
                      <span
                        style={{ color: Color.logoBlue(), fontWeight: 700 }}
                      >
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
                      <span style={{ color: Color.gold(), fontWeight: 700 }}>
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
        </div>
        {loaded && (
          <div
            className={css`
              margin-top: 2rem;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 0.5rem 0.9rem;
              border-radius: 9999px;
              font-weight: 800;
              letter-spacing: 0.3px;
              color: ${badgeColors.text};
              background: ${badgeColors.bg};
              border: 2px solid ${badgeColors.border};
              box-shadow: 0 2px 0 ${badgeColors.shadow};
            `}
          >
            {levelsCleared}/5 levels cleared today
          </div>
        )}
        {!readyToBegin ? (
          <div style={{ marginTop: '2rem' }}>
            <GameCTAButton
              icon={isGameConcluded ? 'clock' : 'play'}
              onClick={handleStartClick}
              disabled={!userId || isGameConcluded || loading}
              loading={loading}
              variant={startVariant}
              size="xl"
              shiny
            >
              {isGameConcluded ? (
                nextDayTimeStamp ? (
                  <span>
                    Next game in{' '}
                    <Countdown
                      date={new Date(nextDayTimeStamp)}
                      renderer={({ hours, minutes, seconds }) => (
                        <span>
                          {String(hours).padStart(2, '0')}:
                          {String(minutes).padStart(2, '0')}:
                          {String(seconds).padStart(2, '0')}
                        </span>
                      )}
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
              margin-top: 1rem;
              font-size: 1.4rem;
              font-weight: 600;
              min-height: 2rem;
              display: flex;
              align-items: center;
              justify-content: center;
            `}
            style={{
              color: /limit|error|fail/i.test(grammarLoadingStatus)
                ? Color[failColorKey]()
                : Color.logoBlue()
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
                height: 8px;
                border-radius: 9999px;
                background: ${Color.wellGray(0.4)};
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
                    ${Color.logoBlue()} 0%,
                    ${Color.darkBlue()} 100%
                  );
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
              margin-top: 1rem;
              min-height: 2rem;
            `}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  function handleStartClick() {
    if (!userId) return;
    try {
      // Immediate local update for responsiveness
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
        fontWeight: 800,
        letterSpacing: '0.01em',
        ...style
      }}
    >
      <span
        style={{
          color: xpNumberColor,
          fontWeight: 800
        }}
      >
        {amount}
      </span>
      <span
        style={{
          color: xpLabelColor,
          fontWeight: 700,
          fontSize: '0.9em',
          letterSpacing: '0.04em'
        }}
      >
        XP
      </span>
    </span>
  );
}
