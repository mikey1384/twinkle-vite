import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import QuestionCarousel from './QuestionCarousel';

Game.propTypes = {
  questions: PropTypes.array
};

export default function Game({ questions = [] }) {
  return (
    <div style={{ width: '100%', padding: '0 3rem 2rem 3rem' }}>
      {questions.length > 0 ? (
        <QuestionCarousel questions={questions} />
      ) : (
        <Loading />
      )}
    </div>
  );
}
