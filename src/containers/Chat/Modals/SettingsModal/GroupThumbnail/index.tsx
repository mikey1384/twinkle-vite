import React, { useState } from 'react';
import ChangePicture from './ChangePicture';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';

export default function GroupThumbnail({
  className,
  onClick,
  thumbUrl,
  style
}: {
  className?: string;
  onClick: () => void;
  thumbUrl?: string | null;
  style?: React.CSSProperties;
}) {
  const [changePictureShown, setChangePictureShown] = useState(false);

  return (
    <div
      className={className}
      style={{
        display: 'block',
        position: 'relative',
        userSelect: 'none',
        cursor: 'pointer',
        background: Color.darkerGray(),
        ...(thumbUrl ? { paddingBottom: '100%' } : {}),
        ...style
      }}
      onClick={onClick}
      onMouseEnter={() => setChangePictureShown(true)}
      onMouseLeave={() => setChangePictureShown(false)}
    >
      {thumbUrl ? (
        <img
          loading="lazy"
          fetchPriority="low"
          alt="Thumbnail"
          style={{
            display: 'block',
            position: 'absolute',
            width: '100%',
            height: '100%'
          }}
          src={thumbUrl}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Icon style={{ color: '#fff' }} size="2x" icon="camera" />
            <div
              style={{ color: '#fff', fontSize: '1.2rem', marginTop: '0.5rem' }}
            >
              Set Thumbnail
            </div>
          </div>
        </div>
      )}
      {thumbUrl && <ChangePicture shown={changePictureShown} />}
    </div>
  );
}
