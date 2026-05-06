import React, { useEffect, useMemo, useState, useRef } from 'react';
import Button from '~/components/Button';
import Textarea from '~/components/Texts/Textarea';
import { useKeyContext } from '~/contexts';
import { editFormTextStates } from '~/constants/state';
import { css } from '@emotion/css';
import {
  exceedsCharLimit,
  stringIsEmpty,
  addEmoji,
  finalizeEmoji,
  replaceFakeAtSymbol
} from '~/helpers/stringHelpers';

export default function EditTextArea({
  allowEmptyText,
  autoFocus = false,
  compactMode = false,
  contentId,
  contentType,
  disabled,
  inputType = 'message',
  marginTop = '1rem',
  maxRows,
  onCancel,
  onEditDone,
  placeholder = 'Enter text',
  rows = 4,
  style,
  isPinned,
  text
}: {
  allowEmptyText?: boolean;
  autoFocus?: boolean;
  compactMode?: boolean;
  contentId: number;
  contentType: string;
  disabled?: boolean;
  inputType?: string;
  marginTop?: string;
  maxRows?: number;
  onCancel: () => any;
  onEditDone: (text: string) => any;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
  isPinned?: boolean;
  text: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const banned = useKeyContext((v) => v.myState.banned);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const submitting = useRef(false);

  const prevEditState =
    editFormTextStates[contentId + contentType + (isPinned ? 'pinned' : '')];

  const editTextRef = useRef(prevEditState || '');
  const [editText, setEditText] = useState(prevEditState || '');
  const resolvedRows = compactMode && rows === 4 ? 2 : rows;
  const textAreaClassName = compactMode
    ? css`
        font-size: 1.1rem !important;
        line-height: 1.35 !important;
        padding: 0.58rem 0.7rem !important;
      `
    : '';

  useEffect(() => {
    handleSetEditText(prevEditState || editTextRef.current || '');
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
        contentType,
        text: editText,
        inputType
      }),
    [editText, contentType, inputType]
  );

  useEffect(() => {
    return function saveTextBeforeUnmount() {
      if (editTextRef.current !== text && !submitting.current) {
        editFormTextStates[
          contentId + contentType + (isPinned ? 'pinned' : '')
        ] = editTextRef.current;
      }
    };
  }, [contentId, contentType, isPinned, text]);

  return (
    <div style={{ lineHeight: 1, ...style }}>
      <Textarea
        className={textAreaClassName}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          marginTop: compactMode ? '0.35rem' : marginTop,
          minHeight: compactMode ? '3.1rem' : undefined,
          position: 'relative'
        }}
        hasError={!!commentExceedsCharLimit}
        maxRows={maxRows}
        minRows={resolvedRows}
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
          gap: compactMode ? '0.45rem' : undefined,
          marginTop: compactMode ? '0.45rem' : '1rem'
        }}
      >
        <Button
          color={doneColor}
          onClick={onSubmit}
          loading={isEditing}
          size={compactMode ? 'sm' : 'md'}
          uppercase={!compactMode}
          style={
            compactMode
              ? {
                  borderRadius: 8,
                  fontSize: '1.1rem',
                  minHeight: '2.4rem',
                  padding: '0.5rem 0.8rem'
                }
              : undefined
          }
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
          variant="ghost"
          size={compactMode ? 'sm' : 'md'}
          uppercase={!compactMode}
          style={{
            ...(compactMode
              ? {
                  borderRadius: 8,
                  fontSize: '1.1rem',
                  minHeight: '2.4rem',
                  padding: '0.5rem 0.7rem'
                }
              : { marginRight: '1rem' })
          }}
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  function handleChange(event: any) {
    handleSetEditText(event.target.value);
  }

  function handleCancel() {
    handleSetEditText('');
    onCancel();
  }

  function handleKeyUp(event: any) {
    if (event.key === ' ') {
      handleSetEditText(addEmoji(event.target.value));
    }
  }

  function handleSetEditText(text: string) {
    setEditText(text);
    editTextRef.current = text;
  }

  async function onSubmit() {
    if (banned?.posting) {
      return;
    }
    submitting.current = true;
    if (editFormTextStates[contentId + contentType + 'pinned']) {
      editFormTextStates[contentId + contentType + 'pinned'] = '';
    }
    editFormTextStates[contentId + contentType] = '';
    setIsEditing(true);
    try {
      await onEditDone(finalizeEmoji(editText));
    } catch (error) {
      console.error(error);
    } finally {
      setIsEditing(false);
    }
  }
}
