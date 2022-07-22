import React from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import localize from '~/constants/localize';

const callLabel = localize('call');
const hangUpLabel = localize('hangUp');

CallButton.propTypes = {
  callOngoing: PropTypes.bool,
  onCall: PropTypes.func
};

export default function CallButton({ callOngoing, onCall }) {
  return (
    <div
      className={css`
        padding: 1rem;
        background: ${callOngoing ? Color.rose(0.8) : Color.darkBlue(0.8)};
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s;
        @media (max-width: ${mobileMaxWidth}) {
          background: ${callOngoing ? Color.rose(1) : Color.darkBlue(1)};
        }
        @media (min-width: ${desktopMinWidth}) {
          &:hover {
            background: ${callOngoing ? Color.rose(1) : Color.darkBlue(1)};
          }
        }
      `}
      onClick={onCall}
    >
      {!callOngoing && <Icon icon="phone-volume" />}
      <span style={{ marginLeft: '1rem' }}>
        {!callOngoing ? callLabel : hangUpLabel}
      </span>
    </div>
  );
}
