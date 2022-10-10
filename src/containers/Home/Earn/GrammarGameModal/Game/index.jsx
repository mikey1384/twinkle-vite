import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import Main from './Main';

Game.propTypes = {
  isOnStreak: PropTypes.bool,
  questionIds: PropTypes.array,
  questionObj: PropTypes.object,
  onSetGameState: PropTypes.func.isRequired,
  onSetQuestionObj: PropTypes.func.isRequired
};

export default function Game({
  isOnStreak,
  questionIds,
  questionObj,
  onSetGameState,
  onSetQuestionObj
}) {
  return (
    <div style={{ width: '100%', paddingTop: '3.5rem' }}>
      {onSetGameState.length > 0 ? (
        <Main
          questionIds={questionIds}
          questionObj={questionObj}
          isOnStreak={isOnStreak}
          onSetGameState={onSetGameState}
          onSetQuestionObj={onSetQuestionObj}
        />
      ) : (
        <Loading />
      )}
    </div>
  );
}
