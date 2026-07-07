import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { borderRadius, innerBorderRadius } from '~/constants/css';
import { useDragSort } from '~/helpers/hooks';

export default function Picture({
  numPictures,
  picture,
  style,
  onMove
}: {
  picture: any;
  numPictures: number;
  style: React.CSSProperties;
  onMove: (arg0: any) => any;
}) {
  const imageUrl = useMemo(() => {
    return picture?.src ? `${cloudFrontURL}${picture?.src}` : '';
  }, [picture]);
  const width = Math.min(100 / (numPictures + 1), 33);
  const { isDragging, dragProps } = useDragSort({
    group: 'profilePicture',
    id: picture.id,
    onMove
  });

  return (
    <div
      {...dragProps}
      className={css`
        cursor: pointer;
        touch-action: none;
        opacity: ${isDragging ? 0.5 : 1};
        background: black;
        position: relative;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        width: ${width}%;
        padding-bottom: CALC(${width}% - 2px);
      `}
      style={style}
    >
      <img
        loading="lazy"
        style={{
          borderRadius: innerBorderRadius,
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center'
        }}
        src={imageUrl}
      />
    </div>
  );
}
