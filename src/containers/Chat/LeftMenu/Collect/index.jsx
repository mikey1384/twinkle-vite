import { memo } from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Vocabulary from './Vocabulary';

Collect.propTypes = {
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

function Collect({ selected, onClick }) {
  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Vocabulary">
      <div
        style={{
          cursor: 'pointer',
          padding: '1rem',
          borderBottom: `1px solid ${Color.borderGray()}`,
          background: selected && Color.highlightGray()
        }}
        className={`unselectable ${css`
          &:hover {
            background: ${Color.checkboxAreaGray()};
          }
        `}`}
        onClick={onClick}
      >
        <Vocabulary />
      </div>
    </ErrorBoundary>
  );
}

export default memo(Collect);
