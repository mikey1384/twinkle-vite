import React from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';

NavButton.propTypes = {
  disabled: PropTypes.bool.isRequired,
  onGoToNextSlide: PropTypes.func.isRequired,
  left: PropTypes.bool
};
export default function NavButton({
  disabled,
  onGoToNextSlide,
  left
}: {
  disabled: boolean;
  onGoToNextSlide: () => void;
  left?: boolean;
}) {
  return disabled ? null : (
    <ErrorBoundary componentPath="Carousel/NavButton">
      <Button
        className={css`
          position: absolute;
          opacity: 0.9;
          top: CALC(50% - 2rem);
          ${left ? 'left: -0.5rem;' : 'right: -0.5rem;'};
        `}
        skeuomorphic
        color="darkerGray"
        onClick={handleClick}
      >
        <Icon icon={left ? 'chevron-left' : 'chevron-right'} />
      </Button>
    </ErrorBoundary>
  );

  function handleClick() {
    onGoToNextSlide();
  }
}
