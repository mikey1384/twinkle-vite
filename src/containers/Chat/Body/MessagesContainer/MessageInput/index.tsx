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
import UploadFileModal from '../../../Modals/UploadFileModal';
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
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useNotiContext,
  useViewContext
} from '~/contexts';
import LocalContext from '../../../Context';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';
import { useRoleColor } from '~/theme/useRoleColor';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

const deviceIsMobileOS = isMobile(navigator);

interface AiUsageRequirement {
  key: string;
  label: string;
  done: boolean;
  current?: number;
  required?: number;
}

interface AiUsagePolicy {
  dayIndex?: number;
  hasVerifiedEmail: boolean;
  baseRepliesPerDay: number;
  resetPurchasesToday: number;
  resetCost: number;
  repliesPerDay: number;
  repliesToday: number;
  repliesRemaining: number;
  communityFundResetEligibility?: {
    eligible: boolean;
    requirements: AiUsageRequirement[];
  };
}

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
  onOmokButtonClick,
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
  legacyTopicObj,
  onRegisterSetText = () => null,
  onRegisterAiUsagePolicyUpdate = () => null,
  onRegisterAiMessageSaveError = () => null,
  onAiUsagePolicyHeightChange = () => null
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
  onOmokButtonClick: () => any;
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
  onRegisterSetText?: (handler: ((text: string) => void) | null) => void;
  onRegisterAiUsagePolicyUpdate?: (
    handler: ((policy?: AiUsagePolicy | null) => void) | null
  ) => void;
  onRegisterAiMessageSaveError?: (
    handler:
      | ((payload: {
          content?: string;
          error?: any;
          aiUsagePolicy?: AiUsagePolicy | null;
          channelId?: number;
          subchannelId?: number;
          topicId?: number;
        }) => void)
      | null
  ) => void;
  onAiUsagePolicyHeightChange?: (height: number) => void;
}) {
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const banned = useKeyContext((v) => v.myState.banned);
  const fileUploadLvl = useKeyContext((v) => v.myState.fileUploadLvl);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const communityFunds = useKeyContext((v) => v.myState.communityFunds);
  const myId = useKeyContext((v) => v.myState.userId);
  const getZeroCielAiUsagePolicy = useAppContext(
    (v) => v.requestHelpers.getZeroCielAiUsagePolicy
  );
  const purchaseZeroCielAiUsageReset = useAppContext(
    (v) => v.requestHelpers.purchaseZeroCielAiUsageReset
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
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
  const aiInputDisabled = useMemo(
    () => AI_FEATURES_DISABLED && isAIChannel,
    [AI_FEATURES_DISABLED, isAIChannel]
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
  const successRole = useRoleColor('success', { fallback: 'green' });
  const alertRole = useRoleColor('alert', { fallback: 'gold' });
  const buttonRole = useRoleColor('button', { fallback: 'logoBlue' });
  const buttonHoverRole = useRoleColor('buttonHovered', {
    fallback: buttonRole.colorKey
  });
  const successColorKey = successRole.colorKey;
  const alertColorKey = alertRole.colorKey;
  const buttonColorKey = buttonRole.colorKey;
  const buttonHoverColorKey = buttonHoverRole.colorKey || buttonColorKey;
  const themeIsGreen = successRole.themeName === 'green';
  const sendButtonColorKey = themeIsGreen ? alertColorKey : successColorKey;
  const sendButtonHoverColorKey = themeIsGreen
    ? alertColorKey
    : successColorKey;
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
  const [alertModalTitle, setAlertModalTitle] = useState('');
  const [alertModalContent, setAlertModalContent] = useState('');
  const [fileObj, setFileObj] = useState<File | File[] | null>(null);
  const [uploadModalShown, setUploadModalShown] = useState(false);
  const [aiUsagePolicy, setAiUsagePolicy] = useState<AiUsagePolicy | null>(
    null
  );
  const [aiUsagePolicyLoading, setAiUsagePolicyLoading] = useState(false);
  const [aiUsagePolicyLoadFailed, setAiUsagePolicyLoadFailed] =
    useState(false);
  const [aiUsageResetLoading, setAiUsageResetLoading] = useState(false);
  const aiUsagePolicyRef = useRef<AiUsagePolicy | null>(null);
  const aiUsagePolicyCardRef = useRef<HTMLDivElement | null>(null);
  const aiUsagePolicyHeightRef = useRef(0);
  const isAIChannelRef = useRef(false);
  const aiMessageSaveErrorContextRef = useRef({
    selectedChannelId,
    selectedTab,
    subchannelId,
    topicId
  });

  aiUsagePolicyRef.current = aiUsagePolicy;
  isAIChannelRef.current = isAIChannel;
  aiMessageSaveErrorContextRef.current = {
    selectedChannelId,
    selectedTab,
    subchannelId,
    topicId
  };

  useEffect(() => {
    onRegisterSetText(handleSetText);
    return () => onRegisterSetText(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterSetText, selectedChannelId, subchannelId]);

  useEffect(() => {
    onRegisterAiUsagePolicyUpdate(applyConfirmedAiUsagePolicy);
    return () => onRegisterAiUsagePolicyUpdate(null);
  }, [onRegisterAiUsagePolicyUpdate, selectedChannelId, subchannelId]);

  useEffect(() => {
    onRegisterAiMessageSaveError(handleAiMessageSaveError);
    return () => onRegisterAiMessageSaveError(null);
    // handleAiMessageSaveError reads topic/tab state from refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterAiMessageSaveError, selectedChannelId, subchannelId]);

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

  useEffect(() => {
    if (!isAIChannel || !myId) {
      setAiUsagePolicy(null);
      setAiUsagePolicyLoadFailed(false);
      return;
    }
    setAiUsagePolicyLoadFailed(false);
    let cancelled = false;
    refreshAiUsagePolicy({ silent: false, isCancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAIChannel, myId, selectedChannelId]);

  useEffect(() => {
    let animationFrame: number | null = null;
    const reportHeight = () => {
      animationFrame = null;
      reportAiUsagePolicyHeight();
    };
    const scheduleHeightReport = () => {
      if (typeof requestAnimationFrame === 'function') {
        if (animationFrame !== null) {
          cancelAnimationFrame(animationFrame);
        }
        animationFrame = requestAnimationFrame(reportHeight);
        return;
      }
      reportHeight();
    };

    scheduleHeightReport();

    const policyCard = aiUsagePolicyCardRef.current;
    let observer: ResizeObserver | null = null;
    if (policyCard && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(scheduleHeightReport);
      observer.observe(policyCard);
    }

    return () => {
      if (
        animationFrame !== null &&
        typeof cancelAnimationFrame === 'function'
      ) {
        cancelAnimationFrame(animationFrame);
      }
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    aiUsagePolicy,
    aiUsagePolicyLoadFailed,
    aiUsagePolicyLoading,
    aiUsageResetLoading,
    isAIChannel
  ]);

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

  const aiUsageBlocked = useMemo(() => {
    if (!isAIChannel) return false;
    if (!aiUsagePolicy) return true;
    return (
      !aiUsagePolicy.hasVerifiedEmail || aiUsagePolicy.repliesRemaining <= 0
    );
  }, [aiUsagePolicy, isAIChannel]);

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
    if (aiInputDisabled) return;
    if (stringIsEmpty(inputText)) return;

    if (isAICallOngoing) {
      if (inputCoolingDown.current) {
        resetCoolingDown(700);
        return;
      }

      inputCoolingDown.current = true;
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

    const currentAiUsagePolicy = aiUsagePolicyRef.current;
    if (isAIChannelRef.current) {
      if (!currentAiUsagePolicy) {
        setAlertModalTitle('AI Replies');
        setAlertModalContent(
          'Checking AI reply usage. Please try again in a moment.'
        );
        setAlertModalShown(true);
        return;
      }
      if (!currentAiUsagePolicy.hasVerifiedEmail) {
        setAlertModalTitle('Verify Email');
        setAlertModalContent(
          'Please verify your email before using Zero or Ciel AI replies.'
        );
        setAlertModalShown(true);
        return;
      }
      if (currentAiUsagePolicy.repliesRemaining <= 0) {
        setAlertModalTitle('AI Replies');
        setAlertModalContent(
          `You have used all ${currentAiUsagePolicy.repliesPerDay} Zero/Ciel AI replies for today. Reset for ${currentAiUsagePolicy.resetCost.toLocaleString()} coins to keep going.`
        );
        setAlertModalShown(true);
        return;
      }
    }

    if (inputCoolingDown.current) {
      resetCoolingDown(700);
      return;
    }

    // Lock immediately to prevent race condition with rapid clicks
    inputCoolingDown.current = true;

    if (isExceedingCharLimit) {
      inputCoolingDown.current = false;
      return;
    }

    if (!socketConnected || isAIActuallyStreaming) {
      inputCoolingDown.current = false;
      return;
    }

    if (hasInsufficientCoinsForThinkHard) {
      inputCoolingDown.current = false;
      const userCoins = twinkleCoins || 0;
      const availableFunds = communityFunds || 0;
      setAlertModalTitle('Insufficient Coins');
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

    const submittedMessage = finalizeEmoji(inputText);
    try {
      if (selectedChannelId === 0) {
        handleSetText('');
      }
      await onMessageSubmit({
        message: submittedMessage,
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
    } catch (error: any) {
      console.error(error);
      if (selectedChannelId === 0) {
        handleSetText(submittedMessage);
      }
      if (error?.aiUsagePolicy) {
        applyConfirmedAiUsagePolicy(error.aiUsagePolicy);
      }
      if (error?.code?.startsWith?.('zero_ciel_ai_') || error?.message) {
        setAlertModalTitle(
          error?.code === 'zero_ciel_ai_verified_email_required'
            ? 'Verify Email'
            : 'AI Replies'
        );
        setAlertModalContent(error?.message || 'Unable to send AI message.');
        setAlertModalShown(true);
      }
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
    aiInputDisabled,
    banned?.chat,
    selectedChannelId,
    subchannelId,
    innerRef,
    socketConnected,
    inputText
  ]);

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
      {renderAiUsagePolicy()}
      <div style={{ display: 'flex' }}>
        {!isAIChannel &&
          (isTwoPeopleChannel || hasWordleButton || legacyTopicButtonShown) && (
            <LeftButtons
              buttonColor={buttonColorKey}
              buttonHoverColor={buttonHoverColorKey}
              hasWordleButton={hasWordleButton}
              nextDayTimeStamp={nextDayTimeStamp}
              isChessBanned={banned?.chess}
              isRestrictedChannel={isRestrictedChannel}
              isTwoPeopleChannel={isTwoPeopleChannel}
              legacyTopicButtonShown={legacyTopicButtonShown}
              loading={loading}
              onChessButtonClick={onChessButtonClick}
              onOmokButtonClick={onOmokButtonClick}
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
          forcedDisabled={aiInputDisabled}
          forcedPlaceholder={
            aiInputDisabled
              ? isCielChannel
                ? 'Ciel is unavailable.'
                : 'Zero is unavailable.'
              : undefined
          }
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
          onSendMsg={handleSendMsg}
          onHeightChange={onHeightChange}
          onSetText={handleSetText}
        />
        {!aiInputDisabled && !textIsEmpty && isRightButtonsShown && (
          <div
            style={{
              margin: `0.2rem 1rem 0.2rem 0`,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Button
              variant="soft"
              tone="raised"
              disabled={
                loading ||
                !socketConnected ||
                isAIActuallyStreaming ||
                coolingDown ||
                isExceedingCharLimit ||
                hasInsufficientCoinsForThinkHard ||
                aiUsageBlocked
              }
              color={sendButtonColorKey}
              hoverColor={sendButtonHoverColorKey}
              onClick={handleSendMsg}
            >
              <Icon size="lg" icon="paper-plane" />
            </Button>
          </div>
        )}
        {!aiInputDisabled && isRightButtonsShown && (
          <RightButtons
            buttonColor={buttonColorKey}
            currentTransactionId={currentTransactionId}
            inputText={inputText}
            currentlyStreamingAIMsgId={currentlyStreamingAIMsgId}
            isChatBanned={!!banned?.chat}
            isLoading={loading}
            isAiUsageBlocked={aiUsageBlocked}
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
                setAlertModalTitle('');
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
          title={
            alertModalTitle ||
            (alertModalContent ? 'Insufficient Coins' : 'File is too large')
          }
          content={
            alertModalContent ||
            (isAIChannel
              ? `The file size limit for AI chat rooms is 20 MB`
              : `The file size is larger than your limit of ${maxSize / mb} MB`)
          }
          onHide={() => {
            setAlertModalShown(false);
            setAlertModalTitle('');
            setAlertModalContent('');
          }}
        />
      )}
      {uploadModalShown && (
        <UploadFileModal
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
          onAiUsagePolicyUpdate={applyConfirmedAiUsagePolicy}
          onTextMessageSubmit={handleUploadModalTextMessageSubmit}
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

  async function refreshAiUsagePolicy({
    silent = true,
    isCancelled = () => false
  }: {
    silent?: boolean;
    isCancelled?: () => boolean;
  } = {}) {
    if (!isAIChannel || !myId) return;
    if (!silent) {
      setAiUsagePolicyLoading(true);
      setAiUsagePolicyLoadFailed(false);
    }
    try {
      const result = await getZeroCielAiUsagePolicy();
      if (!isCancelled()) {
        setAiUsagePolicy(result?.aiUsagePolicy || null);
        setAiUsagePolicyLoadFailed(false);
      }
    } catch (error) {
      if (!isCancelled()) {
        console.error(error);
        setAiUsagePolicyLoadFailed(true);
      }
    } finally {
      if (!silent && !isCancelled()) {
        setAiUsagePolicyLoading(false);
      }
    }
  }

  async function handlePurchaseAiUsageReset(useCommunityFunds = false) {
    if (aiUsageResetLoading) return;
    setAiUsageResetLoading(true);
    try {
      const result = await purchaseZeroCielAiUsageReset({
        useCommunityFunds
      });
      if (result?.aiUsagePolicy) {
        setAiUsagePolicy(result.aiUsagePolicy);
      }
      if (typeof result?.newBalance === 'number') {
        onSetUserState({
          userId: myId,
          newState: { twinkleCoins: result.newBalance }
        });
      }
      if (typeof result?.communityFunds === 'number') {
        onSetUserState({
          userId: myId,
          newState: { communityFunds: result.communityFunds }
        });
      }
    } catch (error: any) {
      console.error(error);
      if (error?.aiUsagePolicy) {
        applyConfirmedAiUsagePolicy(error.aiUsagePolicy);
      }
      setAlertModalTitle('AI Replies');
      setAlertModalContent(
        error?.message || 'Unable to reset AI replies right now.'
      );
      setAlertModalShown(true);
    } finally {
      setAiUsageResetLoading(false);
    }
  }

  function renderAiUsagePolicy() {
    if (!isAIChannel) return null;
    if (!aiUsagePolicy) {
      return (
        <div
          ref={aiUsagePolicyCardRef}
          className={css`
            margin: 0.4rem 1rem 0;
            padding: 0.8rem 1rem;
            border: 1px solid ${Color.borderGray()};
            border-radius: 8px;
            background: ${Color.white()};
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
            font-size: 1.2rem;
            color: ${Color.darkerGray()};

            @media (max-width: ${mobileMaxWidth}) {
              margin: 0.4rem 0.6rem 0;
              font-size: 1.1rem;
            }
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 1rem;
            `}
          >
            <b>
              {aiUsagePolicyLoadFailed
                ? 'Unable to load Zero/Ciel replies'
                : 'Checking Zero/Ciel replies'}
            </b>
            <Button
              variant="soft"
              disabled={aiUsagePolicyLoading}
              onClick={() => refreshAiUsagePolicy({ silent: false })}
            >
              {aiUsagePolicyLoading ? 'Checking' : 'Refresh'}
            </Button>
          </div>
          {aiUsagePolicyLoadFailed && (
            <span>Refresh to check your reply limit before sending.</span>
          )}
        </div>
      );
    }
    const resetNeeded =
      aiUsagePolicy.hasVerifiedEmail && aiUsagePolicy.repliesRemaining <= 0;
    const communityEligibility =
      aiUsagePolicy.communityFundResetEligibility || null;
    const communityFundResetAvailable = !!communityEligibility?.eligible;

    return (
      <div
        ref={aiUsagePolicyCardRef}
        className={css`
          margin: 0.4rem 1rem 0;
          padding: 0.8rem 1rem;
          border: 1px solid ${Color.borderGray()};
          border-radius: 8px;
          background: ${Color.white()};
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          font-size: 1.2rem;
          color: ${Color.darkerGray()};

          @media (max-width: ${mobileMaxWidth}) {
            margin: 0.4rem 0.6rem 0;
            font-size: 1.1rem;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
          `}
        >
          <b>
            {aiUsagePolicy.hasVerifiedEmail
              ? `${aiUsagePolicy.repliesRemaining}/${aiUsagePolicy.repliesPerDay} Zero/Ciel replies left today`
              : 'Verify your email to use Zero or Ciel AI replies'}
          </b>
          <Button
            variant="soft"
            disabled={aiUsagePolicyLoading}
            onClick={() => refreshAiUsagePolicy({ silent: false })}
          >
            Refresh
          </Button>
        </div>
        {resetNeeded && (
          <div
            className={css`
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              gap: 0.6rem;
            `}
          >
            <span>
              Reset for {aiUsagePolicy.resetCost.toLocaleString()} coins.
            </span>
            <Button
              variant="soft"
              disabled={aiUsageResetLoading}
              onClick={() => handlePurchaseAiUsageReset(false)}
            >
              Use coins
            </Button>
            <Button
              variant="soft"
              disabled={aiUsageResetLoading || !communityFundResetAvailable}
              onClick={() => handlePurchaseAiUsageReset(true)}
            >
              Use community funds
            </Button>
          </div>
        )}
        {resetNeeded && communityEligibility && (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.45rem;
            `}
          >
            {communityEligibility.requirements.map((requirement) => (
              <div
                key={requirement.key}
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.6rem;
                  font-weight: 600;
                  color: ${requirement.done
                    ? Color.green()
                    : Color.darkerGray()};
                `}
              >
                <Icon
                  icon={requirement.done ? 'check' : 'times'}
                  style={{
                    color: requirement.done ? Color.green() : Color.gray()
                  }}
                />
                <span>
                  {requirement.label}
                  {typeof requirement.required === 'number'
                    ? ` (${requirement.current || 0}/${requirement.required})`
                    : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function applyConfirmedAiUsagePolicy(nextPolicy?: AiUsagePolicy | null) {
    if (!isAIChannelRef.current || !nextPolicy) return;
    setAiUsagePolicy((policy) => ({
      ...nextPolicy,
      ...(policy?.communityFundResetEligibility &&
      !nextPolicy.communityFundResetEligibility &&
      (!nextPolicy.dayIndex || nextPolicy.dayIndex === policy.dayIndex)
        ? {
            communityFundResetEligibility:
              policy.communityFundResetEligibility
          }
        : {})
    }));
  }

  function handleAiMessageSaveError({
    content,
    error,
    aiUsagePolicy,
    channelId: sourceChannelId,
    subchannelId: sourceSubchannelId,
    topicId: sourceTopicId
  }: {
    content?: string;
    error?: any;
    aiUsagePolicy?: AiUsagePolicy | null;
    channelId?: number;
    subchannelId?: number;
    topicId?: number;
  }) {
    const {
      selectedChannelId: currentChannelId,
      selectedTab: currentSelectedTab,
      subchannelId: currentSubchannelId,
      topicId: currentContextTopicId
    } = aiMessageSaveErrorContextRef.current;
    const normalizedSourceChannelId = Number(sourceChannelId) || 0;
    if (
      normalizedSourceChannelId &&
      normalizedSourceChannelId !== Number(currentChannelId)
    ) {
      return;
    }
    const normalizedSourceSubchannelId = Number(sourceSubchannelId) || 0;
    if (
      normalizedSourceSubchannelId !== (Number(currentSubchannelId) || 0)
    ) {
      return;
    }
    const normalizedSourceTopicId = Number(sourceTopicId) || 0;
    const sourceIsTopicMessage = normalizedSourceTopicId > 0;
    const currentIsTopicMessage = currentSelectedTab === 'topic';
    if (sourceIsTopicMessage !== currentIsTopicMessage) {
      return;
    }
    if (sourceIsTopicMessage) {
      const currentTopicId = Number(currentContextTopicId) || 0;
      if (!currentTopicId || normalizedSourceTopicId !== currentTopicId) {
        return;
      }
    }
    if (aiUsagePolicy) {
      applyConfirmedAiUsagePolicy(aiUsagePolicy);
    }
    const failedText = typeof content === 'string' ? content : '';
    const restoredDraft = !!failedText && stringIsEmpty(textRef.current);
    if (restoredDraft) {
      handleSetText(failedText);
    }
    const message =
      error?.message ||
      error?.error ||
      'Unable to save this AI message right now.';
    setAlertModalTitle(
      error?.code === 'zero_ciel_ai_verified_email_required'
        ? 'Verify Email'
        : 'AI Replies'
    );
    setAlertModalContent(
      restoredDraft
        ? `${message} Your message was restored so you can try again.`
        : message
    );
    setAlertModalShown(true);
  }

  async function handleUploadModalTextMessageSubmit(params: any) {
    return onMessageSubmit(params);
  }

  function reportAiUsagePolicyHeight() {
    const policyCard = aiUsagePolicyCardRef.current;
    let height = 0;
    if (isAIChannel && policyCard) {
      const { marginBottom, marginTop } = window.getComputedStyle(policyCard);
      height = Math.ceil(
        policyCard.getBoundingClientRect().height +
          getPixelValue(marginTop) +
          getPixelValue(marginBottom)
      );
    }
    if (height !== aiUsagePolicyHeightRef.current) {
      aiUsagePolicyHeightRef.current = height;
      onAiUsagePolicyHeightChange(height);
    }
  }

  function getPixelValue(value: string) {
    const parsedValue = parseFloat(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  function handleSetText(newText: string) {
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
  }
}
