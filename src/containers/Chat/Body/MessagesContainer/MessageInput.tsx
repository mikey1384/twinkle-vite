import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ChessTarget from './ChessTarget';
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

const deviceIsMobile = isMobile(navigator);

interface Props {
  currentTransactionId: number;
  selectedChannelId: number;
  innerRef: any;
  inputState: any;
  isBanned: boolean;
  isZeroChannel: boolean;
  isRestrictedChannel: boolean;
  isRespondingToSubject: boolean;
  isTwoPeopleChannel: number | boolean;
  loading: boolean;
  onChessButtonClick: () => any;
  onWordleButtonClick: () => any;
  onHeightChange: (v: number) => any;
  onMessageSubmit: (v: any) => any;
  onSelectVideoButtonClick: () => any;
  onSetTextAreaHeight: (v: number) => any;
  onSetTransactionModalShown: (v: boolean) => any;
  chessTarget: any;
  replyTarget: any;
  recipientId: number;
  socketConnected: boolean;
  subchannelId: number;
  subjectId: number;
  subjectObj: any;
}
export default function MessageInput({
  currentTransactionId,
  selectedChannelId = 0,
  innerRef,
  inputState,
  isBanned,
  isZeroChannel,
  isRestrictedChannel,
  isRespondingToSubject,
  isTwoPeopleChannel,
  loading,
  onChessButtonClick,
  onWordleButtonClick,
  onHeightChange,
  onMessageSubmit,
  onSelectVideoButtonClick,
  onSetTransactionModalShown,
  onSetTextAreaHeight,
  chessTarget,
  replyTarget,
  recipientId,
  socketConnected,
  subchannelId,
  subjectId,
  subjectObj
}: Props) {
  const textForThisChannel = useMemo(
    () =>
      inputState[
        'chat' + selectedChannelId + (subchannelId ? `/${subchannelId}` : '')
      ]?.text || '',
    [inputState, selectedChannelId, subchannelId]
  );
  const [inputText, setInputText] = useState(textForThisChannel);
  const {
    banned,
    fileUploadLvl,
    userId: myId
  } = useKeyContext((v) => v.myState);
  const {
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor }
  } = useKeyContext((v) => v.theme);
  const {
    actions: {
      onEnterComment,
      onSetIsRespondingToSubject,
      onSetChessTarget,
      onSetReplyTarget
    }
  } = useContext(LocalContext);
  const FileInputRef: React.RefObject<any> = useRef(null);
  const prevChannelId = useRef(selectedChannelId);
  const prevSubchannelId = useRef(subchannelId);
  const maxSize = useMemo(
    () => returnMaxUploadSize(fileUploadLvl),
    [fileUploadLvl]
  );
  const textRef = useRef(textForThisChannel);
  const inputCoolingDown = useRef(false);
  const timerRef: React.MutableRefObject<any> = useRef(null);
  const timerRef2: React.MutableRefObject<any> = useRef(null);
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

  const handleSetText = (newText: string) => {
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
    (event: any) => {
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
    (file: any) => {
      if (file.size / mb > maxSize) {
        return setAlertModalShown(true);
      }
      setFileObj(file);
      setUploadModalShown(true);
    },
    [maxSize]
  );

  const handleUpload = useCallback(
    (event: any) => {
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
    (event: any) => {
      setTimeout(() => {
        onHeightChange(innerRef.current?.clientHeight);
      }, 0);
      handleSetText(event.target.value);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [innerRef, onHeightChange]
  );

  const handlePaste = useCallback(
    (event: any) => {
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
      ) : chessTarget ? (
        <ChessTarget
          myId={myId}
          channelId={selectedChannelId}
          chessTarget={chessTarget}
          onClose={() =>
            onSetChessTarget({
              channelId: selectedChannelId,
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
            alignItems: 'center'
          }}
        >
          {isTwoPeopleChannel ? (
            <Button
              disabled={
                loading || banned?.chess || isZeroChannel || isRestrictedChannel
              }
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
              <Icon
                size={isTwoPeopleChannel || hasWordleButton ? null : 'lg'}
                icon="comment"
              />
            </Button>
          )}
        </div>
        <Textarea
          disabled={isZeroChannel || isRestrictedChannel || isBanned}
          innerRef={innerRef}
          minRows={1}
          placeholder={
            isBanned
              ? 'You are banned from using the Chat feature'
              : isRestrictedChannel
              ? `Only the administrator can post messages here...`
              : isZeroChannel
              ? `Zero cannot chat yet. Leave a message on his profile page`
              : `${enterMessageLabel}...`
          }
          onKeyDown={handleKeyDown}
          value={inputText}
          onChange={handleChange}
          onKeyUp={(event: any) => {
            if (event.key === ' ') {
              handleSetText(addEmoji(event.target.value));
            }
          }}
          onPaste={handlePaste}
          style={{
            width: 'auto',
            flexGrow: 1,
            marginRight: '1rem',
            ...(messageExceedsCharLimit?.style || {})
          }}
        />
        {!textIsEmpty && (
          <div
            style={{
              margin: `0.2rem 1rem 0.2rem 0`,
              display: 'flex',
              alignItems: 'center'
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
          channelId={selectedChannelId}
          disabled={
            isRestrictedChannel ||
            isZeroChannel ||
            loading ||
            !!banned?.chat ||
            !socketConnected
          }
          currentTransactionId={currentTransactionId}
          myId={myId}
          onUploadButtonClick={() => FileInputRef.current.click()}
          onSelectVideoButtonClick={onSelectVideoButtonClick}
          onSetTransactionModalShown={onSetTransactionModalShown}
          isTwoPeopleChannel={!!isTwoPeopleChannel}
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
          recipientId={recipientId}
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
