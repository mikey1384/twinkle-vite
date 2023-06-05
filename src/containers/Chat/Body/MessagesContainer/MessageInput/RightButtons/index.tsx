import React, { useCallback, useMemo, useRef } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import AddButtons from '../AddButtons';
import Loading from '~/components/Loading';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { mb } from '~/constants/defaultValues';

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
  isZeroChannel,
  maxSize,
  myId,
  onSendMsg,
  onSetAlertModalShown,
  onSetFileObj,
  onSetTransactionModalShown,
  onSetUploadModalShown,
  onSelectVideoButtonClick,
  selectedChannelId,
  socketConnected
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
  isZeroChannel: boolean;
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
}) {
  const textIsEmpty = useMemo(() => stringIsEmpty(inputText), [inputText]);
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
            disabled={isLoading || !socketConnected || coolingDown}
            color={buttonColor}
            hoverColor={buttonHoverColor}
            onClick={onSendMsg}
          >
            <Icon size="lg" icon="paper-plane" />
          </Button>
        </div>
      )}
      <AddButtons
        channelId={selectedChannelId}
        disabled={
          isRestrictedChannel ||
          isZeroChannel ||
          isLoading ||
          isChatBanned ||
          !socketConnected
        }
        currentTransactionId={currentTransactionId}
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
