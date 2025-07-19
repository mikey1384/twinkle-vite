import React, { useEffect, useMemo, useState } from 'react';
import GradientButton from '~/components/Buttons/GradientButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Marble from './Marble';
import localize from '~/constants/localize';
import Countdown from 'react-countdown';
import TodayResult from './TodayResult';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { scoreTable, perfectScoreBonus } from '../constants';

const grammarGameLabel = localize('grammarGame');
const deviceIsMobile = isMobile(navigator);

export default function StartScreen({
  loading,
  onGameStart,
  timesPlayedToday,
  onSetTimesPlayedToday,
  onHide
}: {
  loading: boolean;
  onGameStart: () => void;
  timesPlayedToday: number;
  onSetTimesPlayedToday: (arg0: number) => void;
  onHide: () => void;
}) {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [earnedCoins, setEarnedCoins] = useState(false);
  const {
    fail: { color: failColor },
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
  const { timeDifference, nextDayTimeStamp } = useNotiContext(
    (v) => v.state.todayStats
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const checkNumGrammarGamesPlayedToday = useAppContext(
    (v) => v.requestHelpers.checkNumGrammarGamesPlayedToday
  );
  const [loaded, setLoaded] = useState(false);

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
          setEarnedCoins(earnedCoins);
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
  }, [onSetTimesPlayedToday]);

  const maxTimesPlayedToday = useMemo(
    () => timesPlayedToday >= 5,
    [timesPlayedToday]
  );

  const startButtonLabel = useMemo(() => {
    if (maxTimesPlayedToday) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          Game available in{' '}
          <Countdown
            key={nextDayTimeStamp}
            className={css`
              margin-top: 0.5rem;
            `}
            date={nextDayTimeStamp}
            daysInHours={true}
            now={() => {
              return Date.now() + timeDifference;
            }}
            onComplete={() => onSetTimesPlayedToday(0)}
          />
        </div>
      );
    }
    return 'Start';
  }, [
    maxTimesPlayedToday,
    nextDayTimeStamp,
    onSetTimesPlayedToday,
    timeDifference
  ]);

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
            className={css`
              background: linear-gradient(
                to right,
                ${Color.purple()} 5%,
                ${Color.redOrange()} 100%
              );
              background-clip: text;
              background-size: 400% 400%;
              animation: Gradient 5s ease infinite;
              text-fill-color: transparent;
            `}
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '2rem'
            }}
          >
            {grammarGameLabel}
          </div>
          <div
            style={{ marginTop: '3rem', lineHeight: 1.7, textAlign: 'center' }}
          >
            {!results?.length ? (
              <div>
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
              </div>
            ) : (
              <TodayResult results={results} earnedCoins={earnedCoins} />
            )}
            <div style={{ marginTop: '3rem' }}>
              <div>
                <Marble letterGrade="S" />{' '}
                <b style={{ color: Color.logoGreen() }}>{scoreTable.S}</b>{' '}
                <b style={{ color: Color.darkGold() }}>XP</b>
                <Marble style={{ marginLeft: '1.5rem' }} letterGrade="A" />{' '}
                <b style={{ color: Color.logoGreen() }}>{scoreTable.A}</b>{' '}
                <b style={{ color: Color.darkGold() }}>XP</b>
                <Marble style={{ marginLeft: '1.5rem' }} letterGrade="B" />{' '}
                <b style={{ color: Color.logoGreen() }}>{scoreTable.B}</b>{' '}
                <b style={{ color: Color.darkGold() }}>XP</b>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <Marble letterGrade="C" /> {scoreTable.C} XP
                <Marble style={{ marginLeft: '1.5rem' }} letterGrade="D" />{' '}
                {scoreTable.D} XP
                <Marble style={{ marginLeft: '1.5rem' }} letterGrade="F" />{' '}
                {scoreTable.F} XP
              </div>
              <div style={{ marginTop: '1rem' }}>
                Perfect score bonus:{' '}
                <b style={{ color: Color.purple() }}>x{perfectScoreBonus}</b>
              </div>
            </div>
          </div>
        </div>
        {loaded && (
          <div
            style={{
              marginTop: '3rem',
              fontWeight: 'bold',
              color: Color[maxTimesPlayedToday ? failColor : successColor]()
            }}
          >
            {timesPlayedToday}/5 games played today
          </div>
        )}
        <GradientButton
          loading={userId && (!loaded || loading)}
          disabled={!userId || maxTimesPlayedToday}
          style={{ marginTop: '2rem', fontSize: '1.7rem' }}
          onClick={onGameStart}
        >
          {userId ? startButtonLabel : 'Log in to play'}
        </GradientButton>
        {maxTimesPlayedToday && (
          <Button
            onClick={() => {
              navigate('/missions/grammar');
              onHide();
            }}
            style={{ marginTop: '1.5rem' }}
            filled
            color="logoBlue"
          >
            Practice
          </Button>
        )}
      </div>
    </ErrorBoundary>
  );
}
