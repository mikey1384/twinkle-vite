import React, { useState } from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

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
          className={`unselectable ${css`
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            backdrop-filter: blur(50px);
            background: rgba(255, 255, 255, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: bold;
            font-wize: 1.7rem;
            color: ${Color.black()};
            cursor: pointer;
            @media (max-width: ${mobileMaxWidth}) {
              color: #fff;
              background: ${Color.darkerGray(0.9)};
            }
          `}`}
          onClick={() => setIsRevealed(true)}
        >
          {loaded ? 'Click to reveal image' : ''}
        </div>
      )}
    </div>
  );
}
