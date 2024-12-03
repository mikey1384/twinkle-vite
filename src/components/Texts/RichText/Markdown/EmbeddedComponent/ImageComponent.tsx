import React, { useState } from 'react';
import { Color } from '~/constants/css';
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
      className={css`
        position: relative;
        display: inline-block;
      `}
    >
      <img
        {...commonProps}
        src={src}
        alt={alt}
        loading="lazy"
        fetchPriority="low"
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
            background: rgba(255, 255, 255, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: bold;
            font-size: 1.7rem;
            color: ${Color.black()};
            cursor: pointer;

            @supports (backdrop-filter: blur(50px)) {
              backdrop-filter: blur(50px);
            }

            @supports not (backdrop-filter: blur(50px)) {
              color: #fff;
              background: ${Color.darkerGray()};
            }
          `}`}
          onClick={() => setIsRevealed(true)}
        >
          {loaded ? 'Tap to reveal image' : ''}
        </div>
      )}
    </div>
  );
}
