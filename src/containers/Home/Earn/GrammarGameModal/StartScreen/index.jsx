import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import GradientButton from '~/components/Buttons/GradientButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Marble from './Marble';
import { useAppContext, useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import localize from '~/constants/localize';
import Countdown from 'react-countdown';
import { scoreTable, perfectScoreBonus } from '../constants';

const grammarGameLabel = localize('grammarGame');
const deviceIsMobile = isMobile(navigator);

StartScreen.propTypes = {
  loading: PropTypes.bool,
  onGameStart: PropTypes.func.isRequired,
  onSetTimesPlayedToday: PropTypes.func.isRequired,
  timesPlayedToday: PropTypes.number.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function StartScreen({
  loading,
  onGameStart,
  timesPlayedToday,
  onSetTimesPlayedToday,
  onHide
}) {
  const navigate = useNavigate();
  const [nextDayTimeStamp, setNextDayTimeStamp] = useState(null);
  const {
    fail: { color: failColor },
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
  const checkNumGrammarGamesPlayedToday = useAppContext(
    (v) => v.requestHelpers.checkNumGrammarGamesPlayedToday
  );
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    init();
    async function init() {
      const { attemptNumber, nextDayTimeStamp } =
        await checkNumGrammarGamesPlayedToday();
      setNextDayTimeStamp(nextDayTimeStamp);
      onSetTimesPlayedToday(attemptNumber);
      setLoaded(true);
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
            onComplete={() => onSetTimesPlayedToday(0)}
          />
        </div>
      );
    }
    return 'Start';
  }, [maxTimesPlayedToday, nextDayTimeStamp, onSetTimesPlayedToday]);

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
            style={{ marginTop: '4rem', lineHeight: 1.7, textAlign: 'center' }}
          >
            <p>Answer 10 fill-in-the-blank grammar questions.</p>
            <p style={{ marginTop: '1rem' }}>
              The <b style={{ color: Color.redOrange() }}>faster</b> you answer
              a question, the more <b style={{ color: Color.darkGold() }}>XP</b>{' '}
              you earn.
            </p>
            {!deviceIsMobile && (
              <p style={{ marginTop: '1rem' }}>
                You can use the <b>1, 2, 3, 4 keys</b> on your <b>keyboard</b>{' '}
                or use your mouse to select the choices
              </p>
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
          loading={!loaded || loading}
          disabled={maxTimesPlayedToday}
          style={{ marginTop: '2rem', fontSize: '1.7rem' }}
          onClick={onGameStart}
        >
          {startButtonLabel}
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
