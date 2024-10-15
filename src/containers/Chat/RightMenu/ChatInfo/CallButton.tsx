import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import localize from '~/constants/localize';
import ChatFlatButton from '../../ChatFlatButton';

const callLabel = localize('call');
const hangUpLabel = localize('hangUp');

export default function CallButton({
  callOngoing,
  disabled,
  onCall
}: {
  callOngoing: boolean;
  disabled: boolean;
  onCall: () => void;
}) {
  const buttonColor = callOngoing ? Color.rose(0.9) : Color.darkBlue(0.9);
  const buttonHoverColor = callOngoing ? Color.rose(1) : Color.darkBlue(1);

  return (
    <div
      className={css`
        padding: 1rem;
      `}
    >
      <ChatFlatButton
        label={callOngoing ? hangUpLabel : callLabel}
        onClick={onCall}
        buttonColor={buttonColor}
        buttonHoverColor={buttonHoverColor}
        textColor="white"
        icon={callOngoing ? 'phone-slash' : 'phone-volume'}
        disabled={disabled}
        style={{ padding: '1.2rem' }}
      />
    </div>
  );
}
