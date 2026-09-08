import React, { useState } from 'react';
import DefaultButtons from './DefaultButtons';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';

export default function RightButtons({
  buttonColor,
  currentTransactionId,
  inputText,
  currentlyStreamingAIMsgId,
  isChatBanned,
  isLoading,
  isAiUsageBlocked,
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
  isAiUsageBlocked?: boolean;
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
  const [cancelRequest, setCancelRequest] = useState<{
    channelId: number;
    messageId: number;
  } | null>(null);
  const cancellingCurrentMessage = Boolean(
    cancelRequest?.channelId === selectedChannelId &&
    cancelRequest.messageId === currentlyStreamingAIMsgId
  );

  const showStopButton = Boolean(
    (isCielChannel || isZeroChannel) && currentlyStreamingAIMsgId
  );

  return (
    <>
      {showStopButton && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '0.2rem 0'
          }}
        >
          <Button
            aria-label="Stop AI response"
            color={buttonColor}
            loading={cancellingCurrentMessage}
            variant="solid"
            onClick={() => {
              const request = {
                messageId: currentlyStreamingAIMsgId,
                channelId: selectedChannelId
              };
              setCancelRequest(request);

              cancelAIMessage({
                AIMessageId: currentlyStreamingAIMsgId
              }).catch(() => {
                setCancelRequest((currentRequest) =>
                  currentRequest?.channelId === request.channelId &&
                  currentRequest.messageId === request.messageId
                    ? null
                    : currentRequest
                );
              });
            }}
          >
            <Icon icon="stop" />
          </Button>
        </div>
      )}
      {/* The upload dialog is portalled outside this wrapper. Hide its trigger
          during a reply without unmounting the dialog or discarding its draft. */}
      <div style={{ display: showStopButton ? 'none' : 'contents' }}>
        <DefaultButtons
          currentTransactionId={currentTransactionId}
          inputText={inputText}
          isChatBanned={isChatBanned}
          isAiUsageBlocked={isAiUsageBlocked}
          isTradeButtonShown={isTradeButtonShown}
          isLoading={isLoading || showStopButton}
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
      </div>
    </>
  );
}
