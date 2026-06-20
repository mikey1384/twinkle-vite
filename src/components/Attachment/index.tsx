import React from 'react';
import CloseButton from '~/components/Buttons/CloseButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import WebsiteContent from './WebsiteContent';
import FileContent from '~/components/FileContent';
import useImageThumbnailTouchDrag from '~/helpers/hooks/useImageThumbnailTouchDrag';
import { Attachment as AttachmentType } from '~/types';

export default function Attachment({
  attachment,
  attachment: { contentType = 'file', fileType },
  onClose,
  onDragStart,
  onDragEnd,
  onDragEmbed,
  embedUploading,
  onThumbnailLoad,
  style
}: {
  attachment: AttachmentType;
  onClose: () => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
  // Called when the thumbnail is dropped onto the text area via touch drag.
  onDragEmbed?: () => void;
  embedUploading?: boolean;
  onThumbnailLoad?: (data: {
    thumbnails: string[];
    selectedIndex: number;
  }) => void;
  style?: React.CSSProperties;
}) {
  // Drag-to-embed produces ![](url), which only makes sense for images. Gate
  // both the native (mouse) and touch paths to image thumbnails so a non-image
  // file attachment can't be dragged into broken image markdown.
  const isImageThumbnail =
    contentType === 'file' && fileType === 'image' && !!attachment.imageUrl;
  const isDraggable = !!onDragStart && isImageThumbnail;
  const touchEnabled = !!onDragEmbed && isImageThumbnail;

  // The touch drop path (onDragEmbed) is self-contained: it reads the
  // attachment file directly and clears the attachment on success. It must NOT
  // set the shared `draggedFile` state (used only by the native mouse-drop
  // path), or a later native file drop would upload this stale attachment
  // instead of the dropped file. So we wire only onDrop here.
  const { thumbHandlers, ghost } = useImageThumbnailTouchDrag({
    enabled: touchEnabled,
    previewUrl: attachment.imageUrl,
    isValidDropTarget: (el) =>
      !!el && (el as HTMLElement).tagName === 'TEXTAREA',
    onDrop: onDragEmbed || (() => {})
  });

  return (
    <ErrorBoundary
      componentPath="Attachment/index"
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onDragEnd={onDragEnd ?? undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        // Don't let the flex parent stretch the tile to the textarea's height;
        // the drag handle should only cover the thumbnail, not a tall column.
        alignSelf: 'flex-start',
        cursor: isDraggable ? 'grab' : undefined,
        ...style
      }}
    >
      <div
        {...thumbHandlers}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          touchAction: touchEnabled ? 'none' : undefined,
          opacity: embedUploading ? 0.5 : 1
        }}
      >
        <span data-attachment-no-drag>
          <CloseButton onClick={onClose} />
        </span>
        {contentType === 'file' ? (
          <FileContent
            file={attachment.file}
            fileType={fileType}
            imageUrl={attachment.imageUrl}
            imageDraggable={false}
            imageCursor={isDraggable ? 'grab' : undefined}
            onThumbnailLoad={onThumbnailLoad}
          />
        ) : (
          <WebsiteContent attachment={attachment} />
        )}
        {embedUploading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <Loading />
          </div>
        )}
      </div>
      {ghost}
    </ErrorBoundary>
  );

  function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
    if (!onDragStart) return;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      // Firefox aborts a drag unless dataTransfer is populated during
      // dragstart; an empty payload is enough to keep the drag alive. The
      // drop target (Textarea) reads the dragged File from React state, not
      // from dataTransfer, so no real payload is needed here.
      event.dataTransfer.setData('text/plain', '');
    }
    onDragStart(event);
  }
}
