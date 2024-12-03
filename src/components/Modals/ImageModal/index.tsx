import React, { useMemo, useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import Caption from './Caption';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';
import {
  exceedsCharLimit,
  stringIsEmpty,
  finalizeEmoji
} from '~/helpers/stringHelpers';

export default function ImageModal({
  caption = '',
  hasCaption,
  modalOverModal,
  onEditCaption,
  onHide,
  fileName,
  src,
  downloadable = true,
  userIsUploader = false
}: {
  caption?: string;
  hasCaption?: boolean;
  modalOverModal?: boolean;
  onEditCaption?: (caption: string) => void;
  onHide: () => void;
  fileName?: string;
  src: string;
  downloadable?: boolean;
  userIsUploader?: boolean;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [submitting, setSubmitting] = useState(false);
  const [editedCaption, setEditedCaption] = useState(caption || '');
  const [isEditing, setIsEditing] = useState(false);
  const captionExceedChatLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text: editedCaption
      }),
    [editedCaption]
  );

  return (
    <Modal
      closeWhenClickedOutside={!isEditing}
      modalOverModal={modalOverModal}
      large
      onHide={onHide}
    >
      {fileName && <header>{fileName}</header>}
      <main>
        <img
          loading="lazy"
          fetchPriority="low"
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
      </main>
      <footer>
        {downloadable && (
          <Button color="orange" onClick={() => window.open(src)}>
            Download
          </Button>
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
        {((!hasCaption && stringIsEmpty(editedCaption)) ||
          (stringIsEmpty(caption) && stringIsEmpty(editedCaption)) ||
          editedCaption === caption) && (
          <Button
            style={{ marginLeft: '1rem' }}
            color={doneColor}
            onClick={onHide}
          >
            Close
          </Button>
        )}
      </footer>
    </Modal>
  );
}
