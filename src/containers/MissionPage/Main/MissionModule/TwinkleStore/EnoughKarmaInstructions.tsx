import React from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

EnoughKarmaInstructions.propTypes = {
  requiredKarmaPoints: PropTypes.number
};

export default function EnoughKarmaInstructions({
  requiredKarmaPoints
}: {
  requiredKarmaPoints: number;
}) {
  return (
    <div
      className={css`
        width: 60%;
        padding: 0 1rem;
        text-align: center;
        @media (max-width: ${mobileMaxWidth}) {
          width: 90%;
        }
      `}
    >
      <p>
        You have successfully earned the{' '}
        <b>{requiredKarmaPoints} karma points</b> required to enable the unlock
        button!
      </p>
      <p style={{ marginTop: '5rem' }}>
        Now go to{' '}
        <a style={{ fontWeight: 'bold' }} href="/settings" target="_blank">
          Settings
        </a>
        , press the{' '}
        <span style={{ color: Color.green(), fontWeight: 'bold' }}>
          <Icon icon="unlock" /> unlock{' '}
        </span>
        button, and
      </p>
      <p>come back here when you are done</p>
    </div>
  );
}
