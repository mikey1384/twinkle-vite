import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { setImageAttachmentDragData } from '~/helpers/imageAttachmentEmbedHelpers';

export { swapAttachmentWithNeighbor } from '~/helpers/imageAttachmentOrder';

export type ImageAttachmentStatus =
  'selected' | 'uploading' | 'ready' | 'error';

export interface ImageAttachment {
  id: string;
  file: File;
  fileName: string;
  previewUrl: string;
  previewUrlIsObjectUrl: boolean;
  progress: number;
  status: ImageAttachmentStatus;
  uploadedUrl?: string;
  error?: string;
}

export default function ImageAttachmentsBar({
  attachments,
  onRemove,
  removeDisabled,
  onEmbedAttachment,
  embedDisabled,
  onReorder,
  reorderDisabled
}: {
  attachments: ImageAttachment[];
  onRemove: (attachmentId: string) => void;
  removeDisabled?: boolean;
  onEmbedAttachment?: (attachmentId: string) => void;
  embedDisabled?: boolean;
  onReorder?: (attachmentId: string, direction: 'left' | 'right') => void;
  reorderDisabled?: boolean;
}) {
  if (attachments.length === 0) return null;

  const showReorderControls = !!onReorder && attachments.length > 1;
  const reorderButtonStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '0.3rem',
    padding: 0,
    width: '2.3rem',
    height: '2.3rem',
    minWidth: 0,
    borderRadius: '999px',
    background: Color.black(0.55),
    color: '#fff',
    opacity: reorderDisabled ? 0.35 : 1,
    zIndex: 2
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.6rem',
        padding: '0.2rem 0',
        marginBottom: '1rem'
      }}
    >
      {attachments.map((attachment, index) => (
        <div
          key={attachment.id}
          draggable={
            !!onEmbedAttachment &&
            !removeDisabled &&
            !embedDisabled &&
            attachment.status !== 'uploading'
          }
          onDragStart={(event) => {
            if (
              !onEmbedAttachment ||
              removeDisabled ||
              embedDisabled ||
              attachment.status === 'uploading'
            ) {
              event.preventDefault();
              return;
            }
            setImageAttachmentDragData(event.dataTransfer, attachment.id);
          }}
          style={{
            position: 'relative',
            width: '7rem',
            height: '7rem',
            borderRadius: '1rem',
            overflow: 'hidden',
            border: `1px solid ${Color.borderGray()}`,
            background: Color.wellGray(),
            cursor:
              onEmbedAttachment &&
              !removeDisabled &&
              !embedDisabled &&
              attachment.status !== 'uploading'
                ? 'grab'
                : 'default'
          }}
          aria-label={`Attached image: ${attachment.fileName}`}
        >
          <img
            src={attachment.previewUrl}
            alt={attachment.fileName}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
          <Button
            variant="ghost"
            disabled={removeDisabled}
            onClick={() => onRemove(attachment.id)}
            style={{
              position: 'absolute',
              top: '0.3rem',
              right: '0.3rem',
              padding: 0,
              width: '2.3rem',
              height: '2.3rem',
              minWidth: 0,
              borderRadius: '999px',
              background: Color.black(0.55),
              color: '#fff',
              opacity: removeDisabled ? 0.35 : 1,
              zIndex: 2
            }}
            aria-label={`Remove ${attachment.fileName}`}
          >
            <Icon icon="times" />
          </Button>
          {showReorderControls && index > 0 && (
            <Button
              variant="ghost"
              disabled={reorderDisabled}
              onClick={() => onReorder?.(attachment.id, 'left')}
              style={{ ...reorderButtonStyle, left: '0.3rem' }}
              aria-label={`Move ${attachment.fileName} left`}
            >
              <Icon icon="chevron-left" />
            </Button>
          )}
          {showReorderControls && index < attachments.length - 1 && (
            <Button
              variant="ghost"
              disabled={reorderDisabled}
              onClick={() => onReorder?.(attachment.id, 'right')}
              style={{ ...reorderButtonStyle, right: '0.3rem' }}
              aria-label={`Move ${attachment.fileName} right`}
            >
              <Icon icon="chevron-right" />
            </Button>
          )}
          {(attachment.status === 'uploading' ||
            attachment.status === 'error') && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  attachment.status === 'error'
                    ? Color.rose(0.35)
                    : Color.black(0.28),
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                zIndex: 1
              }}
            >
              {attachment.status === 'uploading' && (
                <div
                  style={{
                    width: '100%',
                    height: '0.5rem',
                    background: Color.black(0.25)
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round(
                        Math.max(0, Math.min(1, attachment.progress)) * 100
                      )}%`,
                      background: Color.logoBlue(),
                      transition: 'width 120ms ease'
                    }}
                  />
                </div>
              )}
              {attachment.status === 'error' && (
                <div
                  style={{
                    width: '100%',
                    padding: '0.4rem',
                    color: '#fff',
                    fontSize: '1.1rem',
                    background: Color.rose(0.7),
                    textAlign: 'center'
                  }}
                >
                  {attachment.error === 'size' ? 'Too large' : 'Upload failed'}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
