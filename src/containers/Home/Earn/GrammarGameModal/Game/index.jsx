import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import QuestionViewer from './QuestionViewer';

Game.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSetGameState: PropTypes.func.isRequired
};

export default function Game({ questions, onSetGameState }) {
  return (
    <div style={{ width: '100%', paddingTop: '3.5rem' }}>
      {questions.length > 0 ? (
        <QuestionViewer onSetGameState={onSetGameState} questions={questions} />
      ) : (
        <Loading />
      )}
    </div>
  );
}
