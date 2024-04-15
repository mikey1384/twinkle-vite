import React, { useCallback, useRef } from 'react';
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
  currentTransactionId: number;
  inputText: string;
  isChatBanned: boolean;
  isLoading: boolean;
  isRestrictedChannel: boolean;
  isTradeButtonShown: boolean;
  isTwoPeopleChannel: boolean;
  isZeroChannel?: boolean;
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
  const FileInputRef: React.RefObject<any> = useRef(null);
  const handleUpload = useCallback(
    (event: any) => {
      const file = event.target.files[0];
      if (file.size / mb > maxSize) {
        return onSetAlertModalShown(true);
      }
      onSetFileObj(file);
      onSetUploadModalShown(true);
      event.target.value = null;
    },
    [maxSize, onSetAlertModalShown, onSetFileObj, onSetUploadModalShown]
  );

  return (
    <>
      <AddButtons
        channelId={selectedChannelId}
        disabled={
          isRestrictedChannel || isLoading || isChatBanned || !socketConnected
        }
        currentTransactionId={currentTransactionId}
        isTradeButtonShown={isTradeButtonShown}
        isZeroChannel={isZeroChannel}
        myId={myId}
        onUploadButtonClick={() => FileInputRef.current.click()}
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
      <input
        ref={FileInputRef}
        style={{ display: 'none' }}
        type="file"
        onChange={handleUpload}
      />
    </>
  );
}
