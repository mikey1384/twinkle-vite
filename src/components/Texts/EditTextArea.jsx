import { useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Textarea from '~/components/Texts/Textarea';
import { useInputContext, useKeyContext } from '~/contexts';
import {
  exceedsCharLimit,
  stringIsEmpty,
  addEmoji,
  finalizeEmoji,
  replaceFakeAtSymbol
} from '~/helpers/stringHelpers';

EditTextArea.propTypes = {
  allowEmptyText: PropTypes.bool,
  autoFocus: PropTypes.bool,
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  disabled: PropTypes.bool,
  marginTop: PropTypes.string,
  maxRows: PropTypes.number,
  onCancel: PropTypes.func.isRequired,
  onEditDone: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  style: PropTypes.object,
  text: PropTypes.string.isRequired
};

export default function EditTextArea({
  allowEmptyText,
  autoFocus = false,
  contentId,
  contentType,
  disabled,
  marginTop = '1rem',
  maxRows,
  onCancel,
  onEditDone,
  placeholder = 'Enter text',
  rows = 4,
  style,
  text
}) {
  const [isEditing, setIsEditing] = useState(false);
  const { banned } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const submitting = useRef(false);
  const state = useInputContext((v) => v.state);
  const onSetEditForm = useInputContext((v) => v.actions.onSetEditForm);
  const prevEditState = useMemo(() => {
    return state['edit' + contentType + contentId];
  }, [contentId, contentType, state]);

  const editTextRef = useRef(prevEditState?.editedComment || '');
  const [editText, setEditText] = useState(prevEditState?.editedComment || '');

  useEffect(() => {
    handleSetEditText(
      prevEditState?.editedComment || editTextRef.current || ''
    );
  }, [prevEditState]);

  useEffect(() => {
    if (!editText) {
      handleSetEditText(replaceFakeAtSymbol(text));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const commentExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text: editText
      }),
    [editText]
  );

  useEffect(() => {
    return function saveTextBeforeUnmount() {
      if (editTextRef.current !== text && !submitting.current) {
        onSetEditForm({
          contentId,
          contentType,
          form: editTextRef.current
            ? {
                editedComment: editTextRef.current
              }
            : undefined
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ lineHeight: 1, ...style }}>
      <Textarea
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          marginTop,
          position: 'relative',
          ...(commentExceedsCharLimit?.style || {})
        }}
        maxRows={maxRows}
        minRows={rows}
        value={editText}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
      />
      {commentExceedsCharLimit && (
        <small style={{ color: 'red', fontSize: '1.3rem', lineHeight: 1 }}>
          {commentExceedsCharLimit?.message}
        </small>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row-reverse',
          marginTop: '1rem'
        }}
      >
        <Button
          color={doneColor}
          onClick={onSubmit}
          loading={isEditing}
          disabled={
            (!allowEmptyText && stringIsEmpty(editText)) ||
            !!commentExceedsCharLimit ||
            text === editText ||
            disabled
          }
        >
          Done
        </Button>
        <Button
          transparent
          style={{
            marginRight: '1rem'
          }}
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  function handleChange(event) {
    handleSetEditText(event.target.value);
  }

  function handleCancel() {
    handleSetEditText('');
    onCancel();
  }

  function handleKeyUp(event) {
    if (event.key === ' ') {
      handleSetEditText(addEmoji(event.target.value));
    }
  }

  function handleSetEditText(text) {
    setEditText(text);
    editTextRef.current = text;
  }

  function onSubmit() {
    if (banned?.posting) {
      return;
    }
    onSetEditForm({
      contentId,
      contentType,
      form: undefined
    });
    submitting.current = true;
    setIsEditing(true);
    try {
      onEditDone(finalizeEmoji(editText));
    } catch (error) {
      console.error(error);
      setIsEditing(false);
    }
  }
}
