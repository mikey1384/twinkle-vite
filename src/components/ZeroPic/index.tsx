import React from 'react';
import zeroFull from './zero-full.png';
import cielFull from './ciel-full.png';

export default function ZeroPic({
  style,
  assistant = 'Zero'
}: {
  style?: React.CSSProperties;
  assistant?: 'Zero' | 'Ciel';
}) {
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
        alt={assistant}
        loading="lazy"
        style={{
          display: 'block',
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%'
        }}
        src={assistant === 'Ciel' ? cielFull : zeroFull}
      />
    </div>
  );
}
