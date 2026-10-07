import React from 'react';
import { css, cx } from '@emotion/css';
import { iconUri, type IconName } from './pixelUi';

// A decorative pixel icon; `scale` screen pixels per art pixel
export default function PixelIcon({
  name,
  scale = 2,
  className
}: {
  name: IconName;
  scale?: number;
  className?: string;
}) {
  const { uri, w, h } = iconUri(name);
  return (
    <img
      src={uri}
      width={w * scale}
      height={h * scale}
      alt=""
      aria-hidden
      draggable={false}
      className={cx(iconCls, className)}
    />
  );
}

const iconCls = css`
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
  image-rendering: pixelated;
  pointer-events: none;
`;
