import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ChessTarget from '../ChessTarget';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import InputArea from './InputArea';
import TargetMessagePreview from '../TargetMessagePreview';
import TargetSubjectPreview from '../TargetSubjectPreview';
import UploadAFileModal from '../../../Modals/UploadAFileModal';
import AlertModal from '~/components/Modals/AlertModal';
import { socket } from '~/constants/sockets/api';
import { isMobile } from '~/helpers';
import {
  stringIsEmpty,
  finalizeEmoji,
  exceedsCharLimit
} from '~/helpers/stringHelpers';
import {
  mb,
  returnMaxUploadSize,
  GENERAL_CHAT_ID,
  priceTable
} from '~/constants/defaultValues';
import { useChatContext, useKeyContext, useNotiContext } from '~/contexts';
import LocalContext from '../../../Context';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';

const deviceIsMobileOS = isMobile(navigator);

export default function MessageInput({
  currentTransactionId,
  currentTopic,
  selectedChannelId = 0,
  innerRef,
  inputState,
  currentlyStreamingAIMsgId,
  isBanned,
  isRestrictedChannel,
  isRespondingToSubject,
  isTwoPeopleChannel,
  isCielChannel,
  isZeroChannel,
  isOnlyOwnerPostingTopic,
  isOwnerPostingOnly,
  isOwner,
  topicId,
  loading,
  onChessButtonClick,
  onWordleButtonClick,
  onHeightChange,
  onMessageSubmit,
  onScrollToBottom,
  onSelectVideoButtonClick,
  onSetTransactionModalShown,
  onSetTextAreaHeight,
  partner,
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
  currentTopic: any;
  selectedChannelId: number;
  innerRef: any;
  currentlyStreamingAIMsgId: number;
  inputState: any;
  isBanned: boolean;
  isCielChannel: boolean;
  isZeroChannel: boolean;
  isOwner: boolean;
  isRestrictedChannel: boolean;
  isRespondingToSubject: boolean;
  isTwoPeopleChannel: number | boolean;
  isOnlyOwnerPostingTopic: boolean;
  isOwnerPostingOnly: boolean;
  loading: boolean;
  onChessButtonClick: () => any;
  onWordleButtonClick: () => any;
  onHeightChange: (v: number) => any;
  onMessageSubmit: (v: any) => any;
  onScrollToBottom: () => any;
  onSelectVideoButtonClick: () => any;
  onSetTextAreaHeight: (v: number) => any;
  onSetTransactionModalShown: (v: boolean) => any;
  partner?: {
    id: number;
    username: string;
  };
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
  const banned = useKeyContext((v) => v.myState.banned);
  const fileUploadLvl = useKeyContext((v) => v.myState.fileUploadLvl);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const communityFunds = useKeyContext((v) => v.myState.communityFunds);
  const myId = useKeyContext((v) => v.myState.userId);
  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);
  const thinkHardState = useChatContext((v) => v.state.thinkHard);
  const channelState =
    useChatContext((v) => v.state.channelsObj[selectedChannelId]) || {};
  const isAICallOngoing = useMemo(
    () => aiCallChannelId === selectedChannelId,
    [aiCallChannelId, selectedChannelId]
  );
  const isAIChannel = useMemo(
    () => isZeroChannel || isCielChannel,
    [isZeroChannel, isCielChannel]
  );
  const isAIActuallyStreaming = useMemo(() => {
    if (!currentlyStreamingAIMsgId) return false;
    return !channelState?.cancelledMessageIds?.has(currentlyStreamingAIMsgId);
  }, [currentlyStreamingAIMsgId, channelState?.cancelledMessageIds]);

  const currentThinkHard = useMemo(() => {
    if (isCielChannel) {
      return thinkHardState.ciel[topicId] ?? thinkHardState.ciel.global;
    }
    if (isZeroChannel) {
      return thinkHardState.zero[topicId] ?? thinkHardState.zero.global;
    }
    return false;
  }, [isCielChannel, isZeroChannel, thinkHardState, topicId]);

  const hasInsufficientCoinsForThinkHard = useMemo(() => {
    if (!isAIChannel || !currentThinkHard) return false;
    const userHasEnoughCoins = (twinkleCoins || 0) >= priceTable.thinkHard;
    const communityCanCover = (communityFunds || 0) >= priceTable.thinkHard;
    return !userHasEnoughCoins && !communityCanCover;
  }, [isAIChannel, currentThinkHard, twinkleCoins, communityFunds]);

  const textForThisChannel = useMemo(
    () =>
      inputState[
        'chat' + selectedChannelId + (subchannelId ? `/${subchannelId}` : '')
      ]?.text || '',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedChannelId, subchannelId]
  );
  const [inputText, setInputText] = useState(textForThisChannel);
  const [coolingDown, setCoolingDown] = useState(false);
  const buttonColor = useKeyContext((v) => v.theme.button.color);
  const buttonHoverColor = useKeyContext((v) => v.theme.buttonHovered.color);
  const nextDayTimeStamp = useNotiContext(
    (v) => v.state.todayStats.nextDayTimeStamp
  );
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
    () => (isAIChannel ? 20 * mb : returnMaxUploadSize(fileUploadLvl)),
    [fileUploadLvl, isAIChannel]
  );
  const textRef = useRef(textForThisChannel);
  const inputCoolingDown = useRef(false);
  const timerRef: React.RefObject<any> = useRef(null);
  const timerRef2: React.RefObject<any> = useRef(null);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [alertModalContent, setAlertModalContent] = useState('');
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
      innerRef.current?.focus();
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
    if (stringIsEmpty(inputText)) return;

    if (inputCoolingDown.current) {
      resetCoolingDown(700);
      return;
    }

    if (isAICallOngoing) {
      socket.emit('ai_call_message_submit', {
        message: finalizeEmoji(inputText),
        topicId: selectedTab === 'topic' ? topicId : undefined,
        channelId: selectedChannelId
      });

      startCoolingDown(500);
      handleSetText('');
      onSetTextAreaHeight(0);
      return;
    }

    if (isExceedingCharLimit) return;

    if (!socketConnected || isAIActuallyStreaming) {
      return;
    }

    if (hasInsufficientCoinsForThinkHard) {
      const userCoins = twinkleCoins || 0;
      const availableFunds = communityFunds || 0;
      setAlertModalContent(
        `Not enough Twinkle Coins for Think Hard mode. You need ${priceTable.thinkHard} coins. ` +
          `You have ${userCoins} coins and community funds have ${availableFunds} coins.`
      );
      setAlertModalShown(true);
      return;
    }

    startCoolingDown(500);

    if (banned?.chat) return;

    innerRef.current?.focus();

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

    function resetCoolingDown(delay = 500) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCoolingDown(false);
        inputCoolingDown.current = false;
      }, delay);
    }

    function startCoolingDown(delay = 500) {
      setCoolingDown(true);
      inputCoolingDown.current = true;
      resetCoolingDown(delay);
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

  const hasWordleButton = useMemo(
    () => selectedChannelId === GENERAL_CHAT_ID && !subchannelId,
    [selectedChannelId, subchannelId]
  );

  const textIsEmpty = useMemo(() => stringIsEmpty(inputText), [inputText]);
  const isRightButtonsShown = useMemo(() => {
    if (isAICallOngoing) {
      return false;
    }
    if (isOwner) {
      return true;
    }
    if (selectedTab === 'all' && isOwnerPostingOnly) {
      return false;
    }
    if (isOnlyOwnerPostingTopic) {
      if (isTwoPeopleChannel) {
        return currentTopic?.userId === myId;
      } else {
        return false;
      }
    }
    return true;
  }, [
    isAICallOngoing,
    isOwner,
    selectedTab,
    isOwnerPostingOnly,
    isOnlyOwnerPostingTopic,
    isTwoPeopleChannel,
    currentTopic?.userId,
    myId
  ]);

  const legacyTopicButtonShown = useMemo(
    () => selectedChannelId === GENERAL_CHAT_ID && !!legacyTopicObj?.id,
    [selectedChannelId, legacyTopicObj]
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
        {!isAIChannel &&
          (isTwoPeopleChannel || hasWordleButton || legacyTopicButtonShown) && (
            <LeftButtons
              buttonColor={buttonColor}
              buttonHoverColor={buttonHoverColor}
              hasWordleButton={hasWordleButton}
              nextDayTimeStamp={nextDayTimeStamp}
              isChessBanned={banned?.chess}
              isRestrictedChannel={isRestrictedChannel}
              isTwoPeopleChannel={isTwoPeopleChannel}
              legacyTopicButtonShown={legacyTopicButtonShown}
              loading={loading}
              onChessButtonClick={onChessButtonClick}
              onTopicButtonClick={() => {
                onSetIsRespondingToSubject({
                  channelId: selectedChannelId,
                  subchannelId,
                  isResponding: true
                });
                innerRef.current?.focus();
              }}
              onWordleButtonClick={onWordleButtonClick}
              topicId={legacyTopicObj?.id}
            />
          )}
        <InputArea
          currentTopic={currentTopic}
          isBanned={isBanned}
          isRestrictedChannel={isRestrictedChannel}
          isTwoPeopleChannel={!!isTwoPeopleChannel}
          isOnlyOwnerPostingTopic={isOnlyOwnerPostingTopic}
          isOwnerPostingOnly={isOwnerPostingOnly}
          isOwner={isOwner}
          innerRef={innerRef}
          inputText={inputText}
          isMain={selectedTab !== 'topic'}
          loading={loading}
          partner={partner}
          isAIChannel={isAIChannel}
          handleSendMsg={handleSendMsg}
          onHeightChange={onHeightChange}
          onSetText={handleSetText}
          onSetAlertModalShown={(shown: boolean) => {
            if (shown) {
              setAlertModalContent('');
            }
            setAlertModalShown(shown);
          }}
          maxSize={maxSize}
        />
        {!textIsEmpty && isRightButtonsShown && (
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
                isAIActuallyStreaming ||
                coolingDown ||
                isExceedingCharLimit ||
                hasInsufficientCoinsForThinkHard
              }
              color={buttonColor}
              hoverColor={buttonHoverColor}
              onClick={handleSendMsg}
            >
              <Icon size="lg" icon="paper-plane" />
            </Button>
          </div>
        )}
        {isRightButtonsShown && (
          <RightButtons
            buttonColor={buttonColor}
            currentTransactionId={currentTransactionId}
            inputText={inputText}
            currentlyStreamingAIMsgId={currentlyStreamingAIMsgId}
            isChatBanned={!!banned?.chat}
            isLoading={loading}
            isTwoPeopleChannel={!!isTwoPeopleChannel}
            isRestrictedChannel={isRestrictedChannel}
            isTradeButtonShown={selectedTab === 'all'}
            isCielChannel={isCielChannel}
            isZeroChannel={isZeroChannel}
            maxSize={maxSize}
            myId={myId}
            onSelectVideoButtonClick={onSelectVideoButtonClick}
            onSetAlertModalShown={(shown: boolean) => {
              if (shown) {
                setAlertModalContent('');
              }
              setAlertModalShown(shown);
            }}
            onSetFileObj={setFileObj}
            onSetTransactionModalShown={onSetTransactionModalShown}
            onSetUploadModalShown={setUploadModalShown}
            selectedChannelId={selectedChannelId}
            socketConnected={socketConnected}
          />
        )}
      </div>
      {alertModalShown && (
        <AlertModal
          title={alertModalContent ? 'Insufficient Coins' : 'File is too large'}
          content={
            alertModalContent ||
            (isAIChannel
              ? `The file size limit for AI chat rooms is 20 MB`
              : `The file size is larger than your limit of ${maxSize / mb} MB`)
          }
          onHide={() => {
            setAlertModalShown(false);
            setAlertModalContent('');
          }}
        />
      )}
      {uploadModalShown && (
        <UploadAFileModal
          initialCaption={inputText}
          isRespondingToSubject={isRespondingToSubject}
          isCielChat={isCielChannel}
          isZeroChat={isZeroChannel}
          recipientId={recipientId}
          recipientUsername={recipientUsername}
          topicId={topicId}
          channelId={selectedChannelId}
          fileObj={fileObj}
          onEmbed={(text: string) => {
            setUploadModalShown(false);
            handleSetText(text);
            setTimeout(() => {
              onHeightChange(innerRef.current?.clientHeight);
            }, 0);
            setTimeout(() => {
              onHeightChange(innerRef.current?.clientHeight);
            }, 10);
          }}
          onScrollToBottom={onScrollToBottom}
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
