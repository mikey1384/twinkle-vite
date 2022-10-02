import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import GradientButton from '~/components/Buttons/GradientButton';
import ErrorBoundary from '~/components/ErrorBoundary';

StartScreen.propTypes = {
  onGameStart: PropTypes.func.isRequired
};

export default function StartScreen({ onGameStart }) {
  const [screenIndex, setScreenIndex] = useState(0);
  useEffect(() => {
    setTimeout(() => setScreenIndex(1), 1100);
    setTimeout(() => setScreenIndex(2), 3000);
    setTimeout(() => setScreenIndex(3), 5500);
    setTimeout(() => setScreenIndex(4), 8500);
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
          <div style={{ marginTop: '4rem', lineHeight: 1.7 }}>
            {screenIndex === 0 && (
              <p style={{ fontSize: '1.7rem' }}>
                Answer 10 fill-in-the-blank grammar questions.
              </p>
            )}
            {screenIndex === 1 && (
              <p style={{ fontSize: '1.7rem' }}>
                The faster you answer a question, the more XP you earn.
              </p>
            )}
            {screenIndex === 2 && (
              <p style={{ fontSize: '1.7rem' }}>
                The more difficult a question is, the more XP you earn.
              </p>
            )}
            {screenIndex === 3 && (
              <p style={{ fontSize: '1.7rem' }}>
                Move up the leaderboard by earning lots of XP!
              </p>
            )}
            {screenIndex === 4 && (
              <>
                <p>Answer 10 fill-in-the-blank grammar questions.</p>
                <p>The faster you answer a question, the more XP you earn.</p>
                <p>The more difficult a question is, the more XP you earn.</p>
                <p>Move up the leaderboard by earning lots of XP!</p>
              </>
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
