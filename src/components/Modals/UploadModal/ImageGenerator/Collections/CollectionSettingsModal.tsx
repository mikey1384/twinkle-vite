import React, { useEffect, useId, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Textarea from '~/components/Texts/Textarea';
import Icon from '~/components/Icon';
import { cloudFrontURL } from '~/constants/defaultValues';
import { mobileMaxWidth } from '~/constants/css';
import {
  chatTopicActionStyle,
  chatTopicButtonStyle,
  chatTopicModalClass
} from '~/containers/Chat/Modals/topicStyles';
import {
  topicSettingsFormClass,
  topicSettingsHelpClass,
  topicSettingsLabelClass,
  topicSettingsSectionClass
} from '~/containers/Chat/Modals/TopicSettingsModal/styles';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import {
  AI_IMAGE_COLLECTION_IMAGES_MAX,
  AI_IMAGE_COLLECTION_NAME_MAX,
  AI_IMAGE_COLLECTION_NOTE_MAX,
  type AIImageCollection
} from '~/helpers/aiImageHistory';
import CollectionPicturePicker from './CollectionPicturePicker';

// The Zero/Ciel "Topic Settings" window (Chat Modals/TopicSettingsModal) for
// an image collection: its name, its pictures, and a note for the AI in place
// of the topic's custom instructions. Save sends the whole draft; what comes
// back from the server is what the list and the image maker show.
export default function CollectionSettingsModal({
  collection,
  themeColor = 'logoBlue',
  modalLevel = 4,
  openPickerFirst = false,
  onHide,
  onSaved,
  onDeleted
}: {
  collection: AIImageCollection;
  themeColor?: string;
  modalLevel?: number;
  openPickerFirst?: boolean;
  onHide: () => void;
  onSaved: (collection: AIImageCollection) => void;
  onDeleted: (id: number) => void;
}) {
  const nameId = useId();
  const noteId = useId();
  const updateAIImageCollection = useAppContext(
    (v) => v.requestHelpers.updateAIImageCollection
  );
  const deleteAIImageCollection = useAppContext(
    (v) => v.requestHelpers.deleteAIImageCollection
  );
  const themeRole = useRoleColor('button', {
    themeName: themeColor,
    fallback: themeColor
  });
  const [name, setName] = useState(collection.name);
  const [note, setNote] = useState(collection.note);
  const [images, setImages] = useState(collection.images);
  const [pickerShown, setPickerShown] = useState(openPickerFirst);
  const [confirmShown, setConfirmShown] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'delete' | null>(
    null
  );
  const [actionError, setActionError] = useState('');
  const operationRef = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (actionError) errorRef.current?.focus();
  }, [actionError]);

  const nameError = !name.trim()
    ? 'Enter a collection name.'
    : name.length > AI_IMAGE_COLLECTION_NAME_MAX
      ? `Keep the name within ${AI_IMAGE_COLLECTION_NAME_MAX} characters.`
      : '';
  const noteTooLong = note.length > AI_IMAGE_COLLECTION_NOTE_MAX;
  const unchanged =
    name === collection.name &&
    note === collection.note &&
    images.map((image) => image.id).join(',') ===
      collection.images.map((image) => image.id).join(',');
  const saveDisabled =
    !!pendingAction || !!nameError || noteTooLong || unchanged;
  const full = images.length >= AI_IMAGE_COLLECTION_IMAGES_MAX;

  return (
    <Modal
      modalKey="ImageCollectionSettingsModal"
      isOpen
      onClose={handleClose}
      size="md"
      modalLevel={modalLevel}
      title="Collection Settings"
      aria-label="Collection settings"
      className={chatTopicModalClass}
      style={{ width: 'min(600px, calc(100vw - 24px))', maxWidth: '100%' }}
      bodyPadding="12px"
      footer={
        <>
          {actionError && (
            <p
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className={topicSettingsHelpClass}
              data-error="true"
              style={{ width: '100%', margin: 0 }}
            >
              {actionError}
            </p>
          )}
          <Button
            variant="ghost"
            disabled={!!pendingAction}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            color={themeColor}
            style={chatTopicButtonStyle(themeColor)}
            loading={pendingAction === 'save'}
            disabled={saveDisabled}
            onClick={handleSave}
          >
            Save
          </Button>
        </>
      }
    >
      <div className={topicSettingsFormClass}>
        <div>
          <label htmlFor={nameId} className={topicSettingsLabelClass}>
            Collection name
          </label>
          <Input
            id={nameId}
            value={name}
            disabled={!!pendingAction}
            onChange={setName}
            placeholder="My comic's characters"
            aria-invalid={!!nameError}
            aria-describedby={`${nameId}-help`}
            hasError={!!nameError}
          />
          <p
            id={`${nameId}-help`}
            className={topicSettingsHelpClass}
            data-error={!!nameError}
          >
            {nameError ? `${nameError} ` : ''}
            {name.length} / {AI_IMAGE_COLLECTION_NAME_MAX} characters
          </p>
        </div>

        <div>
          <span className={topicSettingsLabelClass}>Pictures</span>
          <div className={picturesCls}>
            {images.map((image) => (
              <div key={image.id} className={pictureCls}>
                <img
                  src={`${cloudFrontURL}/${image.path}`}
                  alt="A picture in this collection"
                  loading="lazy"
                />
                <button
                  type="button"
                  className={removeCls}
                  disabled={!!pendingAction}
                  onClick={() =>
                    setImages((current) =>
                      current.filter((item) => item.id !== image.id)
                    )
                  }
                  aria-label="Take this picture out"
                  title="Take this picture out"
                >
                  <Icon icon="times" />
                </button>
              </div>
            ))}
            {!full && (
              <button
                type="button"
                className={addCls}
                disabled={!!pendingAction}
                onClick={() => setPickerShown(true)}
                style={{
                  borderColor: themeRole.getColor(0.58),
                  color: themeRole.getColor()
                }}
              >
                <Icon icon="plus" />
                <span>Add pictures</span>
              </button>
            )}
          </div>
          <p className={topicSettingsHelpClass}>
            {images.length
              ? 'The AI looks at these pictures every time you use this collection.'
              : 'Add pictures of your characters from My Images.'}
            {full &&
              ` ${AI_IMAGE_COLLECTION_IMAGES_MAX} pictures is the most a collection holds.`}
          </p>
        </div>

        <div className={topicSettingsSectionClass}>
          <label htmlFor={noteId} className={topicSettingsLabelClass}>
            Note for the AI
          </label>
          <Textarea
            id={noteId}
            placeholder="Mina: a girl with a red scarf and short black hair. Bolt: a small round blue robot. Bright cartoon style."
            style={{ width: '100%', position: 'relative', minHeight: '5rem' }}
            hasError={noteTooLong}
            aria-invalid={noteTooLong}
            aria-describedby={`${noteId}-help`}
            minRows={4}
            maxRows={10}
            value={note}
            disabled={!!pendingAction}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNote(event.target.value)
            }
          />
          <p
            id={`${noteId}-help`}
            className={topicSettingsHelpClass}
            data-error={noteTooLong}
          >
            Who your characters are and how they look. It&apos;s added to
            every picture you make with this collection. {note.length} /{' '}
            {AI_IMAGE_COLLECTION_NOTE_MAX}
          </p>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <Button
            onClick={() => setConfirmShown(true)}
            disabled={!!pendingAction}
            color="red"
            variant="ghost"
            uppercase={false}
            style={{ ...chatTopicActionStyle, color: '#b42318' }}
          >
            <Icon style={{ marginRight: 8 }} icon="trash-alt" />
            Delete Collection
          </Button>
        </div>
      </div>

      {pickerShown && (
        <CollectionPicturePicker
          initialImages={images}
          themeColor={themeColor}
          modalLevel={modalLevel + 1}
          onHide={() => setPickerShown(false)}
          onDone={(picked) => {
            setImages(picked);
            setPickerShown(false);
          }}
        />
      )}

      {confirmShown && (
        <Modal
          modalKey="DeleteImageCollection"
          isOpen
          modalLevel={modalLevel + 1}
          size="sm"
          title="Delete Collection"
          aria-label="Delete collection confirmation"
          className={chatTopicModalClass}
          style={{ width: 'min(400px, calc(100vw - 24px))', maxWidth: '100%' }}
          bodyPadding="12px"
          onClose={() => {
            if (!operationRef.current) setConfirmShown(false);
          }}
          footer={
            <>
              <Button
                variant="ghost"
                disabled={!!pendingAction}
                onClick={() => setConfirmShown(false)}
              >
                Cancel
              </Button>
              <Button
                color="red"
                disabled={!!pendingAction}
                loading={pendingAction === 'delete'}
                onClick={handleDelete}
              >
                Delete Collection
              </Button>
            </>
          }
        >
          <p
            style={{
              margin: 0,
              color: '#334155',
              fontSize: 'calc(16 * var(--px))',
              lineHeight: 1.6
            }}
          >
            Delete this collection? Your pictures stay in My Images.
          </p>
        </Modal>
      )}
    </Modal>
  );

  function handleClose() {
    if (!operationRef.current) onHide();
  }

  async function handleSave() {
    if (saveDisabled || operationRef.current) return;
    operationRef.current = true;
    setPendingAction('save');
    setActionError('');
    try {
      const { collection: saved } = await updateAIImageCollection({
        id: collection.id,
        name: name.trim(),
        note: note.trim(),
        imageIds: images.map((image) => image.id)
      });
      onSaved(saved);
      onHide();
    } catch (error: any) {
      console.error(error);
      setActionError(
        error?.message ||
          "Couldn't save this collection. Your changes are still here; please try again."
      );
    } finally {
      operationRef.current = false;
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    if (operationRef.current) return;
    operationRef.current = true;
    setPendingAction('delete');
    setActionError('');
    try {
      await deleteAIImageCollection(collection.id);
      setConfirmShown(false);
      onDeleted(collection.id);
    } catch (error: any) {
      console.error(error);
      setConfirmShown(false);
      setActionError(
        error?.status === 404
          ? 'This collection was already deleted.'
          : "Couldn't delete this collection. Please try again."
      );
      if (error?.status === 404) onDeleted(collection.id);
    } finally {
      operationRef.current = false;
      setPendingAction(null);
    }
  }
}

const picturesCls = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(96 * var(--px)), 1fr));
  gap: 10px;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const pictureCls = css`
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  background: #eef1f5;
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const removeCls = css`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.7);
  color: #fff;
  cursor: pointer;
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const addCls = css`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 2px dashed;
  border-radius: 12px;
  background: transparent;
  font: inherit;
  font-size: calc(14 * var(--px));
  font-weight: 800;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.03);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
