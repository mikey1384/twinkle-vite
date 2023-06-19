import React, { useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import InfoModal from './InfoModal';
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
  const [infoModalShown, setInfoModalShown] = useState(false);
  const displayedZEnergy = useMemo(
    () => (zEnergy ? addCommasToNumber(zEnergy) : 'No Energy'),
    [zEnergy]
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Button
        skeuomorphic
        onClick={() => setInfoModalShown(true)}
        color={buttonColor}
        mobilePadding="0.5rem"
        hoverColor={buttonHoverColor}
      >
        <Icon size="lg" icon={zEnergy ? 'battery-full' : 'battery-empty'} />
        <span style={{ marginLeft: '0.7rem' }}>{displayedZEnergy}</span>
      </Button>
      {infoModalShown && <InfoModal onHide={() => setInfoModalShown(false)} />}
    </div>
  );
}
