import React, {
  useContext,
  memo,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback
} from 'react';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Textarea from '~/components/Texts/Textarea';
import AttachContentModal from './AttachContentModal';
import Attachment from '~/components/Attachment';
import ErrorBoundary from '~/components/ErrorBoundary';
import LocalContext from '../../../../Context';
import {
  addEmoji,
  getFileInfoFromFileName,
  exceedsCharLimit,
  stringIsEmpty,
  finalizeEmoji
} from '~/helpers/stringHelpers';
import { v1 as uuidv1 } from 'uuid';
import SwitchButton from '~/components/Buttons/SwitchButton';
import RewardLevelForm from '~/components/Forms/RewardLevelForm';
import Icon from '~/components/Icon';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import SecretMessageInput from '~/components/Forms/SecretMessageInput';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { PanelStyle } from '../Styles';
import {
  charLimit,
  DESCRIPTION_LENGTH_FOR_EXTRA_REWARD_LEVEL
} from '~/constants/defaultValues';
import {
  useAppContext,
  useHomeContext,
  useInputContext,
  useKeyContext
} from '~/contexts';
import localize from '~/constants/localize';
import RewardLevelExplainer from '~/components/RewardLevelExplainer';
import ThumbnailPicker from '~/components/ThumbnailPicker';

const BodyRef = document.scrollingElement || document.documentElement;
const enterDescriptionOptionalLabel = localize('enterDescriptionOptional');
const postLabel = localize('post');
const postSubjectLabel = localize('postSubject');
const postSubjectPlaceholder = localize('postSubjectPlaceholder');
const secretMessageLabel = localize('secretMessage');

function SubjectInput({
  drafts,
  onModalHide
}: {
  drafts: {
    id: number;
    type: string;
    content: string;
    lastUpdated: number;
    title: string;
    description: string;
    secretAnswer: string;
    hasSecretAnswer: boolean;
    attachment: any;
    rewardLevel: number;
  }[];
  onModalHide: () => void;
}) {
  const inputModalType = useHomeContext((v) => v.state.inputModalType);
  const saveDraft = useAppContext((v) => v.requestHelpers.saveDraft);
  const deleteDraft = useAppContext((v) => v.requestHelpers.deleteDraft);
  const [draggedFile, setDraggedFile] = useState();
  const { onFileUpload } = useContext(LocalContext);
  const uploadContent = useAppContext((v) => v.requestHelpers.uploadContent);
  const { canEditRewardLevel, banned } = useKeyContext((v) => v.myState);
  const {
    success: { color: successColor },
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor }
  } = useKeyContext((v) => v.theme);
  const fileUploadProgress = useHomeContext((v) => v.state.fileUploadProgress);
  const secretAttachmentUploadProgress = useHomeContext(
    (v) => v.state.secretAttachmentUploadProgress
  );
  const submittingSubject = useHomeContext((v) => v.state.submittingSubject);
  const uploadingFile = useHomeContext((v) => v.state.uploadingFile);
  const onLoadNewFeeds = useHomeContext((v) => v.actions.onLoadNewFeeds);
  const onSetSubmittingSubject = useHomeContext(
    (v) => v.actions.onSetSubmittingSubject
  );
  const onSetUploadingFile = useHomeContext(
    (v) => v.actions.onSetUploadingFile
  );
  const subject = useInputContext((v) => v.state.subject);
  const onSetHasSecretAnswer = useInputContext(
    (v) => v.actions.onSetHasSecretAnswer
  );
  const onResetSubjectInput = useInputContext(
    (v) => v.actions.onResetSubjectInput
  );
  const onSetIsMadeByUser = useInputContext((v) => v.actions.onSetIsMadeByUser);
  const onSetSecretAnswer = useInputContext((v) => v.actions.onSetSecretAnswer);
  const onSetSecretAttachment = useInputContext(
    (v) => v.actions.onSetSecretAttachment
  );
  const onSetSubjectAttachment = useInputContext(
    (v) => v.actions.onSetSubjectAttachment
  );
  const onSetSubjectDescription = useInputContext(
    (v) => v.actions.onSetSubjectDescription
  );
  const onSetSubjectDescriptionFieldShown = useInputContext(
    (v) => v.actions.onSetSubjectDescriptionFieldShown
  );
  const onSetSubjectRewardLevel = useInputContext(
    (v) => v.actions.onSetSubjectRewardLevel
  );
  const onSetSubjectTitle = useInputContext((v) => v.actions.onSetSubjectTitle);

  const {
    details,
    details: { attachment, rewardLevel, secretAttachment }
  } = subject;
  const [attachContentModalShown, setAttachContentModalShown] = useState(false);
  const titleRef = useRef(details.title);
  const [title, setTitle] = useState(details.title);
  const descriptionRef = useRef(details.description);
  const [description, setDescription] = useState(details.description);
  const descriptionFieldShownRef = useRef(subject.descriptionFieldShown);
  const [descriptionFieldShown, setDescriptionFieldShown] = useState(
    subject.descriptionFieldShown
  );
  const secretAnswerRef = useRef(details.secretAnswer);
  const [secretAnswer, setSecretAnswer] = useState(details.secretAnswer);
  const hasSecretAnswerRef = useRef(subject.hasSecretAnswer);
  const [hasSecretAnswer, setHasSecretAnswer] = useState(
    subject.hasSecretAnswer
  );
  const isMadeByUserRef = useRef(subject.isMadeByUser);
  const [isMadeByUser, setIsMadeByUser] = useState(subject.isMadeByUser);

  const [draftId, setDraftId] = useState<number | null>(null);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );
  const saveTimeoutRef = useRef<number | null>(null);
  const savedIndicatorTimeoutRef = useRef<number | null>(null);

  const saveDraftWithTimeout = useCallback(
    (draftData: any) => {
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
            ...draftData,
            contentType: 'subject',
            draftId
          });
          if (result?.draftId) setDraftId(result.draftId);
          setSavingState('saved');
          savedIndicatorTimeoutRef.current = window.setTimeout(() => {
            setSavingState('idle');
          }, 2000);
        } catch (error) {
          console.error('Failed to save draft:', error);
          setSavingState('idle');
        }
      }, 1500);
    },
    [draftId, saveDraft]
  );

  const saveDraftOnChange = useCallback(
    (draftData: any) => {
      saveDraftWithTimeout(draftData);
    },
    [saveDraftWithTimeout]
  );

  useEffect(() => {
    const subjectDraft = drafts.find((draft) => draft.type === 'subject');
    if (subjectDraft) {
      const {
        id,
        title,
        description,
        secretAnswer,
        hasSecretAnswer,
        attachment,
        rewardLevel
      } = subjectDraft;
      setDraftId(id);
      setTitle(title);
      setDescription(description);
      setSecretAnswer(secretAnswer || '');
      setHasSecretAnswer(!!hasSecretAnswer);
      onSetSubjectAttachment(attachment);
      onSetSubjectRewardLevel(rewardLevel);
      setDescriptionFieldShown(!!title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts]);

  useEffect(() => {
    if (inputModalType === 'file') {
      setAttachContentModalShown(true);
    }
  }, [inputModalType]);

  const titleExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        inputType: 'title',
        contentType: 'subject',
        text: title
      }),
    [title]
  );

  const descriptionExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'subject',
        inputType: 'description',
        text: description
      }),
    [description]
  );

  const buttonDisabled = useMemo(() => {
    if (title.length > charLimit.subject.title) return true;
    if (description.length > charLimit.subject.description) return true;
    if (
      (hasSecretAnswer && stringIsEmpty(secretAnswer) && !secretAttachment) ||
      secretAnswer.length > charLimit.subject.description
    ) {
      return true;
    }
    return false;
  }, [
    description.length,
    hasSecretAnswer,
    secretAnswer,
    secretAttachment,
    title.length
  ]);

  useEffect(() => {
    return function setTextsBeforeUnmount() {
      onSetSubjectDescriptionFieldShown(descriptionFieldShownRef.current);
      onSetSubjectTitle(titleRef.current);
      onSetSubjectDescription(descriptionRef.current);
      onSetHasSecretAnswer(hasSecretAnswerRef.current);
      onSetIsMadeByUser(isMadeByUserRef.current);
      onSetSecretAnswer(secretAnswerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fileType = useMemo(() => {
    const { fileType: result } = getFileInfoFromFileName(
      attachment?.file?.name
    );
    return ['other', 'archive', 'word'].includes(result) ? 'file' : result;
  }, [attachment]);

  const descriptionMeetsExtraRewardRequirement = useMemo(() => {
    const cleanedDescription = (description || '').replace(/[\W_]+/g, '');
    return (
      cleanedDescription.length >= DESCRIPTION_LENGTH_FOR_EXTRA_REWARD_LEVEL &&
      attachment?.contentType !== 'file'
    );
  }, [attachment?.contentType, description]);

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
    <ErrorBoundary
      className={PanelStyle}
      componentPath="Home/Stories/InputPanel/SubjectInput/index"
    >
      {!uploadingFile && (
        <>
          <div>
            <p
              className={css`
                color: ${Color.darkerGray()};
                margin-bottom: 1rem;
                font-size: 2rem;
                font-weight: bold;
              `}
            >
              {postSubjectLabel}
            </p>
            <div
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ width: '100%' }}>
                <Input
                  placeholder={postSubjectPlaceholder}
                  value={title}
                  onChange={handleTitleInputChange}
                  onDrop={(e: React.DragEvent) => e.preventDefault()}
                  onKeyUp={(event: any) => {
                    handleSetTitle(addEmoji(event.target.value));
                  }}
                  style={titleExceedsCharLimit?.style}
                />
              </div>
              <div style={{ marginLeft: '1rem', fontSize: '1rem' }}>
                {attachment ? (
                  <Attachment
                    attachment={attachment}
                    onDragStart={() => {
                      const file = attachment?.file;
                      let newFile;
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
                    onClose={() => onSetSubjectAttachment(null)}
                  />
                ) : (
                  <Button
                    skeuomorphic
                    color={buttonColor}
                    hoverColor={buttonHoverColor}
                    onClick={() => setAttachContentModalShown(true)}
                  >
                    <Icon size="lg" icon="plus" />
                  </Button>
                )}
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <span
                style={{
                  fontSize: '1.2rem',
                  color:
                    title.length > charLimit.subject.title
                      ? 'red'
                      : Color.darkerGray()
                }}
              >
                {titleExceedsCharLimit?.message}
              </span>
            </div>
            {attachment?.contentType === 'file' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <SwitchButton
                  checked={!!isMadeByUser}
                  label={
                    <>
                      I made this <b>{fileType}</b> myself
                    </>
                  }
                  labelStyle={{ fontSize: '1.5rem' }}
                  onChange={() => handleSetIsMadeByUser(!isMadeByUser)}
                  style={{ marginRight: '1rem' }}
                />
              </div>
            )}
          </div>
          {descriptionFieldShown && (
            <div style={{ position: 'relative' }}>
              <Textarea
                draggedFile={draggedFile}
                onDrop={handleDrop}
                style={{
                  marginTop: '1rem'
                }}
                hasError={!!descriptionExceedsCharLimit}
                value={description}
                minRows={4}
                placeholder={enterDescriptionOptionalLabel}
                onChange={(event: any) =>
                  handleSetDescription(addEmoji(event.target.value))
                }
                onKeyUp={(event: any) => {
                  if (event.key === ' ') {
                    handleSetDescription(addEmoji(event.target.value));
                  }
                }}
              />
              {descriptionExceedsCharLimit && (
                <small style={{ color: 'red' }}>
                  {descriptionExceedsCharLimit.message}
                </small>
              )}
              {descriptionMeetsExtraRewardRequirement && (
                <div
                  style={{
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  <SwitchButton
                    checked={!!isMadeByUser}
                    label="I wrote this myself"
                    labelStyle={{ fontSize: '1.5rem' }}
                    onChange={() => handleSetIsMadeByUser(!isMadeByUser)}
                    style={{ marginRight: '1rem' }}
                  />
                </div>
              )}
              {attachment?.thumbnails?.length > 0 && (
                <ThumbnailPicker
                  thumbnails={attachment?.thumbnails}
                  initialSelectedIndex={attachment?.selectedThumbnailIndex}
                  onSelect={(index) => {
                    onSetSubjectAttachment({
                      thumbnail: attachment?.thumbnails[index],
                      selectedThumbnailIndex: index
                    });
                  }}
                />
              )}
              {hasSecretAnswer && (
                <>
                  <SecretMessageInput
                    secretAnswer={secretAnswer}
                    secretAttachment={secretAttachment}
                    onSetSecretAnswer={handleSetSecretAnswer}
                    onSetSecretAttachment={onSetSecretAttachment}
                    onThumbnailLoad={({
                      thumbnails,
                      selectedIndex
                    }: {
                      thumbnails: string[];
                      selectedIndex: number;
                    }) =>
                      onSetSecretAttachment({
                        thumbnail: thumbnails[selectedIndex],
                        selectedThumbnailIndex: selectedIndex,
                        thumbnails
                      })
                    }
                  />
                  {secretAttachment?.thumbnails?.length > 0 && (
                    <ThumbnailPicker
                      thumbnails={secretAttachment.thumbnails}
                      initialSelectedIndex={
                        secretAttachment.selectedThumbnailIndex
                      }
                      onSelect={(index) => {
                        onSetSecretAttachment({
                          thumbnail: secretAttachment.thumbnails[index],
                          selectedThumbnailIndex: index
                        });
                      }}
                    />
                  )}
                </>
              )}
              {canEditRewardLevel && (
                <div style={{ marginTop: '1rem' }}>
                  <RewardLevelExplainer
                    rewardLevel={rewardLevel}
                    type="subject"
                  />
                  <RewardLevelForm
                    themed
                    isFromSubjectInput
                    isMadeByUser={isMadeByUser}
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
                    onSetRewardLevel={onSetSubjectRewardLevel}
                  />
                </div>
              )}
              <div style={{ marginTop: '1rem' }} className="button-container">
                <SwitchButton
                  checked={hasSecretAnswer}
                  label={secretMessageLabel}
                  onChange={() => handleSetHasSecretAnswer(!hasSecretAnswer)}
                  style={{ marginRight: '1rem' }}
                />
                <Button
                  filled
                  color={successColor}
                  loading={submittingSubject}
                  disabled={buttonDisabled}
                  onClick={handleSubmit}
                >
                  {postLabel}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      {uploadingFile && attachment?.contentType === 'file' && (
        <FileUploadStatusIndicator
          style={{ fontSize: '1.7rem', fontWeight: 'bold', marginTop: 0 }}
          fileName={attachment?.file?.name}
          uploadProgress={fileUploadProgress}
        />
      )}
      {uploadingFile && secretAttachment?.file && (
        <FileUploadStatusIndicator
          style={{
            fontSize: '1.7rem',
            fontWeight: 'bold',
            marginTop: attachment?.contentType === 'file' ? '1.5rem' : 0
          }}
          fileName={secretAttachment?.file?.name}
          uploadProgress={secretAttachmentUploadProgress}
        />
      )}
      {attachContentModalShown && (
        <AttachContentModal
          onHide={() => setAttachContentModalShown(false)}
          onConfirm={(content: any) => {
            onSetSubjectAttachment(content);
            setAttachContentModalShown(false);
          }}
        />
      )}
      <div
        className={css`
          position: absolute;
          top: 2rem;
          right: 5rem;
          display: flex;
          align-items: center;
          font-size: 1.4rem;
          color: ${Color.gray()};
          transition: opacity 0.3s ease-in-out;
          opacity: ${savingState === 'idle' ? 0 : 1};
        `}
      >
        {savingState === 'saving' && (
          <>
            <Icon icon="spinner" pulse />
            <span style={{ marginLeft: '0.5rem' }}>Saving draft...</span>
          </>
        )}
        {savingState === 'saved' && (
          <>
            <Icon style={{ color: Color.green() }} icon="check-circle" />
            <span style={{ marginLeft: '0.5rem' }}>Draft saved</span>
          </>
        )}
      </div>
    </ErrorBoundary>
  );

  function handleDrop(filePath: string) {
    handleSetDescription(
      `${stringIsEmpty(description) ? '' : `${description}\n`}![](${filePath})`
    );
    if (draggedFile) {
      setDraggedFile(undefined);
      onSetSubjectAttachment(null);
    }
  }

  function handleThumbnailLoad({
    thumbnails,
    selectedIndex
  }: {
    thumbnails: string[];
    selectedIndex: number;
  }) {
    onSetSubjectAttachment({
      thumbnail: thumbnails[selectedIndex],
      selectedThumbnailIndex: selectedIndex,
      thumbnails
    });
  }

  function handleFileUpload({
    attachment,
    byUser,
    description,
    hasSecretAnswer,
    rewardLevel,
    secretAnswer,
    secretAttachment,
    title
  }: {
    attachment: any;
    byUser: boolean;
    description: string;
    hasSecretAnswer: boolean;
    rewardLevel: number;
    secretAnswer: string;
    secretAttachment: any;
    title: string;
  }) {
    if (banned?.posting) {
      return;
    }
    onSetUploadingFile(true);
    onFileUpload({
      attachment,
      byUser,
      description,
      hasSecretAnswer,
      rewardLevel,
      secretAnswer,
      secretAttachment,
      title,
      filePath: uuidv1()
    });
  }

  function handleTitleInputChange(text: string) {
    handleSetTitle(text);
    handleSetDescriptionFieldShown(!!text.length);
    if (!text.length) {
      handleSetHasSecretAnswer(false);
    }
  }

  async function handleSubmit(event: any) {
    if (banned?.posting) {
      return;
    }
    event.preventDefault();
    if (
      stringIsEmpty(title) ||
      title.length > charLimit.subject.title ||
      (hasSecretAnswer && stringIsEmpty(secretAnswer) && !secretAttachment)
    ) {
      return;
    }
    onSetSubmittingSubject(true);
    if (
      attachment?.contentType === 'file' ||
      (hasSecretAnswer && secretAttachment)
    ) {
      handleSetTitle('');
      handleSetDescription('');
      handleSetSecretAnswer('');
      handleSetDescriptionFieldShown(false);
      handleSetHasSecretAnswer(false);
      handleFileUpload({
        attachment,
        byUser: isMadeByUser,
        description,
        hasSecretAnswer,
        rewardLevel,
        secretAnswer,
        secretAttachment,
        title
      });
      handleSetIsMadeByUser(false);
    } else {
      handleUploadSubject();
    }
    const appElement = document.getElementById('App');
    if (appElement) appElement.scrollTop = 0;
    BodyRef.scrollTop = 0;

    if (draftId) {
      try {
        await deleteDraft(draftId);
      } catch (error) {
        console.error('Failed to delete draft:', error);
      }
    }
  }

  function handleSetTitle(text: string) {
    setTitle(text);
    titleRef.current = text;
    saveDraftOnChange({
      title: text,
      description,
      secretAnswer: hasSecretAnswer ? secretAnswer : '',
      rootType: attachment?.contentType,
      rootId: attachment?.id,
      rewardLevel
    });
  }

  function handleSetDescription(text: string) {
    setDescription(text);
    descriptionRef.current = text;
    saveDraftOnChange({
      title,
      description: text,
      secretAnswer: hasSecretAnswer ? secretAnswer : '',
      rootType: attachment?.contentType,
      rootId: attachment?.id,
      rewardLevel
    });
  }

  function handleSetDescriptionFieldShown(shown: boolean) {
    setDescriptionFieldShown(shown);
    descriptionFieldShownRef.current = shown;
  }

  function handleSetIsMadeByUser(is: boolean) {
    setIsMadeByUser(is);
    isMadeByUserRef.current = is;
  }

  function handleSetHasSecretAnswer(has: boolean) {
    setHasSecretAnswer(has);
    hasSecretAnswerRef.current = has;
  }

  function handleSetSecretAnswer(text: string) {
    setSecretAnswer(text);
    secretAnswerRef.current = text;
    saveDraftOnChange({
      title,
      description,
      secretAnswer: hasSecretAnswer ? text : '',
      rootType: attachment?.contentType,
      rootId: attachment?.id,
      rewardLevel
    });
  }

  async function handleUploadSubject() {
    if (banned?.posting) {
      return;
    }
    try {
      const data = await uploadContent({
        rootId: attachment?.id,
        rootType: attachment?.contentType,
        title,
        byUser: isMadeByUser,
        description: finalizeEmoji(description),
        secretAnswer: hasSecretAnswer ? secretAnswer : '',
        rewardLevel
      });
      if (data) {
        onLoadNewFeeds([data]);
        handleSetTitle('');
        handleSetDescription('');
        handleSetSecretAnswer('');
        handleSetDescriptionFieldShown(false);
        handleSetHasSecretAnswer(false);
        handleSetIsMadeByUser(false);
        onResetSubjectInput();
      }
      onSetSubmittingSubject(false);
      onModalHide();
    } catch (error) {
      console.error(error);
      onSetSubmittingSubject(false);
    }
  }
}

export default memo(SubjectInput);
