import React from 'react';
import Icon from '~/components/Icon';
const changePictureLabel = 'Change Picture';

export default function ChangePicture({ shown }: { shown: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '50%',
        bottom: 0,
        left: 0,
        position: 'absolute',
        borderBottomRightRadius: '50%',
        borderBottomLeftRadius: '50%',
        background: shown ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0)',
        opacity: shown ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out, background 0.3s ease-in-out',
        zIndex: 9999
      }}
    >
      <div
        style={{
          display: 'flex',
          color: '#fff',
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
