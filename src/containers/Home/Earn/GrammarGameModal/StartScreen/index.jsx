import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import GradientButton from '~/components/Buttons/GradientButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Prompt from './Prompt';

StartScreen.propTypes = {
  onGameStart: PropTypes.func.isRequired
};

export default function StartScreen({ onGameStart }) {
  const [screenIndex, setScreenIndex] = useState(0);
  useEffect(() => {
    setTimeout(() => setScreenIndex(1), 1500);
    setTimeout(() => setScreenIndex(2), 4000);
    setTimeout(() => setScreenIndex(3), 6500);
  }, []);

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
              marginTop: '0.5rem',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.7rem'
            }}
          >
            The Grammar Game
          </div>
          <div
            style={{ marginTop: '4rem', lineHeight: 1.7, textAlign: 'center' }}
          >
            {screenIndex === 0 && (
              <Prompt>Answer 10 fill-in-the-blank grammar questions.</Prompt>
            )}
            {screenIndex === 1 && (
              <Prompt>
                The faster you answer a question, the more coins you earn.
              </Prompt>
            )}
            {screenIndex === 2 && (
              <Prompt>
                To move up on the leaderboard, earn as many coins as possible!
              </Prompt>
            )}
            {screenIndex === 3 && (
              <div>
                <p>Answer 10 fill-in-the-blank grammar questions.</p>
                <p>
                  The faster you answer a question, the more coins you earn.
                </p>
                <p>
                  To move up on the leaderboard, earn as many coins as possible!
                </p>
              </div>
            )}
          </div>
          <p style={{ marginTop: '4rem', textAlign: 'center' }}>
            Press the <b>start</b> button when you are ready
          </p>
        </div>
        <GradientButton
          style={{ marginTop: '4rem', fontSize: '1.7rem' }}
          onClick={onGameStart}
        >
          Start
        </GradientButton>
      </div>
    </ErrorBoundary>
  );
}
