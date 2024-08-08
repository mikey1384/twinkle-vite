import React from 'react';
import PropTypes from 'prop-types';
import CloseButton from '~/components/Buttons/CloseButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import WebsiteContent from './WebsiteContent';
import FileContent from '~/components/FileContent';
import { Attachment as AttachmentType } from '~/types';

Attachment.propTypes = {
  attachment: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func,
  onDragStart: PropTypes.func,
  onThumbnailLoad: PropTypes.func,
  style: PropTypes.object
};
export default function Attachment({
  attachment,
  attachment: { contentType = 'file', fileType },
  onClose,
  onDragStart,
  onDragEnd,
  onThumbnailLoad,
  style
}: {
  attachment: AttachmentType;
  onClose: () => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
  onThumbnailLoad?: (data: {
    thumbnails: string[];
    selectedIndex: number;
  }) => void;
  style?: React.CSSProperties;
}) {
  return (
    <ErrorBoundary
      componentPath="Attachment/index"
      onDragStart={onDragStart ?? undefined}
      onDragEnd={onDragEnd ?? undefined}
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
