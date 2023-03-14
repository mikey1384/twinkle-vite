import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import zero from './zero.png';
import { css } from '@emotion/css';

ZeroButton.propTypes = {
  style: PropTypes.object
};

export default function ZeroButton({ style }) {
  return (
    <ErrorBoundary componentPath="Buttons/ZeroButton">
      <Button
        style={{
          background: `no-repeat center/80% url(${zero})`,
          ...style
        }}
        className={css`
          opacity: 0.5;
          &:hover {
            opacity: 1;
          }
        `}
        skeuomorphic
        onClick={() => console.log('clicked')}
      >
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </Button>
    </ErrorBoundary>
  );
}
