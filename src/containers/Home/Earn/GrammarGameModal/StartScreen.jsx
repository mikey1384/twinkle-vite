import PropTypes from 'prop-types';
import GradientButton from '~/components/Buttons/GradientButton';
import ErrorBoundary from '~/components/ErrorBoundary';

StartScreen.propTypes = {
  onSetGameState: PropTypes.func.isRequired
};

export default function StartScreen({ onSetGameState }) {
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
          <div style={{ marginTop: '3rem', lineHeight: 1.7 }}>
            <p>Answer 10 fill-in-the-blank grammar questions.</p>
            <p>The quicker you answer a question, the more XP you can earn.</p>
            <p>The more difficult a question is, the more XP you can earn.</p>
            <p>Move up the leaderboard by earning lots of XP!</p>
          </div>
          <p style={{ marginTop: '3.5rem', textAlign: 'center' }}>
            Press the <b>start</b> button when you are ready
          </p>
        </div>
        <GradientButton
          style={{ marginTop: '4rem', fontSize: '1.7rem' }}
          onClick={() => onSetGameState('started')}
        >
          Start
        </GradientButton>
      </div>
    </ErrorBoundary>
  );
}
