import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import Caption from './Caption';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';
import { stringIsEmpty, finalizeEmoji } from '~/helpers/stringHelpers';

ImageModal.propTypes = {
  caption: PropTypes.string,
  downloadable: PropTypes.bool,
  hasCaption: PropTypes.bool,
  modalOverModal: PropTypes.bool,
  onEditCaption: PropTypes.func,
  onHide: PropTypes.func.isRequired,
  fileName: PropTypes.string,
  src: PropTypes.string,
  userIsUploader: PropTypes.bool
};

export default function ImageModal({
  caption,
  hasCaption,
  modalOverModal,
  onEditCaption,
  onHide,
  fileName,
  src,
  downloadable = true,
  userIsUploader
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [editedCaption, setEditedCaption] = useState(caption || '');
  const [isEditing, setIsEditing] = useState(false);
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
          style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          src={src}
          rel={fileName}
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
        {hasCaption && !stringIsEmpty(caption) && userIsUploader && !isEditing && (
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
              setEditedCaption(caption);
            }}
          >
            Cancel
          </Button>
        )}
        {hasCaption &&
          editedCaption !== caption &&
          !(stringIsEmpty(caption) && stringIsEmpty(editedCaption)) && (
            <Button
              style={{ marginLeft: '1rem' }}
              color="green"
              onClick={async () => {
                await onEditCaption(finalizeEmoji(editedCaption));
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
