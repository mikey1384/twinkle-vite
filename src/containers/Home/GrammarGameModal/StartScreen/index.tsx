import React, { useEffect, useMemo, useState } from 'react';
import Countdown from 'react-countdown';
import ErrorBoundary from '~/components/ErrorBoundary';
import Marble from './Marble';
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
import { scoreTable, perfectScoreBonus } from '../constants';
import GameCTAButton from '~/components/Buttons/GameCTAButton';

const grammarGameLabel = localize('grammarGame');
const deviceIsMobile = isMobile(navigator);

export default function StartScreen({
  onGameStart,
  timesPlayedToday,
  onSetTimesPlayedToday,
  loading,
  readyToBegin
}: {
  loading: boolean;
  onGameStart: () => void;
  timesPlayedToday: number;
  onSetTimesPlayedToday: (arg0: number) => void;
  onHide: () => void;
  readyToBegin: boolean;
}) {
  const [results, setResults] = useState([]);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const failColor = useKeyContext((v) => v.theme.fail.color);
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
  const funFont =
    "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

  const colorSKey = useKeyContext((v) => v.theme.grammarGameScoreS.color);
  const colorAKey = useKeyContext((v) => v.theme.grammarGameScoreA.color);
  const colorBKey = useKeyContext((v) => v.theme.grammarGameScoreB.color);
  const colorCKey = useKeyContext((v) => v.theme.grammarGameScoreC.color);
  const colorDKey = useKeyContext((v) => v.theme.grammarGameScoreD.color);
  const titlePalette = [colorSKey, colorAKey, colorBKey, colorCKey, colorDKey];
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
        return sum >= 900;
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
            nextDayTimeStamp: newNextDayTimeStamp
          } = await checkNumGrammarGamesPlayedToday();
          setResults(attemptResults);
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
        if (!Array.isArray(row) || row.length === 0) return false;
        const sum = row.reduce(
          (acc: number, grade: string) => acc + (scoreTable[grade] || 0),
          0
        );
        return sum < 900;
      });
    } catch {
      return false;
    }
  }, [results]);

  // Centralized flag to reflect whether today's game session is concluded
  const isGameConcluded = useMemo(
    () => !!(hasFailedToday || maxTimesPlayedToday),
    [hasFailedToday, maxTimesPlayedToday]
  );

  // Removed legacy start button label logic; CTA shows current level instead

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
              icon={
                showHowToPlay && (results?.length || 0) > 0
                  ? 'arrow-left'
                  : 'lightbulb'
              }
              onClick={() => setShowHowToPlay((s) => !s)}
              variant={howToVariant}
            >
              {showHowToPlay && (results?.length || 0) > 0
                ? 'Back'
                : 'How to Play'}
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
                    <b style={{ color: Color.logoGreen() }}>{scoreTable.S}</b>{' '}
                    <b style={{ color: Color.darkGold() }}>XP</b>
                    <Marble
                      style={{ marginLeft: '1.5rem' }}
                      letterGrade="A"
                    />{' '}
                    <b style={{ color: Color.logoGreen() }}>{scoreTable.A}</b>{' '}
                    <b style={{ color: Color.darkGold() }}>XP</b>
                    <Marble
                      style={{ marginLeft: '1.5rem' }}
                      letterGrade="B"
                    />{' '}
                    <b style={{ color: Color.logoGreen() }}>{scoreTable.B}</b>{' '}
                    <b style={{ color: Color.darkGold() }}>XP</b>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <Marble letterGrade="C" /> {scoreTable.C} XP
                    <Marble
                      style={{ marginLeft: '1.5rem' }}
                      letterGrade="D"
                    />{' '}
                    {scoreTable.D} XP
                    <Marble
                      style={{ marginLeft: '1.5rem' }}
                      letterGrade="F"
                    />{' '}
                    {scoreTable.F} XP
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    Perfect score bonus:{' '}
                    <b style={{ color: Color.purple() }}>
                      x{perfectScoreBonus}
                    </b>
                  </div>
                </div>
              </div>
            ) : results?.length ? (
              <TodayResult results={results} />
            ) : null}
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
              color: #fff;
              background: #22c55e;
              border: 2px solid #16a34a;
              box-shadow: 0 2px 0 #15803d;
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
                ? Color[failColor]()
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
