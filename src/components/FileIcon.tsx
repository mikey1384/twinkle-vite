import React from 'react';
import Icon from '~/components/Icon';

export default function FileIcon({
  fileType,
  size = '7x',
  onClick,
  style
}: {
  fileType: string;
  onClick?: () => void;
  size: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onClick={onClick}
    >
      {fileType === 'other' && <Icon size={size} icon="file" />}
      {fileType !== 'other' && <Icon size={size} icon={`file-${fileType}`} />}
    </div>
  );
}
