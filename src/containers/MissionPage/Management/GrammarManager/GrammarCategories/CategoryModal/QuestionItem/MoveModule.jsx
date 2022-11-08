import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

MoveModule.propTypes = {
  categories: PropTypes.array.isRequired
};

export default function MoveModule({ categories }) {
  return (
    <div
      style={{
        width: '100%',
        textAlign: 'center',
        padding: '1rem',
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      {categories.map((category, index) => (
        <div key={index}>
          <span
            className={css`
              line-height: 2;
              width: auto;
              cursor: pointer;
              color: ${Color.blue()};
              &:hover {
                text-decoration: underline;
              }
            `}
          >
            {category}
          </span>
        </div>
      ))}
    </div>
  );
}
