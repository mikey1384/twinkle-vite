import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ChessTarget from '../ChessTarget';
import AiEnergyCard from '~/components/AiEnergyCard';
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
  GENERAL_CHAT_ID
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
import { mobileMaxWidth } from '~/constants/css';

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
  identityType?: 'verified_email' | 'user';
  isLegacyUnverifiedIdentity?: boolean;
  baseEnergyUnitsPerDay?: number;
  energyLimit?: number;
  energyUsed?: number;
  energyCharged?: number;
  energyOverflow?: number;
  energyRemaining?: number;
  energyPercent?: number;
  energySegments?: number;
  energySegmentsRemaining?: number;
  energyUnitsPerSegment?: number;
  lowEnergyUsed?: number;
  currentMode?: 'full_quality' | 'low_energy';
  lastUsageOverflowed?: boolean;
  communityFundRechargeCoinsToday?: number;
  communityFundRechargeCoinsRemaining?: number;
  communityFundRechargeCoinsDailyCap?: number;
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
  const myId = useKeyContext((v) => v.myState.userId);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const getZeroCielAiUsagePolicy = useAppContext(
    (v) => v.requestHelpers.getZeroCielAiUsagePolicy
  );
  const purchaseZeroCielAiUsageReset = useAppContext(
    (v) => v.requestHelpers.purchaseZeroCielAiUsageReset
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);
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
  const globalAiUsagePolicy = useNotiContext(
    (v) => v.state.todayStats.aiUsagePolicy as AiUsagePolicy | null
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
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
  const [aiUsagePolicyLoadFailed, setAiUsagePolicyLoadFailed] = useState(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setAiUsagePolicyLoading(false);
      return;
    }
    let cancelled = false;
    loadAiUsagePolicy({ isCancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAIChannel, myId, selectedChannelId]);

  useEffect(() => {
    if (!isAIChannel || !globalAiUsagePolicy) return;
    applyConfirmedAiUsagePolicy(globalAiUsagePolicy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalAiUsagePolicy, isAIChannel]);

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
    return false;
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
        setAlertModalTitle('AI Energy');
        setAlertModalContent(
          'Checking AI Energy. Please try again in a moment.'
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
        setAlertModalTitle('AI Energy');
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

  async function loadAiUsagePolicy({
    isCancelled = () => false
  }: {
    isCancelled?: () => boolean;
  } = {}) {
    if (!isAIChannel || !myId) return null;
    if (!isCancelled()) {
      setAiUsagePolicyLoading(true);
    }
    try {
      const result = await getZeroCielAiUsagePolicy();
      const nextPolicy = result?.aiUsagePolicy || null;
      if (!isCancelled()) {
        if (nextPolicy) {
          applyConfirmedAiUsagePolicy(nextPolicy);
        } else {
          setAiUsagePolicy(null);
        }
        setAiUsagePolicyLoadFailed(!nextPolicy);
      }
      return nextPolicy;
    } catch (error) {
      if (!isCancelled()) {
        console.error(error);
        setAiUsagePolicyLoadFailed(true);
      }
      return null;
    } finally {
      if (!isCancelled()) {
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
        applyConfirmedAiUsagePolicy(result.aiUsagePolicy);
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
      setAlertModalTitle('AI Energy');
      setAlertModalContent(
        error?.message || 'Unable to recharge AI Energy right now.'
      );
      setAlertModalShown(true);
    } finally {
      setAiUsageResetLoading(false);
    }
  }

  function renderAiUsagePolicy() {
    if (!isAIChannel) return null;
    if (!aiUsagePolicy) {
      if (!aiUsagePolicyLoadFailed) return null;
      return (
        <div ref={aiUsagePolicyCardRef} className={aiUsagePolicyRetryCls}>
          <div className={aiUsagePolicyRetryTextCls}>
            <b>AI Energy did not load.</b>
            <span>Try again before sending a message.</span>
          </div>
          <Button
            variant="soft"
            tone="raised"
            size="sm"
            color="darkerGray"
            loading={aiUsagePolicyLoading}
            disabled={aiUsagePolicyLoading}
            onClick={() => loadAiUsagePolicy()}
          >
            Try again
          </Button>
        </div>
      );
    }
    const resetNeeded =
      typeof aiUsagePolicy.energyRemaining === 'number' &&
      aiUsagePolicy.energyRemaining <= 0;
    const communityEligibility =
      aiUsagePolicy.communityFundResetEligibility || null;
    return (
      <AiEnergyCard
        variant="inline"
        cardRef={aiUsagePolicyCardRef}
        className={css`
          margin: 0 0 0.7rem;
          @media (max-width: ${mobileMaxWidth}) {
            margin: 0 0 0.5rem;
          }
        `}
        energyPercent={aiUsagePolicy.energyPercent ?? 0}
        energySegments={aiUsagePolicy.energySegments}
        energySegmentsRemaining={aiUsagePolicy.energySegmentsRemaining}
        mode={aiUsagePolicy.currentMode}
        overflowed={aiUsagePolicy.lastUsageOverflowed}
        resetNeeded={resetNeeded}
        resetCost={aiUsagePolicy.resetCost}
        twinkleCoins={twinkleCoins}
        rechargeLoading={aiUsageResetLoading}
        onRecharge={() => handlePurchaseAiUsageReset(false)}
        communityFundsEligible={!!communityEligibility?.eligible}
        communityFundsRequirements={communityEligibility?.requirements}
        onRechargeWithCommunityFunds={
          communityEligibility
            ? () => handlePurchaseAiUsageReset(true)
            : undefined
        }
      />
    );
  }

  function applyConfirmedAiUsagePolicy(nextPolicy?: AiUsagePolicy | null) {
    if (!nextPolicy) return;
    if (globalAiUsagePolicy !== nextPolicy) {
      onUpdateTodayStats({
        newStats: {
          aiUsagePolicy: nextPolicy
        }
      });
    }
    if (!isAIChannelRef.current) return;
    setAiUsagePolicy((policy) => ({
      ...nextPolicy,
      ...(policy?.communityFundResetEligibility &&
      !nextPolicy.communityFundResetEligibility &&
      (!nextPolicy.dayIndex || nextPolicy.dayIndex === policy.dayIndex)
        ? {
            communityFundResetEligibility: policy.communityFundResetEligibility
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
    if (normalizedSourceSubchannelId !== (Number(currentSubchannelId) || 0)) {
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
    setAlertModalTitle('AI Energy');
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

const aiUsagePolicyRetryCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin: 0 0 0.7rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid rgba(148, 163, 184, 0.42);
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.9);

  @media (max-width: ${mobileMaxWidth}) {
    align-items: stretch;
    flex-direction: column;
    margin: 0 0 0.5rem;
    padding: 0.6rem 0.7rem;
  }
`;

const aiUsagePolicyRetryTextCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  color: #475569;
  font-size: 1.1rem;
  line-height: 1.35;

  b {
    color: #334155;
    font-size: 1.15rem;
  }
`;
