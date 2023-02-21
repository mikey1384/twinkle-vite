import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import localize from '~/constants/localize';

const callLabel = localize('call');
const hangUpLabel = localize('hangUp');

CallButton.propTypes = {
  callOngoing: PropTypes.bool,
  disabled: PropTypes.bool,
  onCall: PropTypes.func
};

export default function CallButton({ callOngoing, disabled, onCall }) {
  return (
    <button
      className={css`
        font-size: 1.6rem;
        padding: 1.5rem;
        background: ${callOngoing ? Color.rose(0.9) : Color.darkBlue(0.9)};
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: ${disabled ? 'not-allowed' : 'pointer'};
        border: none;
        opacity: ${disabled ? 0.5 : 1};
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
      disabled={disabled}
      onClick={onCall}
    >
      {!callOngoing && <Icon icon="phone-volume" />}
      <span style={{ marginLeft: '1rem' }}>
        {!callOngoing ? callLabel : hangUpLabel}
      </span>
    </button>
  );
}
