import React from 'react';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';

export default function Image({
  imageUrl,
  backgroundColor,
  onClick
}: {
  backgroundColor: string;
  imageUrl: string;
  onClick?: () => void;
}) {
  return imageUrl ? (
    <div
      onClick={onClick}
      style={{
        cursor: !!onClick ? 'pointer' : 'default',
        width: '100%',
        height: '100%',
        background: backgroundColor || Color.black()
      }}
    >
      <img
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        src={imageUrl}
        rel=""
      />
    </div>
  ) : (
    <Loading />
  );
}
