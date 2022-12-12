import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import Main from './Main';

Game.propTypes = {
  isOnStreak: PropTypes.bool,
  questionIds: PropTypes.array,
  questionObj: PropTypes.object,
  onGameFinish: PropTypes.func.isRequired,
  onSetQuestionObj: PropTypes.func.isRequired
};

export default function Game({
  isOnStreak,
  questionIds,
  questionObj,
  onGameFinish,
  onSetQuestionObj
}) {
  return (
    <div style={{ width: '100%', paddingTop: '3.5rem' }}>
      {questionIds.length > 0 ? (
        <Main
          questionIds={questionIds}
          questionObj={questionObj}
          isOnStreak={isOnStreak}
          onGameFinish={onGameFinish}
          onSetQuestionObj={onSetQuestionObj}
        />
      ) : (
        <Loading />
      )}
    </div>
  );
}
