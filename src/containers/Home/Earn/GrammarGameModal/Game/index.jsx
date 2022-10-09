import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import Main from './Main';

Game.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSetGameState: PropTypes.func.isRequired
};

export default function Game({ questions, onSetGameState }) {
  return (
    <div style={{ width: '100%', paddingTop: '3.5rem' }}>
      {questions.length > 0 ? (
        <Main onSetGameState={onSetGameState} questions={questions} />
      ) : (
        <Loading />
      )}
    </div>
  );
}
