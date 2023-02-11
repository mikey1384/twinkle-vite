import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
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
            background-color: ${Color.highlightGray()};
            @media (max-width: ${mobileMaxWidth}) {
              background-color: transparent;
            }
          }
        }
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}`}
    >
      {children}
    </div>
  );
}
