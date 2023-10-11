import React, { useState } from 'react';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function ItemThumbPanel({
  isThumb,
  thumbSize = '4rem',
  itemName,
  badgeSrc,
  style
}: {
  isThumb?: boolean;
  thumbSize?: string;
  itemName: string;
  badgeSrc?: string;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={
        isThumb
          ? css`
              width: ${thumbSize};
              height: ${thumbSize};
            `
          : css`
              display: flex;
              align-items: center;
              gap: 1rem;
            `
      }
      style={style}
    >
      {badgeSrc && (
        <img
          onMouseOver={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          src={badgeSrc}
          alt="Badge"
          className={css`
            width: ${thumbSize};
            height: ${thumbSize};
          `}
        />
      )}
      {isThumb && <FullTextReveal show={hovered} text={itemName} />}
      {!isThumb && (
        <span
          className={css`
            font-weight: bold;
            color: ${Color.black()};
            font-size: 1.5rem;
          `}
        >
          {itemName}
        </span>
      )}
    </div>
  );
}
