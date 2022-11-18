import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

StatusInterface.propTypes = {
  posting: PropTypes.bool,
  statusMessage: PropTypes.string
};

export default function StatusInterface({ posting, statusMessage }) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }}
    >
      {!stringIsEmpty(statusMessage) && (
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
            background: Color.black(),
            padding: '1rem'
          }}
        >
          <p className={posting ? 'posting' : ''}>{statusMessage}</p>
        </div>
      )}
    </div>
  );
}
