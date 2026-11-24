import React, { useRef, useState } from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import Icon from '~/components/Icon';
import Textarea from '~/components/Texts/Textarea';
import useEmbedFileUpload from '~/helpers/hooks/useEmbedFileUpload';
import {
  FORUM_ATTACHMENT_MAX_COUNT,
  buildForumAttachmentMarkup,
  joinForumComposerValue,
  splitForumComposerValue
} from './helpers/forumAttachments';

const composerClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const attachmentListClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const attachmentChipClass = css`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 100%;
  min-height: 4.8rem;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  &.file {
    padding: 0.4rem 2.6rem 0.4rem 0.7rem;
    color: var(--chat-text);
    font-size: 1.1rem;
    font-weight: 800;
  }
  &.file span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 16rem;
  }
  img {
    display: block;
    width: 6.4rem;
    height: 4.8rem;
    object-fit: cover;
  }
`;

const removeButtonClass = css`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 1.9rem;
  height: 1.9rem;
  border: 0;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.72);
  color: #fff;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  &:hover {
    background: rgba(15, 23, 42, 0.9);
  }
`;

const attachRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 2.4rem;
`;

const uploadStatusClass = css`
  flex: 1 1 auto;
  min-width: 0;
`;

const attachErrorClass = css`
  color: #be123c;
  font-weight: 800;
  font-size: 1.1rem;
`;

// The forum's text box: type, then add pictures and files with the attach
// button, by pasting, or by dropping them on the box. Each file goes through
// the website's shared embed upload. The member sees their words in the box
// and the files as chips; the post body the parent sends is the words
// followed by one ![name](url) embed per file, which the posted message shows
// as an inline image or a download card.
export default function ForumComposerInput({
  className,
  disabled,
  maxRows,
  minRows,
  placeholder,
  value,
  onChange,
  onUploadingChange
}: {
  className?: string;
  disabled?: boolean;
  maxRows: number;
  minRows: number;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const {
    uploadForEmbed,
    uploading,
    normalizedProgress,
    uploadErrorType,
    errorModalContent
  } = useEmbedFileUpload();
  const [limitError, setLimitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const busyRef = useRef(false);
  const { text, attachments } = splitForumComposerValue(value);

  return (
    <div className={composerClass}>
      <Textarea
        className={className}
        value={text}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            joinForumComposerValue(
              event.target.value,
              splitForumComposerValue(valueRef.current).attachments.map(
                (item) => item.markup
              )
            )
          )
        }
        onFileDrop={(files) => attachFiles(files)}
        onPaste={handlePaste}
        placeholder={placeholder}
        minRows={minRows}
        maxRows={maxRows}
      />
      {attachments.length > 0 ? (
        <div className={attachmentListClass}>
          {attachments.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              className={`${attachmentChipClass}${item.isImage ? '' : ' file'}`}
              title={item.name}
            >
              {item.isImage ? (
                <img src={item.url} alt={item.name} />
              ) : (
                <>
                  <Icon icon="file" />
                  <span>{item.name}</span>
                </>
              )}
              <button
                type="button"
                className={removeButtonClass}
                aria-label={`Remove ${item.name}`}
                disabled={disabled}
                onClick={() => removeAttachment(index)}
              >
                <Icon icon="times" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          event.target.value = '';
          attachFiles(files);
        }}
      />
      <div className={attachRowClass}>
        <GameCTAButton
          variant="neutral"
          size="sm"
          icon="paperclip"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          Attach
        </GameCTAButton>
        {uploading ? (
          <div className={uploadStatusClass}>
            <FileUploadStatusIndicator
              hideUploading
              compactMode
              uploadProgress={normalizedProgress}
              style={{ marginTop: 0 }}
            />
          </div>
        ) : limitError ? (
          <span className={attachErrorClass} role="alert">
            {limitError}
          </span>
        ) : uploadErrorType ? (
          <span className={attachErrorClass} role="alert">
            {errorModalContent.content}
          </span>
        ) : null}
      </div>
    </div>
  );

  function removeAttachment(index: number) {
    const current = splitForumComposerValue(valueRef.current);
    setLimitError('');
    onChange(
      joinForumComposerValue(
        current.text,
        current.attachments
          .filter((_, itemIndex) => itemIndex !== index)
          .map((item) => item.markup)
      )
    );
  }

  function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData?.items || [])
      .filter((item) => item.kind === 'file')
      .map((item) => {
        const blob = item.getAsFile();
        if (!blob) return null;
        if (blob.name?.trim()) return blob;
        const extension = blob.type.split('/')[1] || 'png';
        return new File([blob], `pasted-image.${extension}`, {
          type: blob.type
        });
      })
      .filter((file): file is File => !!file);
    if (files.length === 0) return;
    event.preventDefault();
    attachFiles(files);
  }

  async function attachFiles(files: File[]) {
    if (disabled || busyRef.current || files.length === 0) return;
    setLimitError('');
    const room =
      FORUM_ATTACHMENT_MAX_COUNT -
      splitForumComposerValue(valueRef.current).attachments.length;
    if (room <= 0) {
      setLimitError(
        `A post can have up to ${FORUM_ATTACHMENT_MAX_COUNT} attachments.`
      );
      return;
    }
    const accepted = files.slice(0, room);
    busyRef.current = true;
    onUploadingChange?.(true);
    try {
      for (const file of accepted) {
        const url = await uploadForEmbed(file);
        if (!url) break;
        const current = splitForumComposerValue(valueRef.current);
        const nextValue = joinForumComposerValue(current.text, [
          ...current.attachments.map((item) => item.markup),
          buildForumAttachmentMarkup({ fileName: file.name, url })
        ]);
        valueRef.current = nextValue;
        onChange(nextValue);
      }
      if (files.length > accepted.length) {
        setLimitError(
          `A post can have up to ${FORUM_ATTACHMENT_MAX_COUNT} attachments.`
        );
      }
    } finally {
      busyRef.current = false;
      onUploadingChange?.(false);
    }
  }
}
