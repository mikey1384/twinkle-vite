import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { useChatContext } from '~/contexts';

StatusInterface.propTypes = {
  posting: PropTypes.bool,
  statusMessage: PropTypes.string
};

export default function StatusInterface({ posting, statusMessage }) {
  const aiImageErrorMessage = useChatContext(
    (v) => v.state.aiImageErrorMessage
  );
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }}
    >
      {(!stringIsEmpty(statusMessage) ||
        !stringIsEmpty(aiImageErrorMessage)) && (
        <div
          className={css`
            p {
              font-family: monospace;
              display: inline-block;
              &.posting {
                clip-path: inset(0 3ch 0 0);
                animation: dotdotdot 1s steps(4) infinite;
              }
            }
            @keyframes dotdotdot {
              to {
                clip-path: inset(0 -1ch 0 0);
              }
            }
          `}
          style={{
            textAlign: 'center',
            width: '100%',
            color: '#fff',
            background: Color[aiImageErrorMessage ? 'rose' : 'black'](),
            padding: '1rem'
          }}
        >
          <p className={posting ? 'posting' : ''}>
            {aiImageErrorMessage || statusMessage}
          </p>
        </div>
      )}
    </div>
  );
}
