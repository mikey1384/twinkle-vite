import { useEffect, useRef, useState } from 'react';
import {
  stringIsEmpty,
  addEmoji,
  finalizeEmoji
} from '~/helpers/stringHelpers';
import PropTypes from 'prop-types';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import ErrorBoundary from '~/components/ErrorBoundary';
import RewardLevelForm from '~/components/Forms/RewardLevelForm';
import SecretMessageInput from '~/components/Forms/SecretMessageInput';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import {
  useAppContext,
  useContentContext,
  useInputContext,
  useKeyContext
} from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { returnImageFileFromUrl } from '~/helpers';
import { v1 as uuidv1 } from 'uuid';
import localize from '~/constants/localize';

const cancelLabel = localize('cancel');
const submitLabel = localize('submit3');

SubjectInputForm.propTypes = {
  autoFocus: PropTypes.bool,
  canEditRewardLevel: PropTypes.bool,
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  descriptionMaxChar: PropTypes.number,
  descriptionPlaceholder: PropTypes.string,
  isSubject: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  rows: PropTypes.number,
  titleMaxChar: PropTypes.number,
  titlePlaceholder: PropTypes.string
};

export default function SubjectInputForm({
  autoFocus,
  canEditRewardLevel,
  contentId,
  contentType,
  isSubject,
  onClose,
  rows,
  titlePlaceholder,
  titleMaxChar = 300,
  descriptionMaxChar = 5000,
  descriptionPlaceholder,
  onSubmit
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const { fileUploadProgress, uploadingFile } = useContentState({
    contentType,
    contentId
  });
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const state = useInputContext((v) => v.state);
  const onUpdateSecretFileUploadProgress = useContentContext(
    (v) => v.actions.onUpdateSecretFileUploadProgress
  );
  const onSetUploadingFile = useContentContext(
    (v) => v.actions.onSetUploadingFile
  );
  const onSetSubjectInputForm = useInputContext(
    (v) => v.actions.onSetSubjectInputForm
  );
  const subjectInputForm = state['subject' + contentType + contentId] || {};
  const {
    title: prevTitle = '',
    description: prevDescription = '',
    secretAnswer: prevSecretAnswer = '',
    secretAttachment: prevSecretAttachment = null,
    rewardLevel = 0
  } = subjectInputForm;
  const [title, setTitle] = useState(prevTitle);
  const titleRef = useRef(prevTitle);
  const [description, setDescription] = useState(prevDescription);
  const descriptionRef = useRef(prevDescription);
  const [secretAnswer, setSecretAnswer] = useState(prevSecretAnswer);
  const secretAnswerRef = useRef(prevSecretAnswer);
  const [secretAttachment, setSecretAttachment] =
    useState(prevSecretAttachment);
  const secretAttachmentRef = useRef(prevSecretAttachment);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return function cleanUp() {
      onSetSubjectInputForm({
        contentId,
        contentType,
        form: {
          title: titleRef.current,
          description: descriptionRef.current,
          secretAnswer: secretAnswerRef.current,
          secretAttachment: secretAttachmentRef.current
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="SubjectInputForm">
      <div>
        {uploadingFile && secretAttachment ? (
          <FileUploadStatusIndicator
            style={{ fontSize: '1.7rem', fontWeight: 'bold', marginTop: 0 }}
            fileName={secretAttachment?.file?.name}
            uploadProgress={fileUploadProgress}
          />
        ) : (
          <>
            <Input
              autoFocus={autoFocus}
              placeholder={titlePlaceholder}
              value={title}
              style={{
                borderColor: title.length > titleMaxChar && 'red',
                color: title.length > titleMaxChar && 'red'
              }}
              onChange={handleSetTitle}
              onKeyUp={(event) => handleSetTitle(addEmoji(event.target.value))}
            />
            {title.length > titleMaxChar && (
              <small style={{ color: 'red', fontSize: '1.6rem' }}>
                {`Exceeded title's`} character limit of {titleMaxChar}{' '}
                characters. You can write more in the description field below.
              </small>
            )}
            <div style={{ position: 'relative' }}>
              <Textarea
                style={{
                  marginTop: '1rem',
                  color: description.length > descriptionMaxChar && 'red',
                  borderColor: description.length > descriptionMaxChar && 'red'
                }}
                minRows={rows}
                placeholder={descriptionPlaceholder}
                value={description}
                onChange={(event) => handleSetDescription(event.target.value)}
                onKeyUp={(event) =>
                  handleSetDescription(addEmoji(event.target.value))
                }
              />
              {description.length > descriptionMaxChar && (
                <small style={{ color: 'red', fontSize: '1.3rem' }}>
                  {descriptionMaxChar} character limit exceeded
                </small>
              )}
              {isSubject && (
                <SecretMessageInput
                  autoFocus={false}
                  secretAnswer={secretAnswer}
                  secretAttachment={secretAttachment}
                  onSetSecretAnswer={handleSetSecretAnswer}
                  onSetSecretAttachment={handleSetSecretAttachment}
                  onThumbnailLoad={(thumbnail) =>
                    handleSetSecretAttachment({ thumbnail })
                  }
                />
              )}
              {canEditRewardLevel && (
                <RewardLevelForm
                  themed
                  style={{
                    marginTop: '1rem',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column',
                    padding: '1rem',
                    fontSize: '3rem'
                  }}
                  rewardLevel={rewardLevel}
                  onSetRewardLevel={(rewardLevel) =>
                    onSetSubjectInputForm({
                      contentId,
                      contentType,
                      form: { rewardLevel }
                    })
                  }
                />
              )}
            </div>
          </>
        )}
        {(!uploadingFile || !secretAttachment) && (
          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Button
              transparent
              style={{ fontSize: '1.7rem', marginRight: '1rem' }}
              onClick={handleCancel}
            >
              {cancelLabel}
            </Button>
            <Button
              color={doneColor}
              style={{ fontSize: '1.7rem' }}
              onClick={handleSubmit}
              disabled={
                submitting ||
                !title ||
                stringIsEmpty(title) ||
                title.length > titleMaxChar ||
                description.length > descriptionMaxChar ||
                secretAnswer.length > descriptionMaxChar
              }
            >
              {submitLabel}
            </Button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  function handleCancel() {
    onSetSubjectInputForm({
      contentId,
      contentType,
      form: null
    });
    onClose();
  }

  function handleSetTitle(text) {
    setTitle(text);
    titleRef.current = text;
  }

  function handleSetDescription(text) {
    setDescription(text);
    descriptionRef.current = text;
  }

  function handleSetSecretAnswer(text) {
    setSecretAnswer(text);
    secretAnswerRef.current = text;
  }

  function handleSetSecretAttachment(attachment) {
    setSecretAttachment((prev) =>
      attachment
        ? {
            ...prev,
            ...attachment
          }
        : null
    );
    secretAttachmentRef.current = attachment;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    const filePath = uuidv1();
    let secretThumbUrl = '';
    try {
      if (secretAttachment) {
        const promises = [];
        promises.push(
          uploadFile({
            filePath,
            file: secretAttachment?.file,
            onUploadProgress: ({ loaded, total }) =>
              onUpdateSecretFileUploadProgress({
                contentId,
                contentType,
                progress: loaded / total
              })
          })
        );
        if (secretAttachment.thumbnail) {
          promises.push(
            (async () => {
              const file = returnImageFileFromUrl({
                imageUrl: secretAttachment.thumbnail
              });
              const thumbUrl = await uploadThumb({
                file,
                path: uuidv1()
              });
              return Promise.resolve(thumbUrl);
            })()
          );
        }
        onSetUploadingFile({
          contentId,
          contentType,
          isUploading: true
        });
        const result = await Promise.all(promises);
        if (secretAttachment.thumbnail) {
          secretThumbUrl = result[result.length - 1];
        }
        onSetUploadingFile({
          contentId,
          contentType,
          isUploading: false
        });
      }
      await onSubmit({
        title: finalizeEmoji(title),
        description: finalizeEmoji(description),
        rewardLevel,
        secretAnswer: finalizeEmoji(secretAnswer),
        ...(secretAttachment
          ? {
              secretAttachmentFilePath: filePath,
              secretAttachmentFileName: secretAttachment.file.name,
              secretAttachmentFileSize: secretAttachment.file.size,
              secretAttachmentThumbUrl: secretThumbUrl
            }
          : {})
      });
      onUpdateSecretFileUploadProgress({
        contentId,
        contentType,
        progress: 0
      });
      onSetSubjectInputForm({
        contentId,
        contentType,
        form: null
      });
      titleRef.current = '';
      descriptionRef.current = '';
      secretAnswerRef.current = '';
      secretAttachmentRef.current = null;
    } catch (error) {
      setSubmitting(false);
      console.error(error);
    }
  }
}
