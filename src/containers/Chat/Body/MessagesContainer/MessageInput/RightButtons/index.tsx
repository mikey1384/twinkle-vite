import React from 'react';
import DefaultButtons from './DefaultButtons';
import ZeroButtons from './ZeroButtons';

export default function RightButtons({
  buttonColor,
  buttonHoverColor,
  coolingDown,
  currentTransactionId,
  inputText,
  isChatBanned,
  isLoading,
  isRestrictedChannel,
  isTwoPeopleChannel,
  isAIChannel,
  maxSize,
  myId,
  onSendMsg,
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
  coolingDown: boolean;
  currentTransactionId: number;
  inputText: string;
  isChatBanned: boolean;
  isLoading: boolean;
  isRestrictedChannel: boolean;
  isTwoPeopleChannel: boolean;
  isAIChannel: boolean;
  maxSize: number;
  myId: number;
  onSelectVideoButtonClick: () => void;
  onSendMsg: () => void;
  onSetAlertModalShown: (shown: boolean) => void;
  onSetFileObj: (fileObj: any) => void;
  onSetTransactionModalShown: (shown: boolean) => void;
  onSetUploadModalShown: (shown: boolean) => void;
  selectedChannelId: number;
  socketConnected: boolean;
  zEnergy: number;
}) {
  return isAIChannel ? (
    <ZeroButtons
      buttonColor={buttonColor}
      buttonHoverColor={buttonHoverColor}
      zEnergy={zEnergy}
    />
  ) : (
    <DefaultButtons
      buttonColor={buttonColor}
      buttonHoverColor={buttonHoverColor}
      coolingDown={coolingDown}
      currentTransactionId={currentTransactionId}
      inputText={inputText}
      isChatBanned={isChatBanned}
      isLoading={isLoading}
      isRestrictedChannel={isRestrictedChannel}
      isTwoPeopleChannel={isTwoPeopleChannel}
      maxSize={maxSize}
      myId={myId}
      onSelectVideoButtonClick={onSelectVideoButtonClick}
      onSendMsg={onSendMsg}
      onSetAlertModalShown={onSetAlertModalShown}
      onSetFileObj={onSetFileObj}
      onSetTransactionModalShown={onSetTransactionModalShown}
      onSetUploadModalShown={onSetUploadModalShown}
      selectedChannelId={selectedChannelId}
      socketConnected={socketConnected}
    />
  );
}
