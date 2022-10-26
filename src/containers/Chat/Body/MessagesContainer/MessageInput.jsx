import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import TargetMessagePreview from './TargetMessagePreview';
import TargetSubjectPreview from './TargetSubjectPreview';
import UploadModal from '../../Modals/UploadModal';
import AddButtons from './AddButtons';
import AlertModal from '~/components/Modals/AlertModal';
import Loading from '~/components/Loading';
import { isMobile } from '~/helpers';
import {
  stringIsEmpty,
  addEmoji,
  finalizeEmoji,
  exceedsCharLimit
} from '~/helpers/stringHelpers';
import {
  mb,
  returnMaxUploadSize,
  GENERAL_CHAT_ID
} from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import LocalContext from '../../Context';
import localize from '~/constants/localize';

const enterMessageLabel = localize('enterMessage');

MessageInput.propTypes = {
  selectedChannelId: PropTypes.number,
  innerRef: PropTypes.object,
  inputState: PropTypes.object,
  isBanned: PropTypes.bool,
  isRespondingToSubject: PropTypes.bool,
  isRestricted: PropTypes.bool,
  isTwoPeopleChannel: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  loading: PropTypes.bool,
  onChessButtonClick: PropTypes.func.isRequired,
  onWordleButtonClick: PropTypes.func.isRequired,
  onHeightChange: PropTypes.func.isRequired,
  onMessageSubmit: PropTypes.func.isRequired,
  onSelectVideoButtonClick: PropTypes.func.isRequired,
  onSetTextAreaHeight: PropTypes.func.isRequired,
  replyTarget: PropTypes.object,
  recepientId: PropTypes.number,
  socketConnected: PropTypes.bool,
  subchannelId: PropTypes.number,
  subjectId: PropTypes.number,
  subjectObj: PropTypes.object
};

const deviceIsMobile = isMobile(navigator);

export default function MessageInput({
  selectedChannelId = 0,
  innerRef,
  inputState,
  isBanned,
  isRestricted,
  isRespondingToSubject,
  isTwoPeopleChannel,
  loading,
  onChessButtonClick,
  onWordleButtonClick,
  onHeightChange,
  onMessageSubmit,
  onSelectVideoButtonClick,
  onSetTextAreaHeight,
  replyTarget,
  recepientId,
  socketConnected,
  subchannelId,
  subjectId,
  subjectObj
}) {
  const textForThisChannel = useMemo(
    () =>
      inputState[
        'chat' + selectedChannelId + (subchannelId ? `/${subchannelId}` : '')
      ]?.text || '',
    [inputState, selectedChannelId, subchannelId]
  );
  const [inputText, setInputText] = useState(textForThisChannel);
  const { banned, fileUploadLvl } = useKeyContext((v) => v.myState);
  const {
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor }
  } = useKeyContext((v) => v.theme);
  const {
    actions: { onEnterComment, onSetIsRespondingToSubject, onSetReplyTarget }
  } = useContext(LocalContext);
  const FileInputRef = useRef(null);
  const prevChannelId = useRef(selectedChannelId);
  const prevSubchannelId = useRef(subchannelId);
  const maxSize = useMemo(
    () => returnMaxUploadSize(fileUploadLvl),
    [fileUploadLvl]
  );
  const textRef = useRef(textForThisChannel);
  const inputCoolingDown = useRef(false);
  const timerRef = useRef(null);
  const timerRef2 = useRef(null);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [fileObj, setFileObj] = useState(null);
  const [uploadModalShown, setUploadModalShown] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);
  const textIsEmpty = useMemo(() => stringIsEmpty(inputText), [inputText]);

  useEffect(() => {
    if (
      prevChannelId.current !== selectedChannelId ||
      prevSubchannelId.current !== subchannelId
    ) {
      onEnterComment({
        contentType: 'chat',
        contentId: prevChannelId.current,
        subId: subchannelId,
        text: textRef.current
      });
      handleSetText('');
    }
    prevChannelId.current = selectedChannelId;
    prevSubchannelId.current = subchannelId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId, subchannelId]);

  useEffect(() => {
    handleSetText(textForThisChannel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textForThisChannel]);

  useEffect(() => {
    const inputHeight = innerRef.current?.clientHeight;
    if (!loading) {
      onHeightChange(inputHeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [innerRef, loading]);

  useEffect(() => {
    if (!deviceIsMobile) {
      innerRef.current.focus();
    }
  }, [selectedChannelId, subchannelId, innerRef]);

  const messageExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        inputType: 'message',
        contentType: 'chat',
        text: inputText
      }),
    [inputText]
  );

  useEffect(() => {
    return function saveTextBeforeUnmount() {
      onEnterComment({
        contentType: 'chat',
        contentId: prevChannelId.current,
        subId: subchannelId,
        text: textRef.current
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMsg = useCallback(async () => {
    if (!socketConnected || inputCoolingDown.current) {
      if (inputCoolingDown.current) {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setCoolingDown(false);
          inputCoolingDown.current = false;
        }, 700);
      }
      return;
    }
    setCoolingDown(true);
    inputCoolingDown.current = true;
    timerRef.current = setTimeout(() => {
      setCoolingDown(false);
      inputCoolingDown.current = false;
    }, 500);
    if (banned?.chat) {
      return;
    }
    innerRef.current.focus();
    if (stringIsEmpty(inputText)) return;
    try {
      if (selectedChannelId === 0) {
        handleSetText('');
      }
      await onMessageSubmit({
        message: finalizeEmoji(inputText),
        subchannelId
      });
      handleSetText('');
      onEnterComment({
        contentType: 'chat',
        contentId: selectedChannelId,
        subId: subchannelId,
        text: ''
      });
    } catch (error) {
      console.error(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    banned?.chat,
    selectedChannelId,
    subchannelId,
    innerRef,
    onEnterComment,
    onMessageSubmit,
    socketConnected,
    inputText
  ]);

  const handleSetText = (newText) => {
    setInputText(newText);
    clearTimeout(timerRef2.current);
    timerRef2.current = setTimeout(() => {
      onEnterComment({
        contentType: 'chat',
        contentId: selectedChannelId,
        subId: subchannelId,
        text: newText
      });
    }, 700);
    textRef.current = newText;
  };

  const handleKeyDown = useCallback(
    (event) => {
      const shiftKeyPressed = event.shiftKey;
      const enterKeyPressed = event.keyCode === 13;
      if (
        enterKeyPressed &&
        !deviceIsMobile &&
        !shiftKeyPressed &&
        !messageExceedsCharLimit &&
        !loading
      ) {
        event.preventDefault();
        handleSendMsg();
      }
      if (enterKeyPressed && shiftKeyPressed) {
        onHeightChange(innerRef.current?.clientHeight + 20);
      }
    },
    [handleSendMsg, innerRef, loading, messageExceedsCharLimit, onHeightChange]
  );

  const handleImagePaste = useCallback(
    (file) => {
      if (file.size / mb > maxSize) {
        return setAlertModalShown(true);
      }
      setFileObj(file);
      setUploadModalShown(true);
    },
    [maxSize]
  );

  const handleUpload = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (file.size / mb > maxSize) {
        return setAlertModalShown(true);
      }
      setFileObj(file);
      setUploadModalShown(true);
      event.target.value = null;
    },
    [maxSize]
  );

  const handleChange = useCallback(
    (event) => {
      setTimeout(() => {
        onHeightChange(innerRef.current?.clientHeight);
      }, 0);
      handleSetText(event.target.value);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [innerRef, onHeightChange]
  );

  const handlePaste = useCallback(
    (event) => {
      const { items } = event.clipboardData;
      for (let i = 0; i < items.length; i++) {
        if (!items[i].type.includes('image')) continue;
        handleImagePaste(items[i].getAsFile());
      }
    },
    [handleImagePaste]
  );

  const hasWordleButton = useMemo(
    () => selectedChannelId === GENERAL_CHAT_ID && !subchannelId,
    [selectedChannelId, subchannelId]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {isRespondingToSubject ? (
        <TargetSubjectPreview
          channelId={selectedChannelId}
          subjectObj={subjectObj}
          onClose={() =>
            onSetIsRespondingToSubject({
              channelId: selectedChannelId,
              subchannelId,
              isResponding: false
            })
          }
        />
      ) : replyTarget ? (
        <TargetMessagePreview
          replyTarget={replyTarget}
          onClose={() =>
            onSetReplyTarget({
              channelId: selectedChannelId,
              subchannelId,
              target: null
            })
          }
        />
      ) : null}
      <div style={{ display: 'flex' }}>
        <div
          style={{
            margin: '0.2rem 1rem 0.2rem 0',
            display: 'flex',
            alignItems: 'center',
            height: '100%'
          }}
        >
          {isTwoPeopleChannel ? (
            <Button
              disabled={loading || banned?.chess}
              skeuomorphic
              onClick={onChessButtonClick}
              color={buttonColor}
              hoverColor={buttonHoverColor}
            >
              <Icon size="lg" icon={['fas', 'chess']} />
              <span className="desktop" style={{ marginLeft: '0.7rem' }}>
                Chess
              </span>
            </Button>
          ) : hasWordleButton ? (
            <Button
              disabled={loading}
              skeuomorphic
              onClick={onWordleButtonClick}
              color={buttonColor}
              hoverColor={buttonHoverColor}
            >
              W<span className="desktop">ordle</span>
            </Button>
          ) : null}
          {subjectObj?.id && (
            <Button
              disabled={loading}
              style={{
                marginLeft: isTwoPeopleChannel || hasWordleButton ? '0.5rem' : 0
              }}
              skeuomorphic
              onClick={() => {
                onSetIsRespondingToSubject({
                  channelId: selectedChannelId,
                  subchannelId,
                  isResponding: true
                });
                innerRef.current.focus();
              }}
              color={buttonColor}
              hoverColor={buttonHoverColor}
            >
              <Icon icon="comment" />
            </Button>
          )}
        </div>
        <Textarea
          disabled={isRestricted || isBanned}
          innerRef={innerRef}
          minRows={1}
          placeholder={
            isBanned
              ? 'You are banned from using the Chat feature'
              : isRestricted
              ? `Only the administrator can post messages here...`
              : `${enterMessageLabel}...`
          }
          onKeyDown={handleKeyDown}
          value={inputText}
          onChange={handleChange}
          onKeyUp={(event) => {
            if (event.key === ' ') {
              handleSetText(addEmoji(event.target.value));
            }
          }}
          onPaste={handlePaste}
          style={{
            marginRight: '1rem',
            ...(messageExceedsCharLimit?.style || {})
          }}
        />
        {!textIsEmpty && (
          <div
            style={{
              margin: `0.2rem 1rem 0.2rem 0`
            }}
          >
            <Button
              filled
              disabled={loading || !socketConnected || coolingDown}
              color={buttonColor}
              hoverColor={buttonHoverColor}
              onClick={handleSendMsg}
            >
              <Icon size="lg" icon="paper-plane" />
            </Button>
          </div>
        )}
        <AddButtons
          disabled={
            isRestricted || loading || !!banned?.chat || !socketConnected
          }
          onUploadButtonClick={() => FileInputRef.current.click()}
          onSelectVideoButtonClick={onSelectVideoButtonClick}
        />
        {!socketConnected && (
          <Loading
            style={{
              height: 0,
              width: 0,
              position: 'absolute',
              right: '7rem',
              bottom: '3.2rem'
            }}
          />
        )}
        <input
          ref={FileInputRef}
          style={{ display: 'none' }}
          type="file"
          onChange={handleUpload}
        />
      </div>
      {alertModalShown && (
        <AlertModal
          title="File is too large"
          content={`The file size is larger than your limit of ${
            maxSize / mb
          } MB`}
          onHide={() => setAlertModalShown(false)}
        />
      )}
      {uploadModalShown && (
        <UploadModal
          initialCaption={inputText}
          isRespondingToSubject={isRespondingToSubject}
          recepientId={recepientId}
          subjectId={subjectId}
          channelId={selectedChannelId}
          fileObj={fileObj}
          onUpload={() => {
            handleSetText('');
            onSetTextAreaHeight(0);
            setUploadModalShown(false);
          }}
          replyTarget={replyTarget}
          subchannelId={subchannelId}
          onHide={() => setUploadModalShown(false)}
        />
      )}
    </div>
  );
}
