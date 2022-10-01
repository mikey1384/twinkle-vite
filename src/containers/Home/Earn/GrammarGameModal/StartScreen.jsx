import PropTypes from 'prop-types';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useKeyContext } from '~/contexts';

StartScreen.propTypes = {
  onSetGameState: PropTypes.func.isRequired
};

export default function StartScreen({ onSetGameState }) {
  const {
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);

  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/StartScreen">
      <div>
        <Button
          color={successColor}
          filled
          onClick={() => onSetGameState('started')}
        >
          Start
        </Button>
      </div>
    </ErrorBoundary>
  );
}
