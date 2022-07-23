import PropTypes from 'prop-types';
import TargetMessage from './TargetMessage';
import WordleResult from './WordleResult';

TargetMessagePreview.propTypes = {
  onClose: PropTypes.func.isRequired,
  replyTarget: PropTypes.object
};

export default function TargetMessagePreview({ onClose, replyTarget }) {
  return (
    <div
      style={{
        height: '12rem',
        width: '100%',
        position: 'relative',
        padding: '1rem 6rem 2rem 0.5rem',
        marginBottom: '2px'
      }}
    >
      {replyTarget.wordleResult ? (
        <WordleResult
          userId={replyTarget.userId}
          username={replyTarget.username}
          timeStamp={replyTarget.timeStamp}
          wordleResult={replyTarget.wordleResult}
          onClose={onClose}
        />
      ) : (
        <TargetMessage onClose={onClose} replyTarget={replyTarget} />
      )}
    </div>
  );
}
