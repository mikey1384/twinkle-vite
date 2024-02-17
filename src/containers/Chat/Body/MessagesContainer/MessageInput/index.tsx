import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Textarea from '~/components/Texts/Textarea';
import ChessTarget from '../ChessTarget';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import TargetMessagePreview from '../TargetMessagePreview';
import TargetSubjectPreview from '../TargetSubjectPreview';
import UploadModal from '../../../Modals/UploadModal';
import AlertModal from '~/components/Modals/AlertModal';
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
import { useKeyContext, useNotiContext } from '~/contexts';
import LocalContext from '../../../Context';
import localize from '~/constants/localize';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';

const enterMessageLabel = localize('enterMessage');
const deviceIsMobileOS = isMobile(navigator);

export default function MessageInput({
  currentTransactionId,
  selectedChannelId = 0,
  innerRef,
  inputState,
  inputSubmitDisabled,
  isBanned,
  isRestrictedChannel,
  isRespondingToSubject,
  isTwoPeopleChannel,
  isCielChannel,
  isZeroChannel,
  topicId,
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
  recipientUsername,
  selectedTab,
  socketConnected,
  subchannelId,
  legacyTopicObj
}: {
  currentTransactionId: number;
  selectedChannelId: number;
  innerRef: any;
  inputSubmitDisabled: boolean;
  inputState: any;
  isBanned: boolean;
  isCielChannel: boolean;
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
  recipientId?: number;
  recipientUsername?: string;
  selectedTab: string;
  socketConnected: boolean;
  subchannelId: number;
  topicId: number;
  legacyTopicObj: any;
}) {
  const isAIChannel = useMemo(
    () => isZeroChannel || isCielChannel,
    [isZeroChannel, isCielChannel]
  );
  const textForThisChannel = useMemo(
    () =>
      inputState[
        'chat' + selectedChannelId + (subchannelId ? `/${subchannelId}` : '')
      ]?.text || '',
    [inputState, selectedChannelId, subchannelId]
  );
  const [inputText, setInputText] = useState(textForThisChannel);
  const [coolingDown, setCoolingDown] = useState(false);
  const {
    banned,
    fileUploadLvl,
    zEnergy,
    userId: myId,
    level
  } = useKeyContext((v) => v.myState);
  const {
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor }
  } = useKeyContext((v) => v.theme);
  const { nextDayTimeStamp } = useNotiContext((v) => v.state.todayStats);
  const {
    actions: {
      onEnterComment,
      onSetIsRespondingToSubject,
      onSetChessTarget,
      onSetReplyTarget
    }
  } = useContext(LocalContext);
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

  useEffect(() => {
    if (
      prevChannelId.current !== selectedChannelId ||
      prevSubchannelId.current !== subchannelId
    ) {
      onEnterComment({
        contentType: 'chat',
        contentId: prevChannelId.current,
        targetKey: subchannelId,
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
    if (!deviceIsMobileOS) {
      innerRef.current.focus();
    }
  }, [selectedChannelId, subchannelId, innerRef]);

  const messageExceedsCharLimit = useMemo(() => {
    const result = exceedsCharLimit({
      inputType: 'message',
      contentType: 'chat',
      text: inputText
    });
    return result;
  }, [inputText]);

  const isExceedingCharLimit = useMemo(() => {
    return !!messageExceedsCharLimit;
  }, [messageExceedsCharLimit]);

  useEffect(() => {
    return function saveTextBeforeUnmount() {
      onEnterComment({
        contentType: 'chat',
        contentId: prevChannelId.current,
        targetKey: subchannelId,
        text: textRef.current
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMsg = useCallback(async () => {
    if (isExceedingCharLimit) return;
    if (!socketConnected || inputCoolingDown.current || inputSubmitDisabled) {
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
        subchannelId,
        selectedTab,
        topicId
      });
      handleSetText('');
      onEnterComment({
        contentType: 'chat',
        contentId: selectedChannelId,
        targetKey: subchannelId,
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
        targetKey: subchannelId,
        text: newText
      });
    }, 700);
    textRef.current = newText;
  };

  const handleKeyDown = useCallback(
    (event: any) => {
      const shiftKeyPressed = event.shiftKey;
      const enterKeyPressed = event.keyCode === 13;
      if (isExceedingCharLimit) return;
      if (
        enterKeyPressed &&
        !deviceIsMobileOS &&
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
    [
      isExceedingCharLimit,
      handleSendMsg,
      innerRef,
      loading,
      messageExceedsCharLimit,
      onHeightChange
    ]
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
  const isZeroChannelAndNotAuthorized = useMemo(
    () => isZeroChannel && !zEnergy && level < 2,
    [isZeroChannel, level, zEnergy]
  );

  const textIsEmpty = useMemo(() => stringIsEmpty(inputText), [inputText]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {isRespondingToSubject ? (
        <TargetSubjectPreview
          legacyTopicObj={legacyTopicObj}
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
        {!isAIChannel && selectedTab === 'all' && (
          <LeftButtons
            buttonColor={buttonColor}
            buttonHoverColor={buttonHoverColor}
            hasWordleButton={hasWordleButton}
            nextDayTimeStamp={nextDayTimeStamp}
            isChessBanned={banned?.chess}
            isRestrictedChannel={isRestrictedChannel}
            isTwoPeopleChannel={isTwoPeopleChannel}
            legacyTopicButtonShown={selectedChannelId === GENERAL_CHAT_ID}
            loading={loading}
            onChessButtonClick={onChessButtonClick}
            onTopicButtonClick={() => {
              onSetIsRespondingToSubject({
                channelId: selectedChannelId,
                subchannelId,
                isResponding: true
              });
              innerRef.current.focus();
            }}
            onWordleButtonClick={onWordleButtonClick}
            topicId={legacyTopicObj?.id}
          />
        )}
        <Textarea
          disabled={
            isZeroChannelAndNotAuthorized || isRestrictedChannel || isBanned
          }
          innerRef={innerRef}
          minRows={1}
          placeholder={
            !isAIChannel && isBanned
              ? 'You are banned from chatting with other users on this website...'
              : isRestrictedChannel
              ? `Only the administrator can post messages here...`
              : isZeroChannelAndNotAuthorized
              ? `Your user level needs to be at least 2 to chat with Zero...`
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
          hasError={isExceedingCharLimit}
          style={{
            width: 'auto',
            flexGrow: 1,
            marginRight: '1rem'
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
              disabled={
                loading ||
                !socketConnected ||
                coolingDown ||
                isExceedingCharLimit
              }
              color={buttonColor}
              hoverColor={buttonHoverColor}
              onClick={handleSendMsg}
            >
              <Icon size="lg" icon="paper-plane" />
            </Button>
          </div>
        )}
        <RightButtons
          buttonColor={buttonColor}
          buttonHoverColor={buttonHoverColor}
          currentTransactionId={currentTransactionId}
          inputText={inputText}
          isChatBanned={!!banned?.chat}
          isLoading={loading}
          isTwoPeopleChannel={!!isTwoPeopleChannel}
          isRestrictedChannel={isRestrictedChannel}
          isTradeButtonShown={selectedTab === 'all'}
          isCielChannel={isCielChannel}
          isZeroChannel={isZeroChannel}
          isAuthorizedToChatWithZero={!isZeroChannelAndNotAuthorized}
          maxSize={maxSize}
          myId={myId}
          onSelectVideoButtonClick={onSelectVideoButtonClick}
          onSetAlertModalShown={setAlertModalShown}
          onSetFileObj={setFileObj}
          onSetTransactionModalShown={onSetTransactionModalShown}
          onSetUploadModalShown={setUploadModalShown}
          selectedChannelId={selectedChannelId}
          socketConnected={socketConnected}
          zEnergy={zEnergy}
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
          recipientUsername={recipientUsername}
          topicId={topicId}
          channelId={selectedChannelId}
          fileObj={fileObj}
          onUpload={() => {
            handleSetText('');
            onSetTextAreaHeight(0);
            setUploadModalShown(false);
          }}
          replyTarget={replyTarget}
          selectedTab={selectedTab}
          subchannelId={subchannelId}
          onHide={() => setUploadModalShown(false)}
        />
      )}
    </div>
  );
}
