import React from 'react';
import PropTypes from 'prop-types';
import StepSlide from '../components/StepSlide';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

MakeAccount.propTypes = {
  index: PropTypes.number,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  okayPressed: PropTypes.bool,
  onSetOkayPressed: PropTypes.func.isRequired
};

export default function MakeAccount({
  index,
  innerRef,
  okayPressed,
  onSetOkayPressed
}) {
  return (
    <StepSlide
      index={index}
      innerRef={innerRef}
      title={
        <>
          Go to{' '}
          <a
            onClick={() => onSetOkayPressed(true)}
            href="https://vercel.com"
            target="_blank"
            rel="noreferrer"
          >
            https://vercel.com
          </a>{' '}
          and make a new account using the{' '}
          <b style={{ color: Color.orange() }}>GitHub</b> button
        </>
      }
    >
      {' '}
      {okayPressed && (
        <h1
          className={css`
            margin-top: 4.5rem;
            margin-bottom: 3.5rem;
          `}
        >
          Did you make an account?
        </h1>
      )}
    </StepSlide>
  );
}
