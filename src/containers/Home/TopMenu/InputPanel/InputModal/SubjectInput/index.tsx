import React, {
  useContext,
  memo,
  useMemo,
  useRef,
  useState,
  useEffect
} from 'react';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Textarea from '~/components/Texts/Textarea';
import AttachContentModal from './AttachContentModal';
import AlertModal from '~/components/Modals/AlertModal';
import Attachment from '~/components/Attachment';
import ErrorBoundary from '~/components/ErrorBoundary';
import useEmbedFileUpload from '~/helpers/hooks/useEmbedFileUpload';
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
import RewardLevelExplainer from '~/components/RewardLevelExplainer';
import ThumbnailPicker from '~/components/ThumbnailPicker';
import DraftSaveIndicator from '~/components/DraftSaveIndicator';
import DraftTabs from './DraftTabs';
import { useToast } from '~/contexts/Toast';
import usePostDrafts, {
  isEmptyDraftText,
  isPostFormOpen,
  type PostDraftExtras,
  type PostDraftText,
  type ServerPostDraft
} from './usePostDrafts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

const BodyRef = document.scrollingElement || document.documentElement;
const enterDescriptionOptionalLabel = `Enter Description (Optional, you don't need to write this)`;
const postLabel = 'Post!';
const postSubjectLabel = 'Post a subject users can talk about';
const postSubjectPlaceholder = 'A subject users can talk about';
const secretMessageLabel = 'Secret Message';

function SubjectInput({
  draftIdRef,
  subject,
  title,
  titleRef,
  descriptionRef,
  onSetTitle,
  drafts,
  draftsLoadFailed,
  onModalHide
}: {
  draftIdRef: React.RefObject<number | null>;
  subject: {
    title: string;
    description: string;
    secretAnswer: string;
    hasSecretAnswer: boolean;
    attachment: any;
    rewardLevel: number;
    descriptionFieldShown: boolean;
    isMadeByUser: boolean;
    details: {
      title: string;
      description: string;
      secretAnswer: string;
      secretAttachment: any;
      hasSecretAnswer: boolean;
      attachment: any;
      rewardLevel: number;
    };
  };
  title: string;
  titleRef: React.RefObject<string>;
  descriptionRef: React.RefObject<string>;
  onSetTitle: (title: string) => void;
  // null until this opening's drafts have loaded
  drafts: ServerPostDraft[] | null;
  draftsLoadFailed: boolean;
  onModalHide: () => void;
}) {
  const inputModalType = useHomeContext((v) => v.state.inputModalType);
  const saveDraft = useAppContext((v) => v.requestHelpers.saveDraft);
  const deleteDraft = useAppContext((v) => v.requestHelpers.deleteDraft);
  const [draggedFile, setDraggedFile] = useState();
  const {
    uploadForEmbed,
    uploading: embedUploading,
    uploadErrorType: embedUploadErrorType,
    setUploadErrorType: setEmbedUploadErrorType,
    errorModalContent: embedErrorModalContent
  } = useEmbedFileUpload();
  const { onFileUpload } = useContext(LocalContext);
  const uploadContent = useAppContext((v) => v.requestHelpers.uploadContent);
  const canEditRewardLevel = useKeyContext((v) => v.myState.canEditRewardLevel);
  const banned = useKeyContext((v) => v.myState.banned);
  const userId = useKeyContext((v) => v.myState.userId);
  const successRole = useRoleColor('success', { fallback: 'green' });
  const buttonRole = useRoleColor('button', { fallback: 'logoBlue' });
  const buttonHoverRole = useRoleColor('buttonHovered', {
    fallback: buttonRole.colorKey
  });
  const successColorKey = successRole.colorKey;
  const buttonColorKey = buttonRole.colorKey;
  const buttonHoverColorKey = buttonHoverRole.colorKey || buttonColorKey;
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
  const onSetHasSecretAnswer = useInputContext(
    (v) => v.actions.onSetHasSecretAnswer
  );
  const onResetSubjectInput = useInputContext(
    (v) => v.actions.onResetSubjectInput
  );
  const onResetContentInput = useInputContext(
    (v) => v.actions.onResetContentInput
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

  const { details } = subject;
  const { attachment, secretAttachment, rewardLevel } = details;

  const [attachContentModalShown, setAttachContentModalShown] = useState(false);
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
  const preserveLocalDraftStateRef = useRef(
    !stringIsEmpty(titleRef.current) ||
      !stringIsEmpty(descriptionRef.current) ||
      !stringIsEmpty(secretAnswerRef.current) ||
      !!subject.hasSecretAnswer
  );

  // a post is on its way (set before the Home store catches up)
  const postingRef = useRef(false);
  const unmountedRef = useRef(false);
  useEffect(
    () => () => {
      unmountedRef.current = true;
    },
    []
  );
  const showToast = useToast();
  const {
    entries: draftEntries,
    activeKey: activeDraftKey,
    activeIsFresh: activeDraftIsFresh,
    busy: draftsBusy,
    error: draftsError,
    savingState,
    scheduleSave,
    switchTo: switchDraft,
    startNew: startNewDraft,
    remove: removeDraft,
    markPosted: markDraftPosted,
    finishPost: finishDraftPost,
    keepAsDraft: keepTextAsDraft,
    saveFormAsNewDraft
  } = usePostDrafts({
    userId,
    drafts,
    draftsLoadFailed,
    draftIdRef,
    hasLocalEdits: () => preserveLocalDraftStateRef.current,
    // refs and the file upload only: Home's submitting flag lags a render
    isPosting: () => postingRef.current || !!uploadingFile,
    getText: getDraftText,
    getExtras: getDraftExtras,
    applyDraft: applyPostDraft,
    saveDraft,
    deleteDraft
  });

  useEffect(() => {
    if (!subject?.details) return;
    const {
      title: subjectTitle = '',
      description: subjectDescription = '',
      secretAnswer: subjectSecretAnswer = ''
    } = subject.details;
    const nextTitle = subjectTitle || '';
    if (nextTitle !== titleRef.current) {
      onSetTitle(nextTitle);
      titleRef.current = nextTitle;
    }
    const nextDescription = subjectDescription || '';
    if (nextDescription !== descriptionRef.current) {
      setDescription(nextDescription);
      descriptionRef.current = nextDescription;
    }
    const nextSecretAnswer = subjectSecretAnswer || '';
    if (nextSecretAnswer !== secretAnswerRef.current) {
      setSecretAnswer(nextSecretAnswer);
      secretAnswerRef.current = nextSecretAnswer;
    }
    const nextHasSecretAnswer =
      typeof subject.hasSecretAnswer === 'boolean'
        ? subject.hasSecretAnswer
        : !!subject.details.hasSecretAnswer;
    if (nextHasSecretAnswer !== hasSecretAnswerRef.current) {
      setHasSecretAnswer(nextHasSecretAnswer);
      hasSecretAnswerRef.current = nextHasSecretAnswer;
    }
    const nextDescriptionFieldShown = !!subject.descriptionFieldShown;
    if (nextDescriptionFieldShown !== descriptionFieldShownRef.current) {
      setDescriptionFieldShown(nextDescriptionFieldShown);
      descriptionFieldShownRef.current = nextDescriptionFieldShown;
    }
    const nextIsMadeByUser = !!subject.isMadeByUser;
    if (nextIsMadeByUser !== isMadeByUserRef.current) {
      setIsMadeByUser(nextIsMadeByUser);
      isMadeByUserRef.current = nextIsMadeByUser;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    subject?.descriptionFieldShown,
    subject?.details?.description,
    subject?.details?.secretAnswer,
    subject?.details?.hasSecretAnswer,
    subject.hasSecretAnswer,
    subject?.isMadeByUser,
    titleRef,
    descriptionRef,
    onSetTitle
  ]);

  useEffect(() => {
    if (inputModalType === 'file') {
      setAttachContentModalShown(true);
    }
  }, [inputModalType]);

  // A file post that failed is put back in the form (by App): it saves
  // again as a draft, as a failed plain post does.
  const wasUploadingRef = useRef(!!uploadingFile);
  useEffect(() => {
    const wasUploading = wasUploadingRef.current;
    wasUploadingRef.current = !!uploadingFile;
    if (!wasUploading || uploadingFile || postingRef.current) return;
    // after this render's effects (the title syncs in the parent's)
    const timer = window.setTimeout(() => {
      if (!isEmptyDraftText(getDraftText())) saveFormAsNewDraft();
    });
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadingFile]);

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

  return (
    <ErrorBoundary
      className={PanelStyle}
      componentPath="Home/Stories/InputPanel/SubjectInput/index"
    >
      {!uploadingFile && (
        <>
          <DraftTabs
            entries={draftEntries}
            activeKey={activeDraftKey}
            activeText={{
              title,
              description,
              secretAnswer: hasSecretAnswer ? secretAnswer : ''
            }}
            activeIsFresh={activeDraftIsFresh}
            busy={draftsBusy}
            locked={!!submittingSubject || !!uploadingFile}
            error={draftsError}
            onSelect={switchDraft}
            onNew={startNewDraft}
            onDelete={removeDraft}
          />
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
                  readOnly={!!draftsBusy}
                  value={title}
                  onChange={handleTitleInputChange}
                  onDrop={(e: React.DragEvent) => e.preventDefault()}
                  onKeyUp={(event: any) => {
                    // a key let go while a draft is switching isn't an edit
                    if (draftsBusy) return;
                    handleSetTitle(addEmoji(event.target.value));
                  }}
                  style={titleExceedsCharLimit?.style}
                />
              </div>
              <div style={{ marginLeft: '1rem', fontSize: '1.1rem' }}>
                {attachment ? (
                  <Attachment
                    attachment={attachment}
                    embedUploading={embedUploading}
                    onDragStart={() => {
                      const file = attachment?.file;
                      if (file) {
                        setDraggedFile(file);
                      }
                    }}
                    onDragEnd={() => setDraggedFile(undefined)}
                    onDragEmbed={handleDragEmbed}
                    onThumbnailLoad={handleThumbnailLoad}
                    onClose={() => onSetSubjectAttachment(null)}
                  />
                ) : (
                  <Button
                    variant="soft"
                    tone="raised"
                    color={buttonColorKey}
                    hoverColor={buttonHoverColorKey}
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
                readOnly={!!draftsBusy}
                value={description}
                minRows={4}
                placeholder={enterDescriptionOptionalLabel}
                onChange={(event: any) =>
                  handleSetDescription(addEmoji(event.target.value))
                }
                onKeyUp={(event: any) => {
                  if (draftsBusy) return;
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
                  variant="solid"
                  color={successColorKey}
                  loading={submittingSubject}
                  disabled={buttonDisabled || !!draftsBusy}
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
      {embedUploadErrorType && (
        <AlertModal
          title={embedErrorModalContent.title}
          content={embedErrorModalContent.content}
          onHide={() => setEmbedUploadErrorType('')}
        />
      )}
      <AttachContentModal
        isOpen={attachContentModalShown}
        onHide={() => setAttachContentModalShown(false)}
        onConfirm={(content: any) => {
          onSetSubjectAttachment(content);
          setAttachContentModalShown(false);
        }}
      />
      <div
        className={css`
          position: absolute;
          top: 2rem;
          right: 5rem;
        `}
      >
        <DraftSaveIndicator savingState={savingState} />
      </div>
    </ErrorBoundary>
  );

  function handleDrop(
    filePath: string,
    options?: { fromAttachment?: boolean }
  ) {
    insertImageEmbed(filePath);
    if (options?.fromAttachment) {
      clearAttachment();
    }
  }

  async function handleDragEmbed() {
    const file = attachment?.file;
    if (!file) return;
    const url = await uploadForEmbed(file);
    if (!url) return;
    insertImageEmbed(url);
    clearAttachment();
  }

  function insertImageEmbed(filePath: string) {
    const currentText = descriptionRef.current || '';
    handleSetDescription(
      `${stringIsEmpty(currentText) ? '' : `${currentText}\n`}![](${filePath})`
    );
  }

  function clearAttachment() {
    setDraggedFile(undefined);
    onSetSubjectAttachment(null);
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
    // Only the draft being posted goes; the others stay.
    postingRef.current = true;
    void markDraftPosted();
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
      postingRef.current = false;
      // the file upload has the post now (and puts it back if it fails)
      finishDraftPost();
    } else {
      handleUploadSubject();
    }
    const appElement = document.getElementById('App');
    if (appElement) appElement.scrollTop = 0;
    BodyRef.scrollTop = 0;
  }

  function handleSetTitle(text: string) {
    onSetTitle(text);
    titleRef.current = text;
    preserveLocalDraftStateRef.current = true;
    saveCurrentDraft();
  }

  function handleSetDescription(text: string) {
    setDescription(text);
    descriptionRef.current = text;
    preserveLocalDraftStateRef.current = true;
    saveCurrentDraft();
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
    preserveLocalDraftStateRef.current = true;
  }

  function handleSetSecretAnswer(text: string) {
    setSecretAnswer(text);
    secretAnswerRef.current = text;
    preserveLocalDraftStateRef.current = true;
    saveCurrentDraft();
  }

  function saveCurrentDraft() {
    scheduleSave();
  }

  function getDraftText(): PostDraftText {
    return {
      title: titleRef.current || '',
      description: descriptionRef.current || '',
      secretAnswer: hasSecretAnswerRef.current
        ? secretAnswerRef.current || ''
        : ''
    };
  }

  function getDraftExtras(): PostDraftExtras {
    return {
      attachment,
      secretAttachment,
      hasSecretAnswer: !!hasSecretAnswerRef.current,
      rewardLevel,
      isMadeByUser: isMadeByUserRef.current
    };
  }

  // Puts a draft in the form. extras: undefined leaves the attachment etc.
  // as they are, null clears them.
  function applyPostDraft(
    text: PostDraftText,
    extras: PostDraftExtras | null | undefined
  ) {
    const nextTitle = text.title || '';
    const nextDescription = text.description || '';
    const nextSecretAnswer = text.secretAnswer || '';
    applySubjectDraftState({
      title: nextTitle,
      description: nextDescription,
      secretAnswer: nextSecretAnswer,
      hasSecretAnswer:
        !stringIsEmpty(nextSecretAnswer) || !!extras?.hasSecretAnswer,
      descriptionFieldShown:
        !stringIsEmpty(nextTitle) || !stringIsEmpty(nextDescription)
    });
    if (extras === undefined) return;
    // cleared first: setting an attachment merges into the current one
    onSetSubjectAttachment(null);
    onSetSecretAttachment(null);
    if (extras?.attachment) onSetSubjectAttachment(extras.attachment);
    if (extras?.secretAttachment) {
      onSetSecretAttachment(extras.secretAttachment);
    }
    onSetSubjectRewardLevel(extras?.rewardLevel || 0);
    handleSetIsMadeByUser(!!extras?.isMadeByUser);
  }

  function applySubjectDraftState({
    description,
    descriptionFieldShown,
    hasSecretAnswer,
    secretAnswer,
    title
  }: {
    description: string;
    descriptionFieldShown: boolean;
    hasSecretAnswer: boolean;
    secretAnswer: string;
    title: string;
  }) {
    onSetTitle(title);
    titleRef.current = title;
    onSetSubjectTitle(title);

    setDescription(description);
    descriptionRef.current = description;
    onSetSubjectDescription(description);

    setSecretAnswer(secretAnswer);
    secretAnswerRef.current = secretAnswer;
    onSetSecretAnswer(secretAnswer);

    setHasSecretAnswer(hasSecretAnswer);
    hasSecretAnswerRef.current = hasSecretAnswer;
    onSetHasSecretAnswer(hasSecretAnswer);

    setDescriptionFieldShown(descriptionFieldShown);
    descriptionFieldShownRef.current = descriptionFieldShown;
    onSetSubjectDescriptionFieldShown(descriptionFieldShown);
    preserveLocalDraftStateRef.current = true;
  }

  async function handleUploadSubject() {
    if (banned?.posting) {
      return;
    }
    // what is being posted, in case it doesn't go
    const postedText: PostDraftText = {
      title,
      description,
      secretAnswer: hasSecretAnswer ? secretAnswer : ''
    };
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
      if (data && unmountedRef.current) {
        // The form was closed while this was sending. A form opened since
        // holds another draft: leave it (and don't close it). With none
        // open, the posted text is cleared so it doesn't come back.
        onLoadNewFeeds([data]);
        if (!isPostFormOpen()) {
          onResetSubjectInput();
          onResetContentInput();
        }
        postingRef.current = false;
        finishDraftPost();
        onSetSubmittingSubject(false);
        return;
      }
      if (data) {
        onLoadNewFeeds([data]);
        handleSetTitle('');
        handleSetDescription('');
        handleSetSecretAnswer('');
        handleSetDescriptionFieldShown(false);
        handleSetHasSecretAnswer(false);
        handleSetIsMadeByUser(false);
        onResetSubjectInput();
        onResetContentInput();
        postingRef.current = false;
        finishDraftPost();
      } else {
        keepUnpostedTextAsDraft(postedText);
      }
      onSetSubmittingSubject(false);
      onModalHide();
    } catch (error) {
      console.error(error);
      keepUnpostedTextAsDraft(postedText);
      onSetSubmittingSubject(false);
    }
  }

  // The post didn't go: its text saves again, as a new draft. If the form
  // was closed meanwhile, a message says so (it's in their drafts).
  function keepUnpostedTextAsDraft(postedText: PostDraftText) {
    postingRef.current = false;
    finishDraftPost();
    keepTextAsDraft(postedText);
    if (unmountedRef.current) {
      showToast({
        message:
          "Your post didn't go through. It's saved in your drafts in the post form."
      });
    }
  }
}

export default memo(SubjectInput);
