import React, { useMemo } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function ZeroButtons({
  buttonColor,
  buttonHoverColor,
  zEnergy
}: {
  buttonColor: string;
  buttonHoverColor: string;
  zEnergy: number;
}) {
  const displayedZEnergy = useMemo(
    () => (zEnergy ? addCommasToNumber(zEnergy) : 'No Energy'),
    [zEnergy]
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Button
        skeuomorphic
        onClick={() => console.log('button pressed')}
        color={buttonColor}
        mobilePadding="0.5rem"
        hoverColor={buttonHoverColor}
      >
        <Icon size="lg" icon="battery-empty" />
        <span style={{ marginLeft: '0.7rem' }}>{displayedZEnergy}</span>
      </Button>
    </div>
  );
}
