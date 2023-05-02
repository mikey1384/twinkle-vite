import React from 'react';
import CloseButton from '~/components/Buttons/CloseButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import WebsiteContent from './WebsiteContent';
import FileContent from '~/components/FileContent';

export default function Attachment({
  attachment,
  attachment: { contentType = 'file', fileType },
  onClose,
  onThumbnailLoad,
  style
}: {
  attachment: any;
  onClose: () => void;
  onThumbnailLoad?: () => void;
  style?: any;
}) {
  return (
    <ErrorBoundary
      componentPath="Attachment/index"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        ...style
      }}
    >
      <CloseButton onClick={onClose} />
      {contentType === 'file' ? (
        <FileContent
          file={attachment.file}
          fileType={fileType}
          imageUrl={attachment.imageUrl}
          onThumbnailLoad={onThumbnailLoad}
        />
      ) : (
        <WebsiteContent attachment={attachment} />
      )}
    </ErrorBoundary>
  );
}
