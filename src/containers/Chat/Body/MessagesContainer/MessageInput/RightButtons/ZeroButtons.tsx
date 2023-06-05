import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

export default function ZeroButtons({
  buttonColor,
  buttonHoverColor
}: {
  buttonColor: string;
  buttonHoverColor: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Button
        skeuomorphic
        onClick={() => console.log('button pressed')}
        color={buttonColor}
        mobilePadding="0.5rem"
        hoverColor={buttonHoverColor}
      >
        <Icon size="lg" icon={['far', 'badge-dollar']} />
      </Button>
    </div>
  );
}
