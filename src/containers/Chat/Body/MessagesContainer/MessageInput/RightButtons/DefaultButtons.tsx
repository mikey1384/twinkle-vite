import React from 'react';
import AddButtons from './AddButtons';
import Loading from '~/components/Loading';
import { mb } from '~/constants/defaultValues';

export default function DefaultButtons({
  currentTransactionId,
  isChatBanned,
  isLoading,
  isRestrictedChannel,
  isTradeButtonShown,
  isTwoPeopleChannel,
  isAIChannel,
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
  currentTransactionId: number;
  inputText: string;
  isChatBanned: boolean;
  isLoading: boolean;
  isRestrictedChannel: boolean;
  isTradeButtonShown: boolean;
  isTwoPeopleChannel: boolean;
  isAIChannel?: boolean;
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
  return (
    <>
      <AddButtons
        channelId={selectedChannelId}
        disabled={
          isRestrictedChannel || isLoading || isChatBanned || !socketConnected
        }
        currentTransactionId={currentTransactionId}
        isTradeButtonShown={isTradeButtonShown}
        isAIChannel={isAIChannel}
        myId={myId}
        onFileSelect={handleFileSelect}
        onSelectVideoButtonClick={onSelectVideoButtonClick}
        onSetTransactionModalShown={onSetTransactionModalShown}
        isTwoPeopleChannel={isTwoPeopleChannel}
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
    </>
  );

  function handleFileSelect(file: File) {
    if (file.size / mb > maxSize) {
      return onSetAlertModalShown(true);
    }
    onSetFileObj(file);
    onSetUploadModalShown(true);
  }
}
