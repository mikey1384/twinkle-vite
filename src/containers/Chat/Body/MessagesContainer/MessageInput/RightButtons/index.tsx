import React from 'react';
import DefaultButtons from './DefaultButtons';
import ZeroButtons from './ZeroButtons';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext } from '~/contexts';

export default function RightButtons({
  buttonColor,
  buttonHoverColor,
  currentTransactionId,
  inputText,
  isAuthorizedToChatWithZero,
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
  socketConnected,
  zEnergy
}: {
  buttonColor: string;
  buttonHoverColor: string;
  currentTransactionId: number;
  inputText: string;
  currentlyStreamingAIMsgId: number;
  isAuthorizedToChatWithZero: boolean;
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
  zEnergy: number;
}) {
  const cancelAIMessage = useAppContext(
    (v) => v.requestHelpers.cancelAIMessage
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  return isCielChannel || (isZeroChannel && isAuthorizedToChatWithZero) ? (
    currentlyStreamingAIMsgId ? (
      <Button
        color={buttonColor}
        filled
        onClick={() => {
          cancelAIMessage(currentlyStreamingAIMsgId);
          onSetChannelState({
            channelId: selectedChannelId,
            newState: { currentlyStreamingAIMsgId: null }
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
  ) : isZeroChannel ? (
    <ZeroButtons
      buttonColor={buttonColor}
      buttonHoverColor={buttonHoverColor}
      zEnergy={zEnergy}
    />
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
