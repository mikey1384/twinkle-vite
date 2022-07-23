import PropTypes from 'prop-types';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import TextMessage from './TextMessage';
import WordleResult from './WordleResult';

TargetMessage.propTypes = {
  message: PropTypes.object.isRequired
};

export default function TargetMessage({ message }) {
  return (
    <div
      className={css`
        width: 85%;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      {message.wordleResult ? (
        <WordleResult
          username={message.username}
          userId={message.userId}
          timeStamp={message.timeStamp}
          wordleResult={message.wordleResult}
        />
      ) : (
        <TextMessage message={message} />
      )}
    </div>
  );
}
