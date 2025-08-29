import React, { useMemo, useRef, useState } from 'react';
import Button from '~/components/Button';
import NewModal from '~/components/NewModal';
import Caption from './Caption';
import Icon from '~/components/Icon';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
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
  downloadable?: boolean;
  userIsUploader?: boolean;
  contentType?: string;
  contentId?: number;
  isReplaceable?: boolean;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
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
  const captionExceedChatLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text: editedCaption
      }),
    [editedCaption]
  );

  return (
    <NewModal
      isOpen
      onClose={onHide}
      hasHeader={!!fileName}
      title={fileName}
      size="lg"
      footer={
        <>
          {downloadable && (
            <Button color="orange" onClick={() => window.open(src)}>
              Download
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
          {hasCaption &&
            !stringIsEmpty(caption) &&
            userIsUploader &&
            !isEditing && (
              <Button transparent onClick={() => setIsEditing(true)}>
                <Icon icon="pencil-alt" />
                <span style={{ marginLeft: '0.7rem' }}>Edit Caption</span>
              </Button>
            )}
          {hasCaption && isEditing && (
            <Button
              transparent
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
            color={doneColor}
            onClick={onHide}
          >
            Close
          </Button>
        </>
      }
    >
      <img
        loading="lazy"
        style={{
          maxWidth: '100%',
          maxHeight: '80vh',
          objectFit: 'contain'
        }}
        src={src}
      />
      {hasCaption && (
        <Caption
          editedCaption={editedCaption}
          onSetEditedCaption={setEditedCaption}
          isEditing={isEditing}
          caption={caption}
          userIsUploader={userIsUploader}
        />
      )}
    </NewModal>
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
