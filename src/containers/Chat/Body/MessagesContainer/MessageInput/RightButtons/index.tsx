import React from 'react';
import DefaultButtons from './DefaultButtons';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext } from '~/contexts';

export default function RightButtons({
  buttonColor,
  currentTransactionId,
  inputText,
  currentlyStreamingAIMsgId,
  isChatBanned,
  isLoading,
  isRestrictedChannel,
  isTradeButtonShown,
  isTwoPeopleChannel,
  isCielChannel,
  isZeroChannel,
  maxSize,
  myId,
  onSetAlertModalShown,
  onSetFileObj,
  onSetTransactionModalShown,
  onSetUploadModalShown,
  onSelectVideoButtonClick,
  selectedChannelId,
  socketConnected
}: {
  buttonColor: string;
  currentTransactionId: number;
  inputText: string;
  currentlyStreamingAIMsgId: number;
  isChatBanned: boolean;
  isLoading: boolean;
  isRestrictedChannel: boolean;
  isTradeButtonShown: boolean;
  isTwoPeopleChannel: boolean;
  isCielChannel: boolean;
  isZeroChannel: boolean;
  maxSize: number;
  myId: number;
  onSelectVideoButtonClick: () => void;
  onSetAlertModalShown: (shown: boolean) => void;
  onSetFileObj: (fileObj: any) => void;
  onSetTransactionModalShown: (shown: boolean) => void;
  onSetUploadModalShown: (shown: boolean) => void;
  selectedChannelId: number;
  socketConnected: boolean;
}) {
  const cancelAIMessage = useAppContext(
    (v) => v.requestHelpers.cancelAIMessage
  );
  const onCancelAIMessage = useChatContext((v) => v.actions.onCancelAIMessage);
  const channelState = useChatContext(
    (v) => v.state.channelsObj[selectedChannelId]
  );
  return isCielChannel || isZeroChannel ? (
    currentlyStreamingAIMsgId ? (
      <Button
        color={buttonColor}
        filled
        onClick={() => {
          const aiMessage =
            channelState?.messagesObj?.[currentlyStreamingAIMsgId];
          const hasContent =
            aiMessage?.content && aiMessage.content.trim().length > 0;

          const shouldRemoveMessage = !hasContent;

          onCancelAIMessage({
            messageId: currentlyStreamingAIMsgId,
            channelId: selectedChannelId,
            topicId: aiMessage?.subjectId,
            shouldRemoveMessage
          });

          cancelAIMessage({
            AIMessageId: currentlyStreamingAIMsgId,
            channelId: selectedChannelId,
            hasContent
          }).catch(() => {
            // Silent fail - user already got immediate feedback
          });
        }}
      >
        <Icon icon="stop" />
      </Button>
    ) : (
      <DefaultButtons
        currentTransactionId={currentTransactionId}
        inputText={inputText}
        isChatBanned={isChatBanned}
        isTradeButtonShown={isTradeButtonShown}
        isLoading={isLoading}
        isRestrictedChannel={isRestrictedChannel}
        isTwoPeopleChannel={isTwoPeopleChannel}
        isAIChannel={isZeroChannel || isCielChannel}
        maxSize={maxSize}
        myId={myId}
        onSelectVideoButtonClick={onSelectVideoButtonClick}
        onSetAlertModalShown={onSetAlertModalShown}
        onSetFileObj={onSetFileObj}
        onSetTransactionModalShown={onSetTransactionModalShown}
        onSetUploadModalShown={onSetUploadModalShown}
        selectedChannelId={selectedChannelId}
        socketConnected={socketConnected}
      />
    )
  ) : (
    <DefaultButtons
      currentTransactionId={currentTransactionId}
      inputText={inputText}
      isChatBanned={isChatBanned}
      isTradeButtonShown={isTradeButtonShown}
      isLoading={isLoading}
      isRestrictedChannel={isRestrictedChannel}
      isTwoPeopleChannel={isTwoPeopleChannel}
      maxSize={maxSize}
      myId={myId}
      onSelectVideoButtonClick={onSelectVideoButtonClick}
      onSetAlertModalShown={onSetAlertModalShown}
      onSetFileObj={onSetFileObj}
      onSetTransactionModalShown={onSetTransactionModalShown}
      onSetUploadModalShown={onSetUploadModalShown}
      selectedChannelId={selectedChannelId}
      socketConnected={socketConnected}
    />
  );
}
