import React, { useEffect, useState } from 'react';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import localize from '~/constants/localize';

const changePictureLabel = localize('changePicture');

export default function ChangePicture({ shown }: { shown: boolean }) {
  const [opacity, setOpacity] = useState(0);
  useEffect(() => {
    setOpacity(shown ? 1 : 0);
  }, [shown]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '50%',
        marginTop: '50%',
        position: 'absolute',
        transition: 'background 0.5s',
        background: Color.black(Math.max(opacity - 0.3, 0))
      }}
    >
      <div
        style={{
          display: 'flex',
          color: Color.white(opacity),
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        <Icon icon="camera-alt" size="lg" />
        <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>
          {changePictureLabel}
        </div>
      </div>
    </div>
  );
}
