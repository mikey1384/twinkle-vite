import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import GradientButton from '~/components/Buttons/GradientButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Prompt from './Prompt';
import { useAppContext, useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { Color } from '~/constants/css';

const deviceIsMobile = isMobile(navigator);

StartScreen.propTypes = {
  onGameStart: PropTypes.func.isRequired,
  onSetTimesPlayedToday: PropTypes.func.isRequired,
  timesPlayedToday: PropTypes.number.isRequired
};

const firstLine = 'Answer 10 fill-in-the-blank grammar questions.';
const secondLine = 'The faster you answer a question, the more XP you earn.';
const thirdLine =
  'You can only play 5 games per day. Try to earn as much XP as possible!';

export default function StartScreen({
  onGameStart,
  timesPlayedToday,
  onSetTimesPlayedToday
}) {
  const {
    fail: { color: failColor },
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
  const checkNumGrammarGamesPlayedToday = useAppContext(
    (v) => v.requestHelpers.checkNumGrammarGamesPlayedToday
  );
  const [screenIndex, setScreenIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    init();
    async function init() {
      const { attemptNumber } = await checkNumGrammarGamesPlayedToday();
      onSetTimesPlayedToday(attemptNumber);
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSetTimesPlayedToday]);
  useEffect(() => {
    setTimeout(() => setScreenIndex(1), 1500);
    setTimeout(() => setScreenIndex(2), 4000);
    setTimeout(() => setScreenIndex(3), 7500);
  }, []);

  const maxTimesPlayedToday = useMemo(
    () => timesPlayedToday >= 5,
    [timesPlayedToday]
  );

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
              fontWeight: 'bold',
              fontSize: '2rem'
            }}
          >
            Grammarbles
          </div>
          <div
            style={{ marginTop: '4rem', lineHeight: 1.7, textAlign: 'center' }}
          >
            {screenIndex === 0 && <Prompt>{firstLine}</Prompt>}
            {screenIndex === 1 && <Prompt>{secondLine}</Prompt>}
            {screenIndex === 2 && <Prompt>{thirdLine}</Prompt>}
            {screenIndex === 3 && (
              <div>
                <p>{firstLine}</p>
                <p>{secondLine}</p>
                <p>{thirdLine}</p>
              </div>
            )}
          </div>
          <div style={{ marginTop: '4rem', textAlign: 'center' }}>
            {!deviceIsMobile && (
              <p>
                You can use the <b>1, 2, 3, 4 keys</b> on your <b>keyboard</b>{' '}
                or use your mouse to select the choices
              </p>
            )}
            <p>
              Press the <b>start</b> button when you are ready
            </p>
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
          loading={!loaded}
          disabled={maxTimesPlayedToday}
          style={{ marginTop: '2rem', fontSize: '1.7rem' }}
          onClick={onGameStart}
        >
          Start
        </GradientButton>
      </div>
    </ErrorBoundary>
  );
}
