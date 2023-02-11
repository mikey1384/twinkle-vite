import PropTypes from 'prop-types';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

Body.propTypes = {
  children: PropTypes.node
};

export default function Body({ children }) {
  return (
    <div
      style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      className={`unselectable ${css`
        width: 60%;
        cursor: pointer;
        &:hover {
          > .panel {
            background-color: #f5f5f5;
          }
        }
        @media (max-width: 768px) {
          width: ${mobileMaxWidth};
        }
      `}`}
    >
      {children}
    </div>
  );
}
