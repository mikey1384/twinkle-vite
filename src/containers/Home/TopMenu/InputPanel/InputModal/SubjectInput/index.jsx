import { useContext, memo, useMemo, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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

const BodyRef = document.scrollingElement || document.documentElement;
const enterDescriptionOptionalLabel = localize('enterDescriptionOptional');
const postLabel = localize('post');
const postSubjectLabel = localize('postSubject');
const postSubjectPlaceholder = localize('postSubjectPlaceholder');
const secretMessageLabel = localize('secretMessage');

SubjectInput.propTypes = {
  onModalHide: PropTypes.func.isRequired
};

function SubjectInput({ onModalHide }) {
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
    details: { thumbnail, attachment, rewardLevel, secretAttachment }
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

  return (
    <ErrorBoundary
      componentPath="Home/Stories/InputPanel/SubjectInput/index"
      className={PanelStyle}
    >
      {!uploadingFile && (
        <>
          <p>{postSubjectLabel}</p>
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
                onChange={handleInputChange}
                onKeyUp={(event) => {
                  handleSetTitle(addEmoji(event.target.value));
                }}
                style={titleExceedsCharLimit?.style}
              />
            </div>
            <div style={{ marginLeft: '1rem' }}>
              {attachment ? (
                <Attachment
                  attachment={attachment}
                  onThumbnailLoad={(thumbnail) =>
                    onSetSubjectAttachment({
                      thumbnail
                    })
                  }
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
                padding: '1rem',
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
          {descriptionFieldShown && (
            <div style={{ position: 'relative' }}>
              <Textarea
                style={{
                  marginTop: '1rem',
                  ...(descriptionExceedsCharLimit?.style || null)
                }}
                value={description}
                minRows={4}
                placeholder={enterDescriptionOptionalLabel}
                onChange={(event) =>
                  handleSetDescription(addEmoji(event.target.value))
                }
                onKeyUp={(event) => {
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
              {description.length > DESCRIPTION_LENGTH_FOR_EXTRA_REWARD_LEVEL &&
                attachment?.contentType !== 'file' && (
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
              {hasSecretAnswer && (
                <SecretMessageInput
                  secretAnswer={secretAnswer}
                  secretAttachment={secretAttachment}
                  onSetSecretAnswer={handleSetSecretAnswer}
                  onSetSecretAttachment={onSetSecretAttachment}
                  onThumbnailLoad={(thumbnail) =>
                    onSetSecretAttachment({
                      thumbnail
                    })
                  }
                />
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
                  type="submit"
                  disabled={submittingSubject || buttonDisabled}
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
          onConfirm={(content) => {
            onSetSubjectAttachment(content);
            setAttachContentModalShown(false);
          }}
        />
      )}
    </ErrorBoundary>
  );

  function handleFileUpload({
    attachment,
    byUser,
    description,
    hasSecretAnswer,
    rewardLevel,
    secretAnswer,
    secretAttachment,
    title
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

  function handleInputChange(text) {
    handleSetTitle(text);
    handleSetDescriptionFieldShown(!!text.length);
    if (!text.length) {
      handleSetHasSecretAnswer(false);
    }
  }

  async function handleSubmit(event) {
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
        title,
        thumbnail
      });
      handleSetIsMadeByUser(false);
    } else {
      handleUploadSubject();
    }
    document.getElementById('App').scrollTop = 0;
    BodyRef.scrollTop = 0;
  }

  function handleSetTitle(text) {
    setTitle(text);
    titleRef.current = text;
  }

  function handleSetDescription(text) {
    setDescription(text);
    descriptionRef.current = text;
  }

  function handleSetDescriptionFieldShown(shown) {
    setDescriptionFieldShown(shown);
    descriptionFieldShownRef.current = shown;
  }

  function handleSetIsMadeByUser(is) {
    setIsMadeByUser(is);
    isMadeByUserRef.current = is;
  }

  function handleSetHasSecretAnswer(has) {
    setHasSecretAnswer(has);
    hasSecretAnswerRef.current = has;
  }

  function handleSetSecretAnswer(text) {
    setSecretAnswer(text);
    secretAnswerRef.current = text;
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
      return Promise.resolve();
    } catch (error) {
      console.error(error);
      onSetSubmittingSubject(false);
    }
  }
}

export default memo(SubjectInput);
