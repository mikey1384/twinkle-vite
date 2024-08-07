import React, { useEffect, useState } from 'react';
import FileIcon from '~/components/FileIcon';
import Image from '~/components/Image';
import ExtractedThumb from '~/components/ExtractedThumb';
import { truncateText } from '~/helpers/stringHelpers';

export default function FileContent({
  imageUrl,
  file,
  fileType,
  style,
  fileIconSize = '3x',
  fileNameStyle = {},
  fileNameLength,
  imageBackgroundColor,
  onThumbnailLoad
}: {
  imageUrl?: string;
  file: any;
  fileType: string;
  style?: React.CSSProperties;
  fileIconSize?: string;
  fileNameStyle?: React.CSSProperties;
  fileNameLength?: number;
  imageBackgroundColor?: string;
  onThumbnailLoad?: (thumbUrl: string) => void;
}) {
  const [videoSrc, setVideoSrc] = useState('');

  useEffect(() => {
    if (fileType === 'video') {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  }, [file, fileType]);

  return (
    <div
      style={{
        width: fileType === 'image' ? '8rem' : '7rem',
        height: '4rem',
        ...style
      }}
    >
      {videoSrc && (
        <ExtractedThumb
          isHidden
          src={videoSrc}
          onThumbnailLoad={handleThumbnailLoad}
        />
      )}
      {fileType === 'image' && imageUrl ? (
        <Image backgroundColor={imageBackgroundColor} imageUrl={imageUrl} />
      ) : (
        <FileIcon size={fileIconSize} fileType={fileType} />
      )}
      <div
        style={{
          textAlign: 'center',
          ...fileNameStyle
        }}
      >
        {truncateText({ text: file.name, limit: fileNameLength || 10 })}
      </div>
    </div>
  );

  function handleThumbnailLoad({
    thumbnails,
    selectedIndex
  }: {
    thumbnails: string[];
    selectedIndex: number;
  }) {
    if (onThumbnailLoad) {
      onThumbnailLoad(thumbnails[selectedIndex]);
    }
  }
}
