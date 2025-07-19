import React from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import ProgressBar from '~/components/ProgressBar';
import { css } from '@emotion/css';
import { priceTable } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';

ItemPanel.propTypes = {
  requiredKarmaPoints: PropTypes.number,
  karmaPoints: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object,
  unlockProgress: PropTypes.number
};

export default function ItemPanel({
  className,
  requiredKarmaPoints,
  style,
  karmaPoints,
  unlockProgress
}: {
  className?: string;
  requiredKarmaPoints: number;
  style?: React.CSSProperties;
  karmaPoints: number;
  unlockProgress: number;
}) {
  const canChangeUsername = useKeyContext((v) => v.myState.canChangeUsername);

  return (
    <div
      className={`${css`
        border-radius: ${borderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
        }
      `} ${className}`}
      style={{
        border: `1px solid ${Color.borderGray()}`,
        background: '#fff',
        transition: 'border 0.2s, box-shadow 0.2s',
        padding: '1rem',
        ...style
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '2rem' }}>
        Change your username
      </div>
      {!canChangeUsername && (
        <>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Requires {addCommasToNumber(requiredKarmaPoints)} KP
          </p>
          <p style={{ fontSize: '1.3rem', marginTop: '0.5rem' }}>
            {`Unlock this item to change your username anytime you want for ${priceTable.username} Twinkle Coins`}
          </p>
        </>
      )}
      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.7rem'
        }}
      >
        <Icon size="3x" icon="lock" />
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            width: '100%',
            justifyContent: 'center'
          }}
        >
          <Button
            disabled={unlockProgress < 100}
            skeuomorphic
            color="green"
            onClick={() => null}
          >
            <Icon icon="unlock" />
            <span style={{ marginLeft: '0.7rem' }}>Unlock</span>
          </Button>
        </div>
      </div>
      <ProgressBar
        color={unlockProgress === 100 ? Color.green() : ''}
        progress={unlockProgress}
      />
      <p
        style={{ fontSize: '1.2rem', marginTop: '0.5rem', textAlign: 'center' }}
      >
        You need <b>{addCommasToNumber(requiredKarmaPoints)} karma points</b> to
        unlock this item. You have{' '}
        <b>
          {addCommasToNumber(karmaPoints)} karma point
          {karmaPoints === 1 ? '' : 's'}
        </b>
      </p>
    </div>
  );
}
