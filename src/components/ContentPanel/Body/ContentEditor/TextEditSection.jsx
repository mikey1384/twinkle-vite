import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
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

TextEditSection.propTypes = {
  editedComment: PropTypes.string,
  editedDescription: PropTypes.string,
  editedSecretAnswer: PropTypes.string,
  editedUrl: PropTypes.string,
  editedTitle: PropTypes.string,
  contentType: PropTypes.string,
  onSecretAnswerChange: PropTypes.func.isRequired,
  onTextAreaChange: PropTypes.func.isRequired,
  onTextAreaKeyUp: PropTypes.func.isRequired,
  onTitleChange: PropTypes.func.isRequired,
  onTitleKeyUp: PropTypes.func.isRequired,
  onUrlChange: PropTypes.func.isRequired,
  urlExceedsCharLimit: PropTypes.object,
  descriptionExceedsCharLimit: PropTypes.object,
  secretAnswerExceedsCharLimit: PropTypes.object,
  titleExceedsCharLimit: PropTypes.object
};

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
}) {
  const timerRef = useRef(null);
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
              {urlExceedsCharLimit?.message || 'Please check the url'}
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
            {titleExceedsCharLimit?.message}
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
              ...(secretAnswerExceedsCharLimit?.style || {})
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
