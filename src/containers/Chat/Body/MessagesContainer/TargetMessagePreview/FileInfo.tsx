import React, { useMemo } from 'react';
import ExtractedThumb from '~/components/ExtractedThumb';
import Image from '~/components/Image';
import FileIcon from '~/components/FileIcon';
import { cloudFrontURL } from '~/constants/defaultValues';

export default function FileInfo({
  fileType,
  fileName,
  filePath,
  thumbUrl
}: {
  fileName: string;
  fileType: string;
  filePath: string;
  thumbUrl: string;
}) {
  const src = useMemo(() => {
    if (!filePath || (fileType !== 'image' && fileType !== 'video')) {
      return '';
    }
    return `${cloudFrontURL}/attachments/chat/${filePath}/${encodeURIComponent(
      fileName
    )}`;
  }, [fileType, fileName, filePath]);

  return (
    <div style={{ display: 'flex', width: src ? '12rem' : 'auto' }}>
      {fileType === 'image' ? (
        <Image imageUrl={src} />
      ) : fileType === 'video' ? (
        <ExtractedThumb
          src={src}
          style={{ width: '100%', height: '7rem' }}
          thumbUrl={thumbUrl}
        />
      ) : (
        <FileIcon size="5x" fileType={fileType} />
      )}
    </div>
  );
}
