import React, { useEffect, useRef, useState } from 'react';
import Textarea from '~/components/Texts/Textarea';
import Input from '~/components/Texts/Input';
import { edit } from '~/constants/placeholders';
import {
  stringIsEmpty,
  isValidUrl,
  isValidYoutubeUrl
} from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';

interface Props {
  editedComment?: string;
  editedDescription?: string;
  editedSecretAnswer?: string;
  editedUrl?: string;
  editedTitle?: string;
  contentType: string;
  onSecretAnswerChange: (event: any) => void;
  onTextAreaChange: (event: any) => void;
  onTextAreaKeyUp: (event: any) => void;
  onTitleChange: (text: string) => void;
  onTitleKeyUp: (event: any) => void;
  onUrlChange: (url: string) => void;
  urlExceedsCharLimit?: any;
  descriptionExceedsCharLimit?: any;
  secretAnswerExceedsCharLimit?: any;
  titleExceedsCharLimit?: any;
}
export default function TextEditSection({
  editedComment,
  editedDescription,
  editedSecretAnswer,
  editedUrl,
  editedTitle,
  contentType,
  onSecretAnswerChange,
  onTextAreaChange,
  onTextAreaKeyUp,
  onTitleChange,
  onTitleKeyUp,
  onUrlChange,
  urlExceedsCharLimit,
  descriptionExceedsCharLimit,
  secretAnswerExceedsCharLimit,
  titleExceedsCharLimit
}: Props) {
  const timerRef: React.MutableRefObject<any> = useRef(null);
  const [urlError, setUrlError] = useState(false);
  useEffect(() => {
    clearTimeout(timerRef.current);
    setUrlError(false);
    const urlHasError =
      !stringIsEmpty(editedUrl) &&
      !(contentType === 'video'
        ? isValidYoutubeUrl(editedUrl)
        : isValidUrl(editedUrl));
    if (urlHasError) {
      timerRef.current = setTimeout(() => setUrlError(true), 500);
    }
  }, [contentType, editedUrl]);

  return (
    <ErrorBoundary componentPath="ContentPanel/Body/ContentEditor/TextEditSection">
      {(contentType === 'video' || contentType === 'url') && (
        <div
          className={css`
            margin-bottom: 1rem;
          `}
        >
          <Input
            hasError={urlError}
            onChange={onUrlChange}
            placeholder={edit[contentType]}
            value={editedUrl}
            style={urlExceedsCharLimit?.style}
          />
          {(urlExceedsCharLimit || urlError) && (
            <small style={{ color: 'red', lineHeight: 0.5 }}>
              {(urlExceedsCharLimit?.message as React.ReactNode) ||
                'Please check the url'}
            </small>
          )}
        </div>
      )}
      {contentType !== 'comment' && (
        <>
          <Input
            onChange={onTitleChange}
            onKeyUp={onTitleKeyUp}
            placeholder={edit.title}
            value={editedTitle}
            style={titleExceedsCharLimit?.style}
          />
          <small style={titleExceedsCharLimit?.style}>
            {titleExceedsCharLimit?.message as React.ReactNode}
          </small>
        </>
      )}
      <div style={{ position: 'relative', marginTop: '1rem' }}>
        <Textarea
          minRows={4}
          onChange={onTextAreaChange}
          onKeyUp={onTextAreaKeyUp}
          placeholder={
            edit[contentType === 'comment' ? 'comment' : 'description']
          }
          value={contentType === 'comment' ? editedComment : editedDescription}
          style={descriptionExceedsCharLimit?.style}
        />
        {descriptionExceedsCharLimit && (
          <small style={{ color: 'red' }}>
            {descriptionExceedsCharLimit?.message}
          </small>
        )}
      </div>
      {contentType === 'subject' && (
        <div style={{ position: 'relative', marginTop: '1rem' }}>
          <span style={{ fontWeight: 'bold' }}>Secret Message</span>
          <Textarea
            minRows={4}
            onChange={onSecretAnswerChange}
            placeholder="Enter Secret Message... (Optional)"
            value={editedSecretAnswer}
            style={{
              marginTop: '0.7rem',
              ...((secretAnswerExceedsCharLimit?.style || {}) as object)
            }}
          />
          {secretAnswerExceedsCharLimit && (
            <small style={{ color: 'red' }}>
              {secretAnswerExceedsCharLimit.message}
            </small>
          )}
        </div>
      )}
    </ErrorBoundary>
  );
}
