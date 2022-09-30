import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import QuestionViewer from './QuestionViewer';

Game.propTypes = {
  questions: PropTypes.array
};

export default function Game({ questions = [] }) {
  return (
    <div style={{ width: '100%', padding: '0' }}>
      {questions.length > 0 ? (
        <QuestionViewer questions={questions} />
      ) : (
        <Loading />
      )}
    </div>
  );
}
