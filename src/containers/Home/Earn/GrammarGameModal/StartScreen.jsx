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
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.7rem'
            }}
          >
            The Grammar Game
          </div>
          <div style={{ marginTop: '2rem', lineHeight: 1.7 }}>
            <p>Earn XP based on how quickly you answer the questions.</p>
            <p>The harder a question is, the more XP you can earn.</p>
            <p>There are 10 questions in total.</p>
          </div>
          <p style={{ marginTop: '5rem' }}>
            Press the start button when you are ready. Good luck!
          </p>
        </div>
        <GradientButton
          style={{ marginTop: '3.5rem', fontSize: '1.7rem' }}
          onClick={() => onSetGameState('started')}
        >
          Start
        </GradientButton>
      </div>
    </ErrorBoundary>
  );
}
