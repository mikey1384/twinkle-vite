import React, { useEffect, useMemo, useState } from 'react';
import Textarea from '~/components/Texts/Textarea';
import {
  addEmoji,
  exceedsCharLimit,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import localize from '~/constants/localize';
import { cloudFrontURL, mb } from '~/constants/defaultValues';
import { isMobile } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import ProgressBar from '~/components/ProgressBar';
import AlertModal from '~/components/Modals/AlertModal';

const enterMessageLabel = localize('enterMessage');
const deviceIsMobileOS = isMobile(navigator);

export default function InputArea({
  currentTopic,
  isBanned,
  isRestrictedChannel,
  innerRef,
  inputText,
  isOnlyOwnerPostingTopic,
  isOwnerPostingOnly,
  isTwoPeopleChannel,
  isOwner,
  loading,
  isAIChannel,
  isMain,
  partner,
  handleSendMsg,
  onHeightChange,
  handleSetText,
  setAlertModalShown,
  maxSize
}: {
  currentTopic: any;
  isBanned: boolean;
  isRestrictedChannel: boolean;
  isOnlyOwnerPostingTopic: boolean;
  isOwnerPostingOnly: boolean;
  isTwoPeopleChannel: boolean;
  isOwner: boolean;
  isMain: boolean;
  innerRef: any;
  inputText: string;
  loading: boolean;
  partner?: {
    id: number;
    username: string;
  };
  isAIChannel: boolean;
  handleSendMsg: () => any;
  onHeightChange: (v: number) => any;
  handleSetText: (v: string) => any;
  setAlertModalShown: (v: boolean) => any;
  maxSize: number;
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const [uploadErrorType, setUploadErrorType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);

  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        onHeightChange(innerRef.current?.clientHeight);
      }, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onHeightChange, innerRef]);

  const isExceedingCharLimit = useMemo(() => {
    return !!exceedsCharLimit({
      inputType: 'message',
      contentType: 'chat',
      text: inputText
    });
  }, [inputText]);

  const errorModalContent = useMemo(() => {
    switch (uploadErrorType) {
      case 'size':
        return {
          title: 'File too large',
          content: `The file size exceeds the maximum allowed upload size of ${
            maxSize / mb
          } MB.`
        };
      case 'type':
        return {
          title: 'Unsupported file type',
          content:
            'Only image files can be uploaded. Please try again with a different file.'
        };
      default:
        return {
          title: 'Upload error',
          content:
            'An error occurred while trying to upload your file. Please try again.'
        };
    }
  }, [maxSize, uploadErrorType]);

  const inputDisabled = useMemo(() => {
    if (isRestrictedChannel || isBanned) return true;
    if (isOnlyOwnerPostingTopic && !isMain) {
      if (isTwoPeopleChannel && currentTopic?.userId !== userId) {
        return true;
      }
      return !isTwoPeopleChannel && !isOwner;
    }
    if (isOwnerPostingOnly && isMain && !isOwner) {
      return true;
    }
    return false;
  }, [
    isRestrictedChannel,
    isBanned,
    isOnlyOwnerPostingTopic,
    isOwnerPostingOnly,
    isMain,
    isTwoPeopleChannel,
    currentTopic?.userId,
    userId,
    isOwner
  ]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Textarea
        disabled={inputDisabled}
        innerRef={innerRef}
        minRows={1}
        placeholder={getPlaceholder()}
        onKeyDown={handleKeyDown}
        value={inputText}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        onPaste={handlePaste}
        onDrop={handleDrop}
        hasError={isExceedingCharLimit}
        style={{
          width: 'auto',
          flexGrow: 1,
          marginRight:
            (isOnlyOwnerPostingTopic && !isOwner && !isMain) ||
            (isOwnerPostingOnly && !isOwner && isMain)
              ? 0
              : '1rem',
          opacity: uploading ? 0.5 : 1
        }}
      />
      {uploading && (
        <div
          style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            top: 0,
            left: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1
          }}
        >
          <ProgressBar
            progress={Math.ceil(100 * uploadProgress)}
            color={uploadProgress === 1 ? 'green' : undefined}
            style={{ width: '80%' }}
          />
        </div>
      )}
      {uploadErrorType && (
        <AlertModal
          {...errorModalContent}
          onHide={() => setUploadErrorType('')}
        />
      )}
    </div>
  );

  function getPlaceholder() {
    if (!isAIChannel && isBanned) {
      return 'You are banned from chatting with other users on this website...';
    }
    if (isRestrictedChannel) {
      return 'Only the administrator can post messages here...';
    }
    if (isOnlyOwnerPostingTopic && !isMain) {
      if (isTwoPeopleChannel) {
        if (currentTopic.userId !== userId) {
          return `Only ${partner?.username} can post messages on this topic...`;
        }
      } else if (!isOwner) {
        return 'Only the owner can post messages on this topic...';
      }
    }
    if (isOwnerPostingOnly && isMain && !isOwner) {
      return 'Only the owner can post messages on the main chat...';
    }
    return `${enterMessageLabel}...`;
  }
  function handleKeyDown(event: any) {
    const shiftKeyPressed = event.shiftKey;
    const enterKeyPressed = event.keyCode === 13;
    if (isExceedingCharLimit) return;
    if (
      enterKeyPressed &&
      !deviceIsMobileOS &&
      !shiftKeyPressed &&
      !isExceedingCharLimit &&
      !loading
    ) {
      event.preventDefault();
      handleSendMsg();
    }
    if (enterKeyPressed && shiftKeyPressed) {
      onHeightChange(innerRef.current?.clientHeight + 20);
    }
  }

  function handleChange(event: any) {
    setTimeout(() => {
      onHeightChange(innerRef.current?.clientHeight);
    }, 0);
    handleSetText(event.target.value);
  }

  function handleKeyUp(event: any) {
    if (event.key === ' ') {
      handleSetText(addEmoji(event.target.value));
    }
  }

  function handlePaste(event: any) {
    const { items } = event.clipboardData;
    for (let i = 0; i < items.length; i++) {
      if (!items[i].type.includes('image')) continue;
      handleImagePaste(items[i].getAsFile());
    }

    async function handleImagePaste(file: any) {
      if (file.size / mb > maxSize) {
        return setAlertModalShown(true);
      }
      handleUploadFile(file);
    }
  }

  function handleDrop(url: any) {
    const newText = stringIsEmpty(inputText)
      ? `![](${url})`
      : `${inputText}\n![](${url})`;
    handleSetText(newText);
    setTimeout(() => {
      onHeightChange(innerRef.current?.clientHeight);
    }, 0);
  }

  async function handleUploadFile(file: any) {
    if (file.size / mb > maxSize) {
      return setAlertModalShown(true);
    }
    if (!file || !maxSize) return;
    if (file.size / mb > maxSize) {
      return setUploadErrorType('size');
    }
    if (!file.type.startsWith('image/')) {
      return setUploadErrorType('type');
    }
    setUploading(true);
    const filePath = uuidv1();
    try {
      await uploadFile({
        filePath,
        file,
        context: 'embed',
        onUploadProgress: ({
          loaded,
          total
        }: {
          loaded: number;
          total: number;
        }) => {
          setUploadProgress(loaded / total);
        }
      });
      const url = `${cloudFrontURL}/attachments/embed/${filePath}/${encodeURIComponent(
        file.name
      )}`;
      const newText = stringIsEmpty(inputText)
        ? `![](${url})`
        : `${inputText}\n![](${url})`;
      handleSetText(newText);
      setTimeout(() => {
        onHeightChange(innerRef.current?.clientHeight);
      }, 0);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }
}
