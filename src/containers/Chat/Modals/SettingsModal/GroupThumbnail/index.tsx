import React, { useState } from 'react';
import ChangePicture from './ChangePicture';

export default function GroupThumbnail({
  className,
  onClick,
  thumbUrl = '/img/default.png',
  style
}: {
  className?: string;
  onClick: () => void;
  thumbUrl?: string;
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
        paddingBottom: '100%',
        ...style
      }}
      onClick={onClick}
      onMouseEnter={() => setChangePictureShown(true)}
      onMouseLeave={() => setChangePictureShown(false)}
    >
      <img
        alt="Thumbnail"
        style={{
          display: 'block',
          position: 'absolute',
          width: '100%',
          height: '100%'
        }}
        src={thumbUrl}
      />
      <ChangePicture shown={changePictureShown} />
    </div>
  );
}
