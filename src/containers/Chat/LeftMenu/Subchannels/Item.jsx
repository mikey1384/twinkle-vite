import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

Item.propTypes = {
  children: PropTypes.node.isRequired
};

export default function Item({ children }) {
  return (
    <div
      className={css`
        cursor: pointer;
        width: 100%;
        padding: 0.7rem 2.5rem;
        text-align: left;
        font-size: 1.4rem;
        font-family: Helvetica;
        &:hover {
          background: ${Color.highlightGray()};
        }
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0.7rem 1rem;
          font-size: 1.2rem;
        }
      `}
    >
      {children}
    </div>
  );
}
