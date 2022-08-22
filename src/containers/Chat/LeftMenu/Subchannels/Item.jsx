import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

Item.propTypes = {
  children: PropTypes.node.isRequired
};

export default function Item({ children }) {
  return (
    <div
      className={css`
        cursor: pointer;
        width: 100%;
        padding: 0.7rem;
        text-align: center;
        font-size: 1.5rem;
        font-family: Helvetica;
        &:hover {
          background: ${Color.highlightGray()};
        }
      `}
    >
      <div>{children}</div>
    </div>
  );
}
