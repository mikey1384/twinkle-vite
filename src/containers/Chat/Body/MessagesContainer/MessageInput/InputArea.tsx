import React, { useCallback, useMemo, useState } from 'react';
import Textarea from '~/components/Texts/Textarea';
import {
  addEmoji,
  exceedsCharLimit,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import localize from '~/constants/localize';
import { cloudFrontURL, mb } from '~/constants/defaultValues';
import { isMobile } from '~/helpers';
import { useAppContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import ProgressBar from '~/components/ProgressBar';
import AlertModal from '~/components/Modals/AlertModal';

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
  const [isDragging, setIsDragging] = useState(false);
  const [uploadErrorType, setUploadErrorType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);

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

  return (
    <div style={{ position: 'relative', width: '100%' }}>
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
        onDrop={(url) => {
          setIsDragging(false);
          const newText = stringIsEmpty(inputText)
            ? `![](${url})`
            : `${inputText}\n![](${url})`;
          handleSetText(newText);
        }}
        onDragOver={() => {
          setIsDragging(false);
        }}
        onDragEnter={() => {
          setIsDragging(true);
        }}
        onDragLeave={() => {
          setIsDragging(false);
        }}
        hasError={isExceedingCharLimit}
        style={{
          width: 'auto',
          flexGrow: 1,
          marginRight: '1rem',
          border: isDragging ? '2px dashed #00aaff' : 'none',
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
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }
}
