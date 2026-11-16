import React, { useEffect, useId, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Textarea from '~/components/Texts/Textarea';
import Icon from '~/components/Icon';
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
  AI_IMAGE_COLLECTION_LABEL_MAX,
  AI_IMAGE_COLLECTION_NAME_MAX,
  AI_IMAGE_COLLECTION_NOTE_MAX,
  AI_IMAGE_COLLECTION_PICTURE_NOTE_MAX,
  type AIImageCollection,
  type AIImageCollectionImage,
  type AIImageCollectionRole
} from '~/helpers/aiImageHistory';
import CollectionPicturePicker from './CollectionPicturePicker';
import CollectionPictureList from './CollectionPictureList';

// The Zero/Ciel "Topic Settings" window (Chat Modals/TopicSettingsModal) for
// an image collection: its name, its pictures (each with its job, name and
// what to keep the same; v2, Mikey 11-16), and "what to keep the same" for
// the whole collection in place of the topic's custom instructions. Save
// sends the whole draft; what comes back from the server is what the list
// and the image maker show.
export default function CollectionSettingsModal({
  collection,
  themeColor = 'logoBlue',
  modalLevel = 4,
  openPickerFirst = false,
  newPictureRole,
  onHide,
  onSaved,
  onDeleted
}: {
  collection: AIImageCollection;
  themeColor?: string;
  modalLevel?: number;
  openPickerFirst?: boolean;
  // the job newly added pictures start with (the example chip the
  // collection was started from); otherwise the last picture's job
  newPictureRole?: AIImageCollectionRole;
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
  const [images, setImages] = useState<AIImageCollectionImage[]>(
    collection.images
  );
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
  const pictureTextTooLong = images.some(
    (image) =>
      image.label.length > AI_IMAGE_COLLECTION_LABEL_MAX ||
      image.note.length > AI_IMAGE_COLLECTION_PICTURE_NOTE_MAX
  );
  const unchanged =
    name === collection.name &&
    note === collection.note &&
    picturesKey(images) === picturesKey(collection.images);
  const saveDisabled =
    !!pendingAction ||
    !!nameError ||
    noteTooLong ||
    pictureTextTooLong ||
    unchanged;
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
          {images.length > 0 && (
            <p className={topicSettingsHelpClass} style={{ marginTop: 0 }}>
              Tell the AI what each picture is.
            </p>
          )}
          <CollectionPictureList
            images={images}
            disabled={!!pendingAction}
            themeColor={themeColor}
            onChange={setImages}
          />
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
          <p className={topicSettingsHelpClass}>
            {images.length
              ? 'The AI looks at these pictures every time you use this collection.'
              : 'Add pictures from My Images: characters, an art style, a place, a logo, anything you want to keep the same.'}
            {full &&
              ` ${AI_IMAGE_COLLECTION_IMAGES_MAX} pictures is the most a collection holds.`}
          </p>
        </div>

        <div className={topicSettingsSectionClass}>
          <label htmlFor={noteId} className={topicSettingsLabelClass}>
            What to keep the same
          </label>
          <Textarea
            id={noteId}
            placeholder="Like: Mina is 12 and always wears her red scarf. Bright cartoon colors with thick outlines."
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
            Anything the pictures don&apos;t show. It&apos;s added to every
            picture you make with this collection. {note.length} /{' '}
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
            setImages((current) => {
              const startRole =
                newPictureRole ||
                current[current.length - 1]?.role ||
                'character';
              // pictures already here keep their job, name and note
              return picked.map(
                (picture) =>
                  current.find((image) => image.id === picture.id) || {
                    ...picture,
                    role: startRole,
                    label: '',
                    note: ''
                  }
              );
            });
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
        images: images.map(({ id, role, label, note }) => ({
          id,
          role,
          label: label.trim(),
          note: note.trim()
        }))
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

function picturesKey(images: AIImageCollectionImage[]) {
  return JSON.stringify(
    images.map(({ id, role, label, note }) => [id, role, label, note])
  );
}

const addCls = css`
  width: 100%;
  min-height: 52px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed;
  border-radius: 12px;
  background: transparent;
  font: inherit;
  font-size: 1.4rem;
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
