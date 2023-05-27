import React, { useState } from 'react';
import { Color } from '~/constants/css';

export default function ImageComponent({
  src,
  alt,
  onSetErrorLoadingImage,
  ...commonProps
}: {
  src: string;
  alt?: string;
  onSetErrorLoadingImage: (v: boolean) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block'
      }}
    >
      <img
        {...commonProps}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => onSetErrorLoadingImage(true)}
      />
      {alt === 'secret' && !isRevealed && (
        <div
          className="unselectable"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1.7rem',
            color: Color.black(),
            cursor: 'pointer'
          }}
          onClick={() => setIsRevealed(true)}
        >
          {loaded ? 'Click to reveal image' : ''}
        </div>
      )}
    </div>
  );
}
