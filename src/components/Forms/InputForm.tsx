import React, {
  useCallback,
  useState,
  useMemo,
  useRef,
  useEffect
} from 'react';
import Button from '~/components/Button';
import Textarea from '~/components/Texts/Textarea';
import Icon from '../Icon';
import Attachment from '~/components/Attachment';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import ProgressBar from '~/components/ProgressBar';
import AlertModal from '~/components/Modals/AlertModal';
import { Buffer } from 'buffer';
import { Color } from '~/constants/css';
import {
  FILE_UPLOAD_XP_REQUIREMENT,
  mb,
  returnMaxUploadSize,
  MOD_LEVEL
} from '~/constants/defaultValues';
import {
  addCommasToNumber,
  exceedsCharLimit,
  stringIsEmpty,
  addEmoji,
  finalizeEmoji,
  getFileInfoFromFileName
} from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { useInputContext, useKeyContext, useAppContext } from '~/contexts';
import { returnTheme } from '~/helpers';
import localize from '~/constants/localize';
import { Content } from '~/types';

const areYouSureLabel = localize('areYouSure');
const commentsMightNotBeRewardedLabel = localize('commentsMightNotBeRewarded');
const tapThisButtonToSubmitLabel = localize('tapThisButtonToSubmit');
const viewWithoutRespondingLabel = localize('viewWithoutResponding');
const viewSecretMessageWithoutRespondingLabel = localize(
  'viewSecretMessageWithoutResponding'
);

function InputForm({
  isComment,
  autoFocus,
  className = '',
  disableReason,
  effortBarColor,
  expectedContentLength = 0,
  formGroupStyle = {},
  innerRef,
  onSubmit,
  parent,
  placeholder,
  rows,
  onViewSecretAnswer,
  style = {},
  theme,
  targetCommentId
}: {
  isComment?: boolean;
  autoFocus?: boolean;
  className?: string;
  disableReason?: string;
  effortBarColor?: string;
  expectedContentLength?: number;
  formGroupStyle?: any;
  innerRef?: any;
  onSubmit: (text: string, attachment?: any) => void;
  parent: Content;
  placeholder?: string;
  rows?: number;
  onViewSecretAnswer?: () => void;
  style?: React.CSSProperties;
  theme?: string;
  targetCommentId?: number | null;
}) {
  const { level, userId, profileTheme, twinkleXP, fileUploadLvl } =
    useKeyContext((v) => v.myState);

  const {
    skeuomorphicDisabled: {
      color: skeuomorphicDisabledColor,
      opacity: skeuomorphicDisabledOpacity
    },
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor },
    danger: { color: dangerColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
  const maxSize = useMemo(
    () => returnMaxUploadSize(fileUploadLvl),
    [fileUploadLvl]
  );
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [draggedFile, setDraggedFile] = useState();
  const [submitting, setSubmitting] = useState(false);
  const [secretViewMessageSubmitting, setSecretViewMessageSubmitting] =
    useState(false);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const FileInputRef: React.RefObject<any> = useRef(null);
  const secretViewMessageSubmittingRef = useRef(false);
  const state = useInputContext((v) => v.state);
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const onSetCommentAttachment = useInputContext(
    (v) => v.actions.onSetCommentAttachment
  );
  const saveDraft = useAppContext((v) => v.requestHelpers.saveDraft);
  const deleteDraft = useAppContext((v) => v.requestHelpers.deleteDraft);
  const checkDrafts = useAppContext((v) => v.requestHelpers.checkDrafts);
  const [draftId, setDraftId] = useState<number | null>(null);
  const draftIdRef = useRef<number | null>(null);
  const [text, setText] = useState('');
  const textRef = useRef('');
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );
  const saveTimeoutRef = useRef<number | null>(null);
  const savedIndicatorTimeoutRef = useRef<number | null>(null);

  const contentType = useMemo(
    () => (targetCommentId ? 'comment' : parent.contentType),
    [parent, targetCommentId]
  );
  const contentId = useMemo(
    () => targetCommentId || parent.contentId,
    [parent.contentId, targetCommentId]
  );
  const attachment = useMemo(
    () => state[contentType + contentId]?.attachment,
    [contentId, contentType, state]
  );
  const inputState = useMemo(
    () => state[contentType + contentId],
    [contentId, contentType, state]
  );
  const prevText = useMemo(() => {
    return inputState?.text || '';
  }, [inputState]);
  const cleansedContentLength = useMemo(() => {
    if (!expectedContentLength) return 0;
    return (text || '').replace(/[\W_]+/g, '')?.length || 0;
  }, [expectedContentLength, text]);
  const textIsEmpty = useMemo(() => stringIsEmpty(text), [text]);
  const commentExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text
      }),
    [text]
  );
  const submitDisabled = useMemo(
    () =>
      submitting || (textIsEmpty && !attachment) || !!commentExceedsCharLimit,
    [attachment, commentExceedsCharLimit, submitting, textIsEmpty]
  );
  const uploadDisabled = useMemo(
    () => level < MOD_LEVEL && twinkleXP < FILE_UPLOAD_XP_REQUIREMENT,
    [level, twinkleXP]
  );

  useEffect(() => {
    return function saveTextBeforeUnmount() {
      if (textRef.current !== prevText) {
        onEnterComment({
          contentType,
          contentId,
          text: textRef.current
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isComment) {
      loadDraftForComment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComment]);

  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  async function loadDraftForComment() {
    try {
      const drafts = await checkDrafts({
        contentType: 'comment',
        rootType: parent.contentType,
        rootId: parent.contentId
      });
      const commentDraft = drafts.find(
        (draft: any) =>
          draft.type === 'comment' &&
          draft.rootType === parent.contentType &&
          draft.rootId === parent.contentId
      );
      if (commentDraft) {
        const { id, content } = commentDraft;
        setDraftId(id);
        setText(content);
        textRef.current = content;
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  }

  const saveDraftWithTimeout = useCallback(
    (draftData: any) => {
      if (!isComment) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }

      setSavingState('idle');

      saveTimeoutRef.current = window.setTimeout(async () => {
        setSavingState('saving');
        try {
          const result = await saveDraft({
            content: draftData.content,
            contentType: 'comment',
            draftId: draftIdRef.current,
            rootId: parent.contentId,
            rootType: parent.contentType
          });
          if (result?.draftId) setDraftId(result.draftId);
          setSavingState('saved');
          savedIndicatorTimeoutRef.current = window.setTimeout(() => {
            setSavingState('idle');
          }, 4000);
        } catch (error) {
          console.error('Failed to save draft:', error);
          setSavingState('idle');
        }
      }, 3000);
    },
    [isComment, saveDraft, parent.contentId, parent.contentType, setDraftId]
  );

  const handleSetText = useCallback(
    (newText: string, isInitDraft?: boolean) => {
      if (newText !== textRef.current) {
        setText(newText);
        textRef.current = newText;
        if (isComment && !isInitDraft) {
          saveDraftWithTimeout({
            content: newText
          });
        }
      }
    },
    [isComment, saveDraftWithTimeout]
  );

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      await onSubmit(finalizeEmoji(text));
      handleSetText('');
      if (isComment && draftIdRef.current) {
        await deleteDraft(draftIdRef.current);
        setDraftId(null);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error.message);
    } finally {
      setSubmitting(false);
    }
  }, [text, isComment, onSubmit, deleteDraft, handleSetText]);

  const handleUpload = useCallback(
    (event: any) => {
      const fileObj = event.target.files[0];
      if (fileObj.size / mb > maxSize) {
        return setAlertModalShown(true);
      }
      const { fileType } = getFileInfoFromFileName(fileObj.name);
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (upload: any) => {
          const payload = upload.target.result;
          const extension = fileObj.name.split('.').pop();
          if (extension === 'gif') {
            onSetCommentAttachment({
              attachment: {
                file: fileObj,
                contentType: 'file',
                fileType,
                imageUrl: payload
              },
              contentType,
              contentId
            });
          } else {
            window.loadImage(
              payload,
              function (img) {
                const imageUrl = img.toDataURL(
                  `image/${extension === 'png' ? 'png' : 'jpeg'}`
                );
                const dataUri = imageUrl.replace(
                  /^data:image\/\w+;base64,/,
                  ''
                );
                const buffer = Buffer.from(dataUri, 'base64');
                const file = new File([buffer], fileObj.name);
                onSetCommentAttachment({
                  attachment: {
                    file,
                    contentType: 'file',
                    fileType,
                    imageUrl
                  },
                  contentType,
                  contentId
                });
              },
              { orientation: true, canvas: true }
            );
          }
        };
        reader.readAsDataURL(fileObj);
      } else {
        onSetCommentAttachment({
          attachment: {
            file: fileObj,
            contentType: 'file',
            fileType
          },
          contentType,
          contentId
        });
      }
      event.target.value = null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contentId, contentType, maxSize]
  );

  const handleViewAnswer = useCallback(async () => {
    if (secretViewMessageSubmittingRef.current) {
      return;
    }
    secretViewMessageSubmittingRef.current = true;
    setSecretViewMessageSubmitting(true);
    try {
      await onViewSecretAnswer?.();
      setSecretViewMessageSubmitting(false);
      secretViewMessageSubmittingRef.current = false;
    } catch (error) {
      console.error(error);
      setSecretViewMessageSubmitting(false);
      secretViewMessageSubmittingRef.current = false;
    }
    setConfirmModalShown(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onViewSecretAnswer]);

  const effortBarDisplayLabel = useMemo(() => {
    if (cleansedContentLength < expectedContentLength) {
      return `${Math.floor(
        100 * (cleansedContentLength / expectedContentLength)
      )}%`;
    }
    return <Icon icon="check" />;
  }, [cleansedContentLength, expectedContentLength]);

  const effortBarShown = useMemo(
    () =>
      parent.contentType === 'subject' &&
      isComment &&
      !!text.length &&
      !!expectedContentLength,
    [expectedContentLength, isComment, parent.contentType, text.length]
  );

  const effortProgress = useMemo(
    () => Math.min(100 * (cleansedContentLength / expectedContentLength), 100),
    [cleansedContentLength, expectedContentLength]
  );

  const appliedEffortBarColor = useMemo(
    () =>
      cleansedContentLength > expectedContentLength
        ? Color.green()
        : effortBarColor,
    [cleansedContentLength, effortBarColor, expectedContentLength]
  );

  const [onHover, setOnHover] = useState(false);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        ...style
      }}
      className={className}
    >
      <div style={{ width: '100%', position: 'relative' }}>
        <div
          style={{
            position: 'relative',
            ...formGroupStyle
          }}
        >
          <Textarea
            disabled={!!disableReason}
            draggedFile={draggedFile}
            autoFocus={autoFocus}
            innerRef={innerRef}
            style={{
              marginBottom: '0.5rem',
              fontSize: '1.7rem'
            }}
            hasError={!!commentExceedsCharLimit}
            minRows={rows}
            value={text}
            placeholder={disableReason || placeholder}
            onChange={handleOnChange}
            onDrop={handleDrop}
            onKeyUp={handleKeyUp}
          />
          {effortBarShown && (
            <ProgressBar
              text={effortBarDisplayLabel}
              color={appliedEffortBarColor}
              progress={effortProgress}
            />
          )}
          {commentExceedsCharLimit && (
            <small style={{ color: 'red', fontSize: '1.3rem' }}>
              {commentExceedsCharLimit.message}
            </small>
          )}
        </div>
        {(!textIsEmpty || attachment) && (
          <div
            className={css`
              display: flex;
              justify-content: flex-end;
              align-items: center;
              margin-top: ${effortBarShown ? '1rem' : '0.5rem'};
              margin-bottom: 0.5rem;
              gap: 2rem;
            `}
          >
            {isComment && (
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  font-size: 1.3rem;
                  color: ${Color.gray()};
                  transition: opacity 0.3s ease-in-out;
                  opacity: ${savingState === 'idle' ? 0 : 1};
                  margin-right: 1rem;
                `}
              >
                {savingState === 'saved' && (
                  <>
                    <Icon icon="check-circle" />
                    <span style={{ marginLeft: '0.5rem' }}>Draft saved</span>
                  </>
                )}
              </div>
            )}
            <Button
              filled
              color="green"
              disabled={submitDisabled}
              onClick={handleSubmit}
            >
              {tapThisButtonToSubmitLabel}!
            </Button>
          </div>
        )}
        {!!onViewSecretAnswer && textIsEmpty && !attachment && !submitting && (
          <div
            className={css`
              display: flex;
              justify-content: flex-end;
            `}
          >
            <Button
              style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}
              color={dangerColor}
              filled
              loading={secretViewMessageSubmitting}
              onClick={() => {
                level >= MOD_LEVEL
                  ? handleViewAnswer()
                  : setConfirmModalShown(true);
              }}
            >
              {viewWithoutRespondingLabel}
            </Button>
          </div>
        )}
      </div>
      {attachment ? (
        <Attachment
          style={{ marginLeft: '1rem', fontSize: '1rem' }}
          attachment={attachment}
          onDragStart={() => {
            const file = attachment?.file;
            let newFile;
            const { fileType } = getFileInfoFromFileName(file?.name);
            if (fileType === 'image') {
              newFile = new File([file], file.name, {
                type: 'image/png'
              });
            } else {
              newFile = file;
            }
            setDraggedFile(newFile);
          }}
          onDragEnd={() => setDraggedFile(undefined)}
          onThumbnailLoad={handleThumbnailLoad}
          onClose={() =>
            onSetCommentAttachment({
              attachment: null,
              contentType,
              contentId
            })
          }
        />
      ) : (
        <div>
          {userId && (
            <Button
              skeuomorphic
              color={buttonColor}
              hoverColor={buttonHoverColor}
              onClick={() =>
                uploadDisabled ? null : FileInputRef.current.click()
              }
              onMouseEnter={() => setOnHover(true)}
              onMouseLeave={() => setOnHover(false)}
              style={{
                height: '4rem',
                width: '4rem',
                marginLeft: '1rem',
                opacity: uploadDisabled ? 0.2 : 1,
                cursor: uploadDisabled ? 'default' : 'pointer',
                boxShadow: uploadDisabled ? 'none' : '',
                borderColor: uploadDisabled
                  ? Color[skeuomorphicDisabledColor](
                      skeuomorphicDisabledOpacity
                    )
                  : ''
              }}
            >
              <Icon size="lg" icon="upload" />
            </Button>
          )}
          {userId && uploadDisabled && (
            <FullTextReveal
              style={{
                fontSize: '1.3rem',
                marginLeft: '1rem',
                marginTop: '0.5rem'
              }}
              text={`Requires ${addCommasToNumber(
                FILE_UPLOAD_XP_REQUIREMENT
              )} XP`}
              show={onHover}
            />
          )}
        </div>
      )}
      <input
        ref={FileInputRef}
        style={{ display: 'none' }}
        type="file"
        onChange={handleUpload}
      />
      {alertModalShown && (
        <AlertModal
          title="File is too large"
          content={`The file size is larger than your limit of ${
            maxSize / mb
          } MB`}
          onHide={() => setAlertModalShown(false)}
        />
      )}
      {confirmModalShown && (
        <ConfirmModal
          onHide={() => setConfirmModalShown(false)}
          descriptionFontSize="1.7rem"
          title={viewSecretMessageWithoutRespondingLabel}
          description={`${areYouSureLabel} ${commentsMightNotBeRewardedLabel}`}
          disabled={secretViewMessageSubmitting}
          onConfirm={handleViewAnswer}
        />
      )}
    </div>
  );

  function handleThumbnailLoad({
    thumbnails,
    selectedIndex
  }: {
    thumbnails: string[];
    selectedIndex: number;
  }) {
    const thumbnail = thumbnails[selectedIndex];
    onSetCommentAttachment({
      attachment: { thumbnail },
      contentType,
      contentId
    });
  }

  function handleDrop(filePath: string) {
    setText(`${stringIsEmpty(text) ? '' : `${text}\n`}![](${filePath})`);
    if (draggedFile) {
      setDraggedFile(undefined);
      onSetCommentAttachment({
        attachment: null,
        contentType,
        contentId
      });
    }
  }

  function handleKeyUp(event: any) {
    if (event.key === ' ') {
      handleSetText(addEmoji(event.target.value));
    }
  }

  function handleOnChange(event: any) {
    handleSetText(event.target.value);
  }
}

export default InputForm;
