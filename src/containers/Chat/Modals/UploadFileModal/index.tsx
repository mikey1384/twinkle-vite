import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import ExtractedThumb from '~/components/ExtractedThumb';
import FileInfo from './FileInfo';
import { returnImageFileFromUrl } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import {
  exceedsCharLimit,
  finalizeEmoji,
  getFileInfoFromFileName,
  generateFileName
} from '~/helpers/stringHelpers';
import LocalContext from '../../Context';
import ThumbnailPicker from '~/components/ThumbnailPicker';
import {
  needsImageConversion,
  convertToWebFriendlyFormat
} from '~/helpers/imageHelpers';
import AlertModal from '~/components/Modals/AlertModal';
import { mb, returnMaxUploadSize } from '~/constants/defaultValues';

function UploadFileModal({
  initialCaption = '',
  isRespondingToSubject,
  isCielChat,
  isZeroChat,
  channelId,
  fileObj,
  onEmbed,
  onHide,
  onScrollToBottom,
  onUpload,
  replyTarget,
  recipientId,
  recipientUsername,
  selectedTab,
  topicId,
  subchannelId
}: {
  initialCaption?: string;
  isRespondingToSubject?: boolean;
  isCielChat?: boolean;
  isZeroChat?: boolean;
  channelId?: number;
  fileObj?: any;
  onEmbed: (text: string) => any;
  onHide: () => any;
  onScrollToBottom: () => any;
  onUpload: () => any;
  recipientId?: number;
  recipientUsername?: string;
  replyTarget?: any;
  selectedTab?: string;
  topicId?: number;
  subchannelId?: number;
}) {
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const fileUploadLvl = useKeyContext((v) => v.myState.fileUploadLvl);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const {
    onFileUpload,
    actions: { onSubmitMessage }
  } = useContext(LocalContext);
  const saveFileData = useAppContext((v) => v.requestHelpers.saveFileData);
  const checkIfAIFileSupported = useAppContext(
    (v) => v.requestHelpers.checkIfAIFileSupported
  );
  const [caption, setCaption] = useState(initialCaption);
  const [imageUrl, setImageUrl] = useState('');
  const [videoSrc, setVideoSrc] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [aiFileNotSupported, setAiFileNotSupported] = useState(false);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const maxSize = useMemo(
    () => returnMaxUploadSize(fileUploadLvl),
    [fileUploadLvl]
  );
  const { fileType: originalFileType } = useMemo(
    () => getFileInfoFromFileName(fileObj.name),
    [fileObj.name]
  );
  // Track effective file type - may differ from original if conversion succeeded
  const [effectiveFileType, setEffectiveFileType] = useState(originalFileType);

  useEffect(() => {
    if (originalFileType === 'video') {
      const url = URL.createObjectURL(fileObj);
      setVideoSrc(url);
    }
  }, [fileObj, originalFileType]);

  useEffect(() => {
    async function processConvertibleImage() {
      // Check if image needs conversion (HEIC, TIFF, AVIF, etc.) BEFORE fileType check
      // These formats may not be classified as 'image' but are images that need conversion
      if (needsImageConversion(fileObj.name)) {
        try {
          const { file: convertedFile, dataUrl, converted } =
            await convertToWebFriendlyFormat(fileObj);
          if (converted) {
            // NOTE: We intentionally check the ORIGINAL file size (done before this modal opens),
            // not the converted size. Users shouldn't be penalized when our internal conversion
            // produces a larger file — they chose a file within their stated limit.
            setImageUrl(dataUrl);
            setSelectedFile(convertedFile);
            setEffectiveFileType('image');
            return true;
          }
          // Conversion failed - fall through to non-image handling
        } catch (error) {
          console.warn('Image conversion failed:', error);
          // Fall through to non-image handling
        }
      }
      return false;
    }

    function processWebFriendlyImage() {
      const reader = new FileReader();
      reader.onload = (upload: any) => {
        const extension = fileObj.name.split('.').pop()?.toLowerCase();
        const payload = upload.target.result;
        if (extension === 'gif' || extension === 'svg') {
          setImageUrl(payload);
          setSelectedFile(fileObj);
        } else {
          window.loadImage(
            payload,
            function (img) {
              // loadImage returns a canvas on success, or an error on failure
              if (img && typeof img.toDataURL === 'function') {
                const outputFormat = extension === 'png' ? 'png' : 'jpeg';
                const image = img.toDataURL(`image/${outputFormat}`);
                setImageUrl(image);
                // Use correct extension to match actual content type
                const outputFileName =
                  outputFormat === 'png'
                    ? fileObj.name
                    : fileObj.name.replace(/\.[^.]+$/, '.jpg');
                const file = returnImageFileFromUrl({
                  imageUrl: image,
                  fileName: outputFileName
                });
                setSelectedFile(file);
              } else {
                // loadImage couldn't process - use original file
                setImageUrl(payload);
                setSelectedFile(fileObj);
              }
            },
            { orientation: true, canvas: true }
          );
        }
      };
      reader.readAsDataURL(fileObj);
    }

    async function processFile() {
      // First try to convert if needed (HEIC, TIFF, AVIF, etc.)
      const wasConverted = await processConvertibleImage();
      if (wasConverted) return;

      // Then handle web-friendly images
      if (originalFileType === 'image') {
        processWebFriendlyImage();
      } else {
        setSelectedFile(fileObj);
      }
    }

    processFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captionExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        inputType: 'message',
        contentType: 'chat',
        text: caption
      }),
    [caption]
  );

  const handleSubmit = useCallback(async () => {
    if (selectedFile) {
      const filePath = uuidv1();
      const messageId = uuidv1();
      const appliedFileName = generateFileName(selectedFile.name);
      const isTopicMessage =
        (selectedTab === 'topic' || isRespondingToSubject) && topicId;
      onScrollToBottom();

      if (isCielChat || isZeroChat) {
        const { isSupported } = await checkIfAIFileSupported({
          fileName: selectedFile.name
        });
        if (!isSupported) {
          setAiFileNotSupported(true);
          return;
        }
      }

      try {
        onFileUpload({
          channelId,
          content: finalizeEmoji(caption),
          fileName: appliedFileName,
          filePath,
          fileToUpload: selectedFile,
          isCielChat,
          isZeroChat,
          userId,
          recipientId,
          recipientUsername,
          messageId,
          subchannelId,
          targetMessageId: replyTarget?.id,
          topicId: isTopicMessage ? topicId : null,
          thumbnail: thumbnails[selectedThumbnailIndex]
        });
      } catch (error: any) {
        if (error.message === 'ai_file_not_supported') {
          setAiFileNotSupported(true);
        }
        throw error;
      }

      onSubmitMessage({
        messageId,
        message: {
          content: finalizeEmoji(caption),
          channelId,
          fileToUpload: selectedFile,
          filePath,
          fileName: appliedFileName,
          profilePicUrl,
          userId,
          username
        },
        topicId: isTopicMessage ? topicId : null,
        isRespondingToSubject,
        replyTarget,
        subchannelId
      });
      saveFileData({
        fileName: appliedFileName,
        filePath,
        actualFileName: selectedFile.name,
        rootType: 'chat'
      });
      onUpload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    caption,
    channelId,
    isRespondingToSubject,
    onUpload,
    profilePicUrl,
    recipientId,
    replyTarget,
    selectedFile,
    selectedTab,
    subchannelId,
    thumbnails,
    selectedThumbnailIndex,
    topicId,
    userId,
    username
  ]);

  return (
    <>
      <Modal
        modalKey="UploadAIFileModal"
        isOpen
        onClose={onHide}
        closeOnBackdropClick={false}
        hasHeader={false}
        bodyPadding={0}
      >
        <LegacyModalLayout>
          <header>Upload a file</header>
          <main>
            {fileObj ? (
              <FileInfo
                caption={caption}
                captionExceedsCharLimit={captionExceedsCharLimit}
                fileObj={fileObj}
                fileType={effectiveFileType}
                imageUrl={imageUrl}
                onEmbed={onEmbed}
                onCaptionChange={setCaption}
              />
            ) : (
              <Loading />
            )}
            {videoSrc && (
              <ExtractedThumb
                isHidden
                src={videoSrc}
                onThumbnailLoad={handleThumbnailLoad}
              />
            )}
            {thumbnails.length > 0 && (
              <ThumbnailPicker
                thumbnails={thumbnails}
                initialSelectedIndex={selectedThumbnailIndex}
                onSelect={handleThumbnailSelect}
              />
            )}
          </main>
          <footer>
            {aiFileNotSupported && (
              <div
                style={{
                  color: 'red',
                  fontSize: '1.3rem',
                  marginRight: '2rem'
                }}
              >
                Zero and Ciel cannot read this file format.
              </div>
            )}
            <Button
              variant="ghost"
              style={{ marginRight: '0.7rem' }}
              onClick={onHide}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !!captionExceedsCharLimit || !selectedFile || aiFileNotSupported
              }
              color={doneColor}
              onClick={handleSubmit}
            >
              Upload
            </Button>
          </footer>
        </LegacyModalLayout>
      </Modal>
      {alertModalShown && (
        <AlertModal
          title="File is too large"
          content={`The file size is larger than your limit of ${
            maxSize / mb
          } MB`}
          modalLevel={2}
          onHide={() => {
            setAlertModalShown(false);
            onHide();
          }}
        />
      )}
    </>
  );

  function handleThumbnailLoad({
    thumbnails,
    selectedIndex
  }: {
    thumbnails: string[];
    selectedIndex: number;
  }) {
    setThumbnails(thumbnails);
    setSelectedThumbnailIndex(selectedIndex);
  }

  function handleThumbnailSelect(index: number) {
    setSelectedThumbnailIndex(index);
  }
}

export default memo(UploadFileModal);
