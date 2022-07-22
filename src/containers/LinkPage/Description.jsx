import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import DropdownButton from '~/components/Buttons/DropdownButton';
import LongText from '~/components/Texts/LongText';
import Button from '~/components/Button';
import Textarea from '~/components/Texts/Textarea';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import { timeSince } from '~/helpers/timeStampHelpers';
import {
  exceedsCharLimit,
  isValidUrl,
  stringIsEmpty,
  addEmoji,
  finalizeEmoji,
  replaceFakeAtSymbol
} from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import { useContentContext, useInputContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const addedByLabel = localize('addedBy');
const editLabel = localize('edit');
const deleteLabel = localize('delete');
const enterDescriptionLabel = localize('enterDescription');
const enterTitleLabel = localize('enterTitle');
const enterUrlLabel = localize('enterUrl');

Description.propTypes = {
  description: PropTypes.string,
  linkId: PropTypes.number.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEditDone: PropTypes.func.isRequired,
  timeStamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  title: PropTypes.string.isRequired,
  userCanEditThis: PropTypes.bool,
  uploader: PropTypes.object,
  userIsUploader: PropTypes.bool,
  url: PropTypes.string.isRequired
};

export default function Description({
  description,
  onDelete,
  onEditDone,
  linkId,
  timeStamp,
  title,
  uploader,
  url,
  userCanEditThis,
  userIsUploader
}) {
  const { canDelete, canEdit } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const inputState = useInputContext((v) => v.state);
  const onSetEditForm = useInputContext((v) => v.actions.onSetEditForm);
  const { isEditing } = useContentState({
    contentType: 'url',
    contentId: linkId
  });

  const editState = useMemo(
    () => inputState['edit' + 'url' + linkId],
    [inputState, linkId]
  );

  useEffect(() => {
    if (!editState) {
      onSetEditForm({
        contentId: linkId,
        contentType: 'url',
        form: {
          editedDescription: replaceFakeAtSymbol(description || ''),
          editedTitle: title || '',
          editedUrl: url
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, title, description, url, inputState, linkId, editState]);

  const editForm = useMemo(() => editState || {}, [editState]);
  const {
    editedTitle: prevEditedTitle = '',
    editedDescription: prevEditedDescription = '',
    editedUrl: prevEditedUrl = ''
  } = editForm;

  const [editedTitle, setEditedTitle] = useState(prevEditedTitle || title);
  const editedTitleRef = useRef(prevEditedTitle || title);
  useEffect(() => {
    handleTitleChange(prevEditedTitle || title);
  }, [prevEditedTitle, title]);

  const [editedDescription, setEditedDescription] = useState(
    prevEditedDescription || description
  );
  const editedDescriptionRef = useRef(prevEditedDescription || description);

  useEffect(() => {
    handleDescriptionChange(prevEditedDescription || description);
  }, [description, prevEditedDescription]);

  const [editedUrl, setEditedUrl] = useState(prevEditedUrl || url);
  const editedUrlRef = useRef(prevEditedUrl || url);

  useEffect(() => {
    handleUrlChange(prevEditedUrl || url);
  }, [url, prevEditedUrl]);

  const descriptionExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'url',
        inputType: 'description',
        text: editedDescription
      }),
    [editedDescription]
  );

  const titleExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'url',
        inputType: 'title',
        text: editedTitle
      }),
    [editedTitle]
  );

  const urlExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'url',
        inputType: 'url',
        text: editedUrl
      }),
    [editedUrl]
  );

  const editButtonShown = userIsUploader || userCanEditThis;

  const editMenuItems = useMemo(() => {
    const items = [];
    if (userIsUploader || canEdit) {
      items.push({
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1rem' }}>{editLabel}</span>
          </>
        ),
        onClick: () =>
          onSetIsEditing({
            contentId: linkId,
            contentType: 'url',
            isEditing: true
          })
      });
    }
    if (userIsUploader || canDelete) {
      items.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>{deleteLabel}</span>
          </>
        ),
        onClick: onDelete
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canDelete, canEdit, linkId, userIsUploader]);

  const urlIsEmpty = useMemo(() => stringIsEmpty(editedUrl), [editedUrl]);
  const urlIsValid = useMemo(() => isValidUrl(editedUrl), [editedUrl]);

  const doneButtonDisabled = useMemo(() => {
    const titleIsEmpty = stringIsEmpty(editedTitle);
    const titleChanged = editedTitle !== title;
    const urlChanged = editedUrl !== url;
    const descriptionChanged = editedDescription !== description;
    if (!urlIsValid) return true;
    if (urlIsEmpty) return true;
    if (titleIsEmpty) return true;
    if (!titleChanged && !descriptionChanged && !urlChanged) return true;
    if (titleExceedsCharLimit) return true;
    if (descriptionExceedsCharLimit) return true;
    if (urlExceedsCharLimit) return true;
    return false;
  }, [
    description,
    descriptionExceedsCharLimit,
    editedDescription,
    editedTitle,
    editedUrl,
    title,
    titleExceedsCharLimit,
    url,
    urlExceedsCharLimit,
    urlIsEmpty,
    urlIsValid
  ]);

  useEffect(() => {
    return function onUnmount() {
      onSetEditForm({
        contentId: linkId,
        contentType: 'url',
        form: {
          editedDescription: editedDescriptionRef.current,
          editedTitle: editedTitleRef.current,
          editedUrl: editedUrlRef.current
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: 'relative', padding: '2rem 1rem 0 1rem' }}>
      {editButtonShown && !isEditing && (
        <DropdownButton
          skeuomorphic
          icon="chevron-down"
          color="darkerGray"
          opacity={0.8}
          style={{ position: 'absolute', top: '1rem', right: '1rem' }}
          menuProps={editMenuItems}
        />
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column'
          }}
        >
          {isEditing ? (
            <>
              <Input
                className={css`
                  width: 80%;
                `}
                style={titleExceedsCharLimit?.style}
                placeholder={`${enterTitleLabel}...`}
                value={editedTitle}
                onChange={handleTitleChange}
                onKeyUp={(event) => {
                  if (event.key === ' ') {
                    handleTitleChange(addEmoji(event.target.value));
                  }
                }}
              />
              {titleExceedsCharLimit && (
                <small style={{ color: 'red' }}>
                  {titleExceedsCharLimit.message}
                </small>
              )}
            </>
          ) : (
            <h2>{title}</h2>
          )}
        </div>
        <div>
          <small>
            {addedByLabel} <UsernameText user={uploader} /> (
            {timeSince(timeStamp)})
          </small>
        </div>
      </div>
      <div
        style={{
          marginTop: '2rem',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'break-word'
        }}
      >
        {isEditing ? (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <Input
                placeholder={`${enterUrlLabel}...`}
                style={urlExceedsCharLimit?.style}
                value={editedUrl}
                hasError={!urlIsValid}
                onChange={handleUrlChange}
              />
              {!urlIsValid && (
                <small style={{ color: 'red' }}>
                  {urlIsEmpty ? 'Please enter url' : 'Please check the url'}
                </small>
              )}
            </div>
            <Textarea
              minRows={4}
              placeholder={`${enterDescriptionLabel}...`}
              value={editedDescription}
              onChange={(event) => handleDescriptionChange(event.target.value)}
              onKeyUp={(event) => {
                if (event.key === ' ') {
                  handleDescriptionChange(addEmoji(event.target.value));
                }
              }}
              style={{
                marginTop: '1rem',
                ...(descriptionExceedsCharLimit?.style || {})
              }}
            />
            {descriptionExceedsCharLimit && (
              <small style={{ color: 'red' }}>
                {descriptionExceedsCharLimit?.message}
              </small>
            )}
            <div style={{ justifyContent: 'center', display: 'flex' }}>
              <Button
                transparent
                style={{ marginRight: '1rem' }}
                onClick={onEditCancel}
              >
                Cancel
              </Button>
              <Button
                color={doneColor}
                disabled={doneButtonDisabled}
                onClick={onEditFinish}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <LongText lines={20}>{description || ''}</LongText>
        )}
      </div>
    </div>
  );

  function handleTitleChange(text) {
    setEditedTitle(text);
    editedTitleRef.current = text;
  }

  function handleDescriptionChange(text) {
    setEditedDescription(text);
    editedDescriptionRef.current = text;
  }

  function handleUrlChange(text) {
    setEditedUrl(text);
    editedUrlRef.current = text;
  }

  function onEditCancel() {
    onSetEditForm({
      contentId: linkId,
      contentType: 'url',
      form: undefined
    });
    onSetIsEditing({
      contentId: linkId,
      contentType: 'url',
      isEditing: false
    });
  }

  async function onEditFinish() {
    await onEditDone({
      editedUrl,
      editedTitle: finalizeEmoji(editedTitle),
      editedDescription: finalizeEmoji(editedDescription),
      contentId: linkId,
      contentType: 'url'
    });
    onSetEditForm({
      contentId: linkId,
      contentType: 'url',
      form: undefined
    });
    onSetIsEditing({
      contentId: linkId,
      contentType: 'url',
      isEditing: false
    });
  }
}
