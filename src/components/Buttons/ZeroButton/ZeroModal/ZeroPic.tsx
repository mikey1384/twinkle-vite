import React from 'react';
import zeroFull from './zero-full.png';

export default function ZeroPic({ style }: { style?: any }) {
  return (
    <div
      style={{
        display: 'block',
        position: 'relative',
        userSelect: 'none',
        borderRadius: '50%',
        paddingBottom: '100%',
        ...style
      }}
    >
      <img
        alt="Thumbnail"
        style={{
          display: 'block',
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%'
        }}
        src={zeroFull}
      />
    </div>
  );
}
