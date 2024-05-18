import React, { useCallback, useMemo } from 'react';
import Textarea from '~/components/Texts/Textarea';
import { addEmoji, exceedsCharLimit } from '~/helpers/stringHelpers';
import localize from '~/constants/localize';
import { mb } from '~/constants/defaultValues';
import { isMobile } from '~/helpers';

const enterMessageLabel = localize('enterMessage');
const deviceIsMobileOS = isMobile(navigator);

export default function InputArea({
  isBanned,
  isRestrictedChannel,
  innerRef,
  inputText,
  loading,
  isAIChannel,
  handleSendMsg,
  onHeightChange,
  handleSetText,
  setAlertModalShown,
  setFileObj,
  setUploadModalShown,
  maxSize
}: {
  isBanned: boolean;
  isRestrictedChannel: boolean;
  innerRef: any;
  inputText: string;
  loading: boolean;
  isAIChannel: boolean;
  handleSendMsg: () => any;
  onHeightChange: (v: number) => any;
  handleSetText: (v: string) => any;
  setAlertModalShown: (v: boolean) => any;
  setFileObj: (file: any) => any;
  setUploadModalShown: (v: boolean) => any;
  maxSize: number;
}) {
  const messageExceedsCharLimit = useCallback(() => {
    return exceedsCharLimit({
      inputType: 'message',
      contentType: 'chat',
      text: inputText
    });
  }, [inputText]);

  const isExceedingCharLimit = useMemo(() => {
    return !!messageExceedsCharLimit();
  }, [messageExceedsCharLimit]);

  const handleKeyDown = useCallback(
    (event: any) => {
      const shiftKeyPressed = event.shiftKey;
      const enterKeyPressed = event.keyCode === 13;
      if (isExceedingCharLimit) return;
      if (
        enterKeyPressed &&
        !deviceIsMobileOS &&
        !shiftKeyPressed &&
        !messageExceedsCharLimit() &&
        !loading
      ) {
        event.preventDefault();
        handleSendMsg();
      }
      if (enterKeyPressed && shiftKeyPressed) {
        onHeightChange(innerRef.current?.clientHeight + 20);
      }
    },
    [
      isExceedingCharLimit,
      handleSendMsg,
      innerRef,
      loading,
      messageExceedsCharLimit,
      onHeightChange
    ]
  );

  const handleChange = useCallback(
    (event: any) => {
      setTimeout(() => {
        onHeightChange(innerRef.current?.clientHeight);
      }, 0);
      handleSetText(event.target.value);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [innerRef, onHeightChange]
  );

  const handleImagePaste = useCallback(
    (file: any) => {
      if (file.size / mb > maxSize) {
        return setAlertModalShown(true);
      }
      setFileObj(file);
      setUploadModalShown(true);
    },
    [maxSize, setAlertModalShown, setFileObj, setUploadModalShown]
  );

  const handlePaste = useCallback(
    (event: any) => {
      const { items } = event.clipboardData;
      for (let i = 0; i < items.length; i++) {
        if (!items[i].type.includes('image')) continue;
        handleImagePaste(items[i].getAsFile());
      }
    },
    [handleImagePaste]
  );

  return (
    <Textarea
      disabled={isRestrictedChannel || isBanned}
      innerRef={innerRef}
      minRows={1}
      placeholder={
        !isAIChannel && isBanned
          ? 'You are banned from chatting with other users on this website...'
          : isRestrictedChannel
          ? `Only the administrator can post messages here...`
          : `${enterMessageLabel}...`
      }
      onKeyDown={handleKeyDown}
      value={inputText}
      onChange={handleChange}
      onKeyUp={(event: any) => {
        if (event.key === ' ') {
          handleSetText(addEmoji(event.target.value));
        }
      }}
      onPaste={handlePaste}
      hasError={isExceedingCharLimit}
      style={{
        width: 'auto',
        flexGrow: 1,
        marginRight: '1rem'
      }}
    />
  );
}
