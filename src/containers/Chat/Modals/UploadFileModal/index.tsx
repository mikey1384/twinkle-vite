import React, {
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import ExtractedThumb from '~/components/ExtractedThumb';
import FileInfo from './FileInfo';
import Icon from '~/components/Icon';
import { returnImageFileFromUrl } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import {
  addEmoji,
  exceedsCharLimit,
  finalizeEmoji,
  getFileInfoFromFileName,
  generateFileName,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import LocalContext from '../../Context';
import ThumbnailPicker from '~/components/ThumbnailPicker';
import {
  needsImageConversion,
  convertToWebFriendlyFormat
} from '~/helpers/imageHelpers';
import AlertModal from '~/components/Modals/AlertModal';
import {
  cloudFrontURL,
  mb,
  returnMaxUploadSize
} from '~/constants/defaultValues';
import Textarea from '~/components/Texts/Textarea';
import ImageAttachmentsBar, { ImageAttachment } from '~/components/ImageAttachmentsBar';

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
  onTextMessageSubmit,
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
  onTextMessageSubmit?: (arg0: any) => any;
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
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
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
  const [multiImageUploadErrorText, setMultiImageUploadErrorText] = useState('');
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const [imageAttachments, setImageAttachments] = useState<
    ImageAttachment[]
  >([]);
  const imageAttachmentsRef = useRef<ImageAttachment[]>([]);
  const isMountedRef = useRef(true);
  const [multiImageUploading, setMultiImageUploading] = useState(false);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const maxSize = useMemo(
    () => returnMaxUploadSize(fileUploadLvl),
    [fileUploadLvl]
  );
  const maxMultiImageSize = useMemo(
    () => (isCielChat || isZeroChat ? 20 * mb : maxSize),
    [isCielChat, isZeroChat, maxSize]
  );
  const selectedFiles: File[] = useMemo(() => {
    if (!fileObj) return [];
    return Array.isArray(fileObj) ? fileObj : [fileObj];
  }, [fileObj]);

  const imageFiles: File[] = useMemo(
    () => selectedFiles.filter(isImageCandidate),
    [selectedFiles]
  );

  // Photo-mode UI (even for a single image) so users can easily add more photos
  // before sending, similar to ChatGPT's multi-image workflow.
  const isMultiImageMode = useMemo(() => imageFiles.length > 0, [imageFiles]);

  const nonImageSelectedFiles: File[] = useMemo(
    () => selectedFiles.filter((file) => !isImageCandidate(file)),
    [selectedFiles]
  );

  const primaryFileObj = useMemo(() => selectedFiles[0], [selectedFiles]);

  const { fileType: originalFileType } = useMemo(() => {
    return getFileInfoFromFileName(primaryFileObj?.name || '');
  }, [primaryFileObj?.name]);
  // Track effective file type - may differ from original if conversion succeeded
  const [effectiveFileType, setEffectiveFileType] = useState(originalFileType);

  useEffect(() => {
    imageAttachmentsRef.current = imageAttachments;
  }, [imageAttachments]);

  useEffect(() => {
    if (!isMultiImageMode) return;
    revokeAttachmentObjectUrls(imageAttachmentsRef.current);
    const nextAttachments: ImageAttachment[] = imageFiles.map((file) => ({
      id: uuidv1(),
      file,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      previewUrlIsObjectUrl: true,
      progress: 0,
      status: 'selected',
      uploadedUrl: '',
      error: ''
    }));
    setImageAttachments(nextAttachments);
    setMultiImageUploading(false);
    setAiFileNotSupported(false);
  }, [imageFiles, isMultiImageMode]);

  useEffect(() => {
    return function cleanUpObjectUrls() {
      isMountedRef.current = false;
      revokeAttachmentObjectUrls(imageAttachmentsRef.current);
    };
  }, []);

  useEffect(() => {
    if (isMultiImageMode) return;
    if (primaryFileObj && originalFileType === 'video') {
      const url = URL.createObjectURL(primaryFileObj);
      setVideoSrc(url);
    }
  }, [isMultiImageMode, primaryFileObj, originalFileType]);

  useEffect(() => {
    if (isMultiImageMode) return;
    if (!primaryFileObj) return;

    async function processConvertibleImage() {
      // Check if image needs conversion (HEIC, TIFF, AVIF, etc.) BEFORE fileType check
      // These formats may not be classified as 'image' but are images that need conversion
      if (needsImageConversion(primaryFileObj.name)) {
        try {
          const {
            file: convertedFile,
            dataUrl,
            converted
          } = await convertToWebFriendlyFormat(primaryFileObj);
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
        const extension = primaryFileObj.name.split('.').pop()?.toLowerCase();
        const payload = upload.target.result;
        if (extension === 'gif' || extension === 'svg') {
          setImageUrl(payload);
          setSelectedFile(primaryFileObj);
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
                    ? primaryFileObj.name
                    : primaryFileObj.name.replace(/\.[^.]+$/, '.jpg');
                const file = returnImageFileFromUrl({
                  imageUrl: image,
                  fileName: outputFileName
                });
                setSelectedFile(file);
              } else {
                // loadImage couldn't process - use original file
                setImageUrl(payload);
                setSelectedFile(primaryFileObj);
              }
            },
            { orientation: true, canvas: true }
          );
        }
      };
      reader.readAsDataURL(primaryFileObj);
    }

    async function processFile() {
      // First try to convert if needed (HEIC, TIFF, AVIF, etc.)
      const wasConverted = await processConvertibleImage();
      if (wasConverted) return;

      // Then handle web-friendly images
      if (originalFileType === 'image') {
        processWebFriendlyImage();
      } else {
        setSelectedFile(primaryFileObj);
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

  async function handleSubmit() {
    if (isMultiImageMode) {
      await handleSubmitMultipleImages();
      return;
    }

    if (!selectedFile) return;

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

  return (
    <>
      <Modal
        modalKey="UploadAIFileModal"
        isOpen
        onClose={handleHide}
        closeOnBackdropClick={false}
        hasHeader={false}
        bodyPadding={0}
      >
        <LegacyModalLayout>
          <header>Upload a file</header>
          <main>
            {isMultiImageMode ? (
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>
                  {imageAttachments.length} photo
                  {imageAttachments.length === 1 ? '' : 's'}
                </div>
                {nonImageSelectedFiles.length > 0 && (
                  <div
                    style={{
                      margin: '0.7rem 0 1rem 0',
                      padding: '0.7rem 1rem',
                      borderRadius: '0.7rem',
                      background: 'rgba(255, 180, 0, 0.15)',
                      border: '1px solid rgba(255, 180, 0, 0.35)',
                      fontSize: '1.2rem'
                    }}
                  >
                    Non-image files aren&apos;t included in multi-photo messages (
                    {nonImageSelectedFiles.length}). Please upload them one at a time.
                  </div>
                )}
                  <div
                    style={{
                      margin: '0.3rem 0 1rem 0',
                      display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{ fontSize: '1.3rem' }}>
                    {imageAttachments.length > 1
                      ? 'They will be sent in one message.'
                      : 'You can add more photos before sending.'}
                  </div>
                  <Button
                    variant="soft"
                    tone="raised"
                    disabled={multiImageUploading}
                    onClick={handleAddMorePhotosClick}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Icon icon="plus" />
                    <span style={{ marginLeft: '0.7rem' }}>
                      Add more photos
                    </span>
                  </Button>
                  <input
                    ref={addMoreInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddMorePhotosChange}
                    style={{ display: 'none' }}
                    aria-hidden="true"
                  />
                </div>
                <ImageAttachmentsBar
                  attachments={imageAttachments}
                  onRemove={handleRemoveImageAttachment}
                  removeDisabled={multiImageUploading}
                />
                <Textarea
                  autoFocus
                  placeholder="Add a caption..."
                  hasError={!!captionExceedsCharLimit}
                  value={caption}
                  onChange={(event: any) => setCaption(event.target.value)}
                  onKeyUp={handleCaptionKeyUp}
                  minRows={3}
                />
                {captionExceedsCharLimit && (
                  <div
                    style={{
                      fontWeight: 'normal',
                      fontSize: '1.3rem',
                      color: 'red'
                    }}
                  >
                    {captionExceedsCharLimit.message}
                  </div>
                )}
              </div>
            ) : primaryFileObj ? (
              <>
                {selectedFiles.length > 1 && (
                  <div
                    style={{
                      margin: '0 0 1rem 0',
                      padding: '0.7rem 1rem',
                      borderRadius: '0.7rem',
                      background: 'rgba(255, 180, 0, 0.15)',
                      border: '1px solid rgba(255, 180, 0, 0.35)',
                      fontSize: '1.2rem'
                    }}
                  >
                    You selected {selectedFiles.length} files. Only one file will be
                    uploaded. To send multiple photos in one message, select 2+
                    photos.
                  </div>
                )}
                <FileInfo
                  caption={caption}
                  captionExceedsCharLimit={captionExceedsCharLimit}
                  fileObj={primaryFileObj}
                  fileType={effectiveFileType}
                  imageUrl={imageUrl}
                  onEmbed={onEmbed}
                  onCaptionChange={setCaption}
                />
              </>
            ) : (
              <Loading />
            )}
            {!isMultiImageMode && videoSrc && (
              <ExtractedThumb
                isHidden
                src={videoSrc}
                onThumbnailLoad={handleThumbnailLoad}
              />
            )}
            {!isMultiImageMode && thumbnails.length > 0 && (
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
            {multiImageUploadErrorText && (
              <div
                style={{
                  color: 'red',
                  fontSize: '1.3rem',
                  marginRight: '2rem'
                }}
              >
                {multiImageUploadErrorText}
              </div>
            )}
            <Button
              variant="ghost"
              style={{ marginRight: '0.7rem' }}
              disabled={multiImageUploading}
              onClick={handleHide}
            >
              Cancel
            </Button>
            <Button
              disabled={
                isMultiImageMode
                  ? !!captionExceedsCharLimit ||
                    multiImageUploading ||
                    imageAttachments.length === 0 ||
                    aiFileNotSupported ||
                    (imageAttachments.length > 1 && !onTextMessageSubmit)
                  : !!captionExceedsCharLimit ||
                    !selectedFile ||
                    aiFileNotSupported
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
            maxMultiImageSize / mb
          } MB`}
          modalLevel={2}
          onHide={() => setAlertModalShown(false)}
        />
      )}
    </>
  );

  function handleHide() {
    if (multiImageUploading) return;
    onHide();
  }

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

  function handleCaptionKeyUp(event: any) {
    if (event.key === ' ') {
      setCaption(addEmoji(event.target.value));
    }
  }

  function handleRemoveImageAttachment(attachmentId: string) {
    if (multiImageUploading) return;
    const currentAttachment = imageAttachmentsRef.current.find(
      (attachment) => attachment.id === attachmentId
    );
    if (currentAttachment?.previewUrlIsObjectUrl) {
      URL.revokeObjectURL(currentAttachment.previewUrl);
    }
    setImageAttachments((prev) =>
      prev.filter((attachment) => attachment.id !== attachmentId)
    );
    setAiFileNotSupported(false);
    setMultiImageUploadErrorText('');
  }

  function handleAddMorePhotosClick() {
    if (multiImageUploading) return;
    addMoreInputRef.current?.click();
  }

  function handleAddMorePhotosChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      event.target.value = '';
      return;
    }

    const acceptedFiles = files.filter((file) => isImageCandidate(file));
    const oversizedFiles = acceptedFiles.filter(
      (file) => file.size / mb > maxMultiImageSize
    );
    const allowedFiles = acceptedFiles.filter(
      (file) => file.size / mb <= maxMultiImageSize
    );

    if (oversizedFiles.length > 0) {
      setAlertModalShown(true);
    }

    if (allowedFiles.length > 0) {
      setAiFileNotSupported(false);
      const newAttachments: ImageAttachment[] = allowedFiles.map(
        (file) => ({
          id: uuidv1(),
          file,
          fileName: file.name,
          previewUrl: URL.createObjectURL(file),
          previewUrlIsObjectUrl: true,
          progress: 0,
          status: 'selected',
          uploadedUrl: '',
          error: ''
        })
      );
      setImageAttachments((prev) => [...prev, ...newAttachments]);
    }

    event.target.value = '';
  }

  async function handleSubmitMultipleImages() {
    if (multiImageUploading) return;
    if (!!captionExceedsCharLimit) return;

    const attachmentsSnapshot = imageAttachments;
    if (attachmentsSnapshot.length === 0) return;

    setMultiImageUploading(true);
    setMultiImageUploadErrorText('');
    onScrollToBottom();

    let didClose = false;
    try {
      // If we’re only sending a single photo, keep the existing chat attachment
      // pipeline instead of embedding `![]()` in the message content.
      if (attachmentsSnapshot.length === 1) {
        await submitSinglePhotoAsChatAttachment(attachmentsSnapshot[0]);
        didClose = true;
        onUpload();
        return;
      }

      if (!onTextMessageSubmit) return;

      const uploadedUrlsById =
        await uploadImagesForOneMessage(attachmentsSnapshot);

      const existingUrlsById = attachmentsSnapshot.reduce<
        Record<string, string>
      >((acc, attachment) => {
        if (attachment.status === 'ready' && attachment.uploadedUrl) {
          acc[attachment.id] = attachment.uploadedUrl;
        }
        return acc;
      }, {});

      const orderedUrls = attachmentsSnapshot.map((attachment) => {
        return (
          uploadedUrlsById[attachment.id] || existingUrlsById[attachment.id] || ''
        );
      });

      if (orderedUrls.some((url) => !url)) {
        setMultiImageUploadErrorTextSafely(
          'Some photos failed to upload. Please retry or remove them.'
        );
        return;
      }

      const imageMarkdown = orderedUrls.map((url) => `![](${url})`).join('\n');
      const captionText = finalizeEmoji(caption);
      const composedMessage = stringIsEmpty(captionText)
        ? imageMarkdown
        : `${imageMarkdown}\n${captionText}`;

      const isTopicMessage =
        (selectedTab === 'topic' || isRespondingToSubject) && topicId;

      // NOTE (review clarification): A previous review suggested multi-photo uploads
      // must go through `/chat/file` for AI channels. That's not true for our AI
      // pipeline — the backend extracts image URLs from the message content
      // (see `splitTextWithImages`) and sends them as `input_image`.
      await onTextMessageSubmit({
        message: composedMessage,
        subchannelId,
        selectedTab,
        topicId: isTopicMessage ? topicId : null
      });

      didClose = true;
      onUpload();
    } catch (error) {
      console.error(error);
    } finally {
      if (!didClose) {
        setMultiImageUploadingSafely(false);
      }
    }
  }

  async function submitSinglePhotoAsChatAttachment(
    attachment: ImageAttachment
  ) {
    if (!attachment?.file) return;
    if (!channelId) return;

    let fileToUpload = attachment.file;

    try {
      if (needsImageConversion(fileToUpload.name)) {
        const { file: convertedFile, converted } =
          await convertToWebFriendlyFormat(fileToUpload);
        if (converted) {
          fileToUpload = convertedFile;
        }
      }
    } catch (error) {
      console.warn('Image conversion failed:', error);
    }

    if (isCielChat || isZeroChat) {
      const { isSupported } = await checkIfAIFileSupported({
        fileName: fileToUpload.name
      });
      if (!isSupported) {
        setAiFileNotSupportedSafely(true);
        throw new Error('ai_file_not_supported');
      }
    }

    const filePath = uuidv1();
    const messageId = uuidv1();
    const appliedFileName = generateFileName(fileToUpload.name);
    const isTopicMessage =
      (selectedTab === 'topic' || isRespondingToSubject) && topicId;

    try {
      onFileUpload({
        channelId,
        content: finalizeEmoji(caption),
        fileName: appliedFileName,
        filePath,
        fileToUpload,
        isCielChat,
        isZeroChat,
        userId,
        recipientId,
        recipientUsername,
        messageId,
        subchannelId,
        targetMessageId: replyTarget?.id,
        topicId: isTopicMessage ? topicId : null,
        thumbnail: ''
      });
    } catch (error: any) {
      if (error.message === 'ai_file_not_supported') {
        setAiFileNotSupportedSafely(true);
      }
      throw error;
    }

    onSubmitMessage({
      messageId,
      message: {
        content: finalizeEmoji(caption),
        channelId,
        fileToUpload,
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
      actualFileName: fileToUpload.name,
      rootType: 'chat'
    });
  }

  async function uploadImagesForOneMessage(
    attachmentsSnapshot: ImageAttachment[]
  ) {
    const targets = attachmentsSnapshot.filter(
      (attachment) => attachment.status !== 'ready' || !attachment.uploadedUrl
    );

    if (targets.length === 0) return {};

    const uploadedUrlsById: Record<string, string> = {};

    const concurrency = 3;
    const queue = targets.slice();

    const workers = new Array(Math.min(concurrency, queue.length))
      .fill(null)
      .map(() => uploadWorker());

    await Promise.all(workers);
    return uploadedUrlsById;

    async function uploadWorker() {
      while (queue.length > 0) {
        const attachment = queue.shift();
        if (!attachment) return;
        const uploadedUrl = await uploadSingleImageAttachment(attachment);
        if (uploadedUrl) {
          uploadedUrlsById[attachment.id] = uploadedUrl;
        }
      }
    }
  }

  async function uploadSingleImageAttachment(attachment: ImageAttachment) {
    const attachmentId = attachment.id;

    setImageAttachmentsSafely((prev) =>
      prev.map((attachment) =>
        attachment.id === attachmentId
          ? {
              ...attachment,
              status: 'uploading',
              progress: 0,
              error: ''
            }
          : attachment
      )
    );

    let fileToUpload = attachment.file;

    try {
      if (needsImageConversion(fileToUpload.name)) {
        const {
          file: convertedFile,
          dataUrl,
          converted
        } = await convertToWebFriendlyFormat(fileToUpload);
        if (converted) {
          fileToUpload = convertedFile;
          if (attachment.previewUrlIsObjectUrl) {
            URL.revokeObjectURL(attachment.previewUrl);
          }
          setImageAttachmentsSafely((prev) =>
            prev.map((attachment) =>
              attachment.id === attachmentId
                ? {
                    ...attachment,
                    file: convertedFile,
                    fileName: convertedFile.name,
                    previewUrl: dataUrl,
                    previewUrlIsObjectUrl: false
                  }
                : attachment
            )
          );
        }
      }

      const filePath = uuidv1();
      const appliedFileName = generateFileName(fileToUpload.name);
      await uploadFile({
        filePath,
        fileName: appliedFileName,
        file: fileToUpload,
        context: 'embed',
        onUploadProgress: handleUploadProgress
      });
      await saveFileData({
        fileName: appliedFileName,
        filePath,
        actualFileName: fileToUpload.name,
        rootType: 'embed'
      });

      const uploadedUrl = `${cloudFrontURL}/attachments/embed/${filePath}/${encodeURIComponent(
        appliedFileName
      )}`;

      setImageAttachmentsSafely((prev) =>
        prev.map((attachment) =>
          attachment.id === attachmentId
            ? {
                ...attachment,
                status: 'ready',
                progress: 1,
                uploadedUrl,
                error: ''
              }
            : attachment
        )
      );
      return uploadedUrl;
    } catch (error) {
      console.error(error);
      setImageAttachmentsSafely((prev) =>
        prev.map((attachment) =>
          attachment.id === attachmentId
            ? { ...attachment, status: 'error', error: 'upload' }
            : attachment
        )
      );
    }
    return null;

    function handleUploadProgress({
      loaded,
      total
    }: {
      loaded: number;
      total: number;
    }) {
      if (!total || !Number.isFinite(total) || total <= 0) {
        return;
      }
      const ratio = loaded / total;
      if (!Number.isFinite(ratio)) {
        return;
      }
      setImageAttachmentsSafely((prev) =>
        prev.map((attachment) =>
          attachment.id === attachmentId
            ? { ...attachment, progress: Math.max(0, Math.min(1, ratio)) }
            : attachment
        )
      );
    }
  }

  function setImageAttachmentsSafely(
    updater: React.SetStateAction<ImageAttachment[]>
  ) {
    if (!isMountedRef.current) return;
    setImageAttachments(updater);
  }

  function setAiFileNotSupportedSafely(value: boolean) {
    if (!isMountedRef.current) return;
    setAiFileNotSupported(value);
  }

  function setMultiImageUploadErrorTextSafely(value: string) {
    if (!isMountedRef.current) return;
    setMultiImageUploadErrorText(value);
  }

  function setMultiImageUploadingSafely(value: boolean) {
    if (!isMountedRef.current) return;
    setMultiImageUploading(value);
  }

  function revokeAttachmentObjectUrls(attachments: ImageAttachment[]) {
    for (const attachment of attachments) {
      if (attachment.previewUrlIsObjectUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    }
  }

  function isImageCandidate(file: File) {
    if (!file) return false;
    if (file.type?.startsWith('image/')) return true;
    const { fileType } = getFileInfoFromFileName(file.name);
    return fileType === 'image' || needsImageConversion(file.name);
  }
}

export default memo(UploadFileModal);
