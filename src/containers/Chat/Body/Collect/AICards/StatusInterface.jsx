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
  const aiCardErrorMessage = useChatContext((v) => v.state.aiCardErrorMessage);
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
        !stringIsEmpty(aiCardErrorMessage)) && (
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
          `}
          style={{
            textAlign: 'center',
            width: '100%',
            color: '#fff',
            background: Color[aiCardErrorMessage ? 'rose' : 'black'](),
            padding: '1rem'
          }}
        >
          <p className={posting ? 'posting' : ''}>
            {aiCardErrorMessage || statusMessage}
          </p>
        </div>
      )}
    </div>
  );
}
