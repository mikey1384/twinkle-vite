import React, { memo } from 'react';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';

function Image({
  imageUrl,
  backgroundColor,
  draggable,
  cursor,
  onClick
}: {
  backgroundColor?: string;
  imageUrl: string;
  draggable?: boolean;
  cursor?: string;
  onClick?: () => void;
}) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {imageUrl ? (
        <div
          onClick={onClick}
          style={{
            cursor: onClick ? 'pointer' : cursor || 'default',
            width: '100%',
            height: '100%',
            background: backgroundColor || Color.black()
          }}
        >
          <img
            draggable={draggable}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            loading="lazy"
            src={imageUrl}
            rel=""
          />
        </div>
      ) : (
        <Loading />
      )}
    </div>
  );
}

export default memo(Image);
