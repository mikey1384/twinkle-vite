import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

Heading.propTypes = {
  color: PropTypes.string,
  children: PropTypes.node
};

export default function Heading({ color, children }) {
  return (
    <div
      className={css`
        font-size: 2rem;
        padding: 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.7rem;
          padding: 1.5rem;
        }
      `}
      style={{
        marginTop: '1rem',
        marginBottom: '0.5rem',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: 'Roboto, monospace',
        fontWeight: 'bold',
        backgroundColor: Color[color](),
        color: '#fff'
      }}
    >
      {children}
    </div>
  );
}
