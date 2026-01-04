import React, { useMemo, useRef, useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import Caption from './Caption';
import ImageEditModal from './ImageEditModal';
import Icon from '~/components/Icon';
import { useAppContext, useContentContext } from '~/contexts';
import {
  exceedsCharLimit,
  stringIsEmpty,
  finalizeEmoji,
  generateFileName
} from '~/helpers/stringHelpers';
import { v1 as uuidv1 } from 'uuid';

export default function ImageModal({
  caption = '',
  hasCaption,
  onEditCaption,
  onHide,
  fileName,
  src,
  downloadSrc,
  downloadable = true,
  userIsUploader = false,
  contentType,
  contentId,
  isReplaceable
}: {
  caption?: string;
  hasCaption?: boolean;
  onEditCaption?: (caption: string) => void;
  onHide: () => void;
  fileName?: string;
  src: string;
  downloadSrc?: string;
  downloadable?: boolean;
  userIsUploader?: boolean;
  contentType?: string;
  contentId?: number;
  isReplaceable?: boolean;
}) {
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const saveFileData = useAppContext((v) => v.requestHelpers.saveFileData);
  const replaceSubjectAttachment = useAppContext(
    (v) => v.requestHelpers.replaceSubjectAttachment
  );
  const replaceCommentAttachment = useAppContext(
    (v) => v.requestHelpers.replaceCommentAttachment
  );
  const onEditContent = useContentContext((v) => v.actions.onEditContent);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editedCaption, setEditedCaption] = useState(caption || '');
  const [isEditing, setIsEditing] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const captionExceedChatLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text: editedCaption
      }),
    [editedCaption]
  );

  const modalHeight = useMemo(
    () => (hasCaption ? 'min(92vh, calc(80vh + 6rem))' : '80vh'),
    [hasCaption]
  );

  return (
    <Modal
      isOpen
      onClose={onHide}
      hasHeader={!!fileName}
      title={fileName}
      size="lg"
      style={{
        height: modalHeight,
        maxHeight: '95vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
      footer={
        <>
          {downloadable && (
            <Button
              color="orange"
              onClick={() => window.open(downloadSrc || src)}
            >
              <Icon icon="download" />
              <span style={{ marginLeft: '0.5rem' }}>Download</span>
            </Button>
          )}
          {isReplaceable &&
            ['subject', 'comment'].includes(String(contentType)) &&
            contentId &&
            userIsUploader && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleReplace}
                />
                <Button
                  color="purple"
                  loading={replacing}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon icon="exchange-alt" />
                  <span style={{ marginLeft: '0.7rem' }}>Change Image</span>
                </Button>
              </>
            )}
          <Button color="blue" onClick={() => setIsEditModalOpen(true)}>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '0.5rem' }}>Edit Image</span>
          </Button>
          {hasCaption &&
            !stringIsEmpty(caption) &&
            userIsUploader &&
            !isEditing && (
              <Button variant="ghost" onClick={() => setIsEditing(true)}>
                <Icon icon="pencil-alt" />
                <span style={{ marginLeft: '0.7rem' }}>Edit Caption</span>
              </Button>
            )}
          {hasCaption && isEditing && (
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditing(false);
                setEditedCaption(caption || '');
              }}
            >
              Cancel
            </Button>
          )}
          {hasCaption &&
            editedCaption !== caption &&
            !(stringIsEmpty(caption) && stringIsEmpty(editedCaption)) && (
              <Button
                disabled={!!captionExceedChatLimit}
                style={{ marginLeft: '1rem' }}
                color="green"
                loading={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  await onEditCaption?.(finalizeEmoji(editedCaption));
                  setSubmitting(false);
                  setIsEditing(false);
                }}
              >
                {stringIsEmpty(caption) ? 'Submit Caption' : 'Apply Changes'}
              </Button>
            )}
          <Button
            style={{ marginLeft: '1rem' }}
            variant="ghost"
            onClick={onHide}
          >
            Close
          </Button>
        </>
      }
    >
      <div
        style={{
          margin: 'auto',
          alignSelf: 'center',
          width: '100%',
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 'clamp(2rem, 4vh, 4rem)'
        }}
      >
        <div
          style={{
            width: '100%',
            flex: '0 1 auto',
            maxHeight: hasCaption ? '60vh' : '70vh',
            minHeight: 0,
            display: 'flex',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(1rem, 3vh, 3rem) 0',
            boxSizing: 'border-box'
          }}
        >
          <img
            loading="lazy"
            style={{
              maxWidth: '100%',
              marginTop: '1rem',
              height: '100%',
              maxHeight: '60vh',
              width: 'auto',
              objectFit: 'contain'
            }}
            src={src}
          />
        </div>
        {hasCaption && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginTop: '1rem'
            }}
          >
            <Caption
              editedCaption={editedCaption}
              onSetEditedCaption={setEditedCaption}
              isEditing={isEditing}
              caption={caption}
              userIsUploader={userIsUploader}
              style={{
                marginTop: 0,
                textAlign: 'center',
                maxWidth: '100%'
              }}
            />
          </div>
        )}
      </div>
      {isEditModalOpen && (
        <ImageEditModal
          imageUrl={src}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </Modal>
  );

  async function handleReplace(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const selected = event.target.files?.[0];
      event.target.value = '';
      if (!selected || !contentId) return;
      setReplacing(true);
      const appliedFileName = generateFileName(selected.name);
      const filePath = uuidv1();
      await uploadFile({
        fileName: appliedFileName,
        filePath,
        file: selected,
        onUploadProgress: () => {}
      });
      await saveFileData({
        fileName: appliedFileName,
        filePath,
        actualFileName: selected.name,
        rootType:
          contentType === 'subject'
            ? 'subject'
            : contentType === 'comment'
            ? 'comment'
            : 'chat'
      });
      if (contentType === 'subject') {
        await replaceSubjectAttachment({
          subjectId: contentId,
          filePath,
          fileName: appliedFileName,
          fileSize: selected.size
        });
        onEditContent({
          data: {
            filePath,
            fileName: appliedFileName,
            fileSize: selected.size
          },
          contentType: 'subject',
          contentId
        });
      } else if (contentType === 'comment') {
        await replaceCommentAttachment({
          commentId: contentId,
          filePath,
          fileName: appliedFileName,
          fileSize: selected.size
        });
        onEditContent({
          data: {
            filePath,
            fileName: appliedFileName,
            fileSize: selected.size
          },
          contentType: 'comment',
          contentId
        });
      }
      setReplacing(false);
      onHide();
    } catch (error) {
      console.error(error);
      setReplacing(false);
    }
  }
}
