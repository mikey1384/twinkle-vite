import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import AlertModal from '~/components/Modals/AlertModal';
import Textarea from '~/components/Texts/Textarea';
import ImageAttachmentsBar, {
  ImageAttachment
} from '~/components/ImageAttachmentsBar';
import { useAppContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import {
  addEmoji,
  exceedsCharLimit,
  finalizeEmoji,
  generateFileName,
  getFileInfoFromFileName,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import {
  convertToWebFriendlyFormat,
  needsImageConversion
} from '~/helpers/imageHelpers';
import { cloudFrontURL, mb } from '~/constants/defaultValues';

export default function PhotoUploadModal({
  fileObj,
  initialCaption = '',
  maxSize,
  onHide,
  onSubmitSingle,
  onSubmitMultiple
}: {
  fileObj: File | File[] | null;
  initialCaption?: string;
  maxSize: number;
  onHide: () => void;
  onSubmitSingle: (arg0: { file: File; caption: string }) => Promise<any>;
  onSubmitMultiple?: (arg0: {
    caption: string;
    message: string;
    uploadedUrls: string[];
  }) => Promise<any>;
}) {
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const saveFileData = useAppContext((v) => v.requestHelpers.saveFileData);
  const [caption, setCaption] = useState(initialCaption);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [multiImageUploadErrorText, setMultiImageUploadErrorText] = useState('');
  const [imageAttachments, setImageAttachments] = useState<ImageAttachment[]>(
    []
  );
  const imageAttachmentsRef = useRef<ImageAttachment[]>([]);
  const isMountedRef = useRef(true);
  const [multiImageUploading, setMultiImageUploading] = useState(false);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const selectedFiles: File[] = useMemo(() => {
    if (!fileObj) return [];
    return Array.isArray(fileObj) ? fileObj : [fileObj];
  }, [fileObj]);

  const nonImageSelectedFiles: File[] = useMemo(
    () => selectedFiles.filter((file) => !isImageCandidate(file)),
    [selectedFiles]
  );

  const initialImageFiles: File[] = useMemo(
    () => selectedFiles.filter((file) => isImageCandidate(file)),
    [selectedFiles]
  );

  const captionExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text: caption
      }),
    [caption]
  );

  useEffect(() => {
    imageAttachmentsRef.current = imageAttachments;
  }, [imageAttachments]);

  useEffect(() => {
    revokeAttachmentObjectUrls(imageAttachmentsRef.current);
    const oversizedFiles = initialImageFiles.filter(
      (file) => file.size / mb > maxSize
    );
    const allowedFiles = initialImageFiles.filter(
      (file) => file.size / mb <= maxSize
    );
    if (oversizedFiles.length > 0) {
      setAlertModalShown(true);
    }

    const nextAttachments: ImageAttachment[] = allowedFiles.map((file) => ({
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
  }, [initialImageFiles, maxSize]);

  useEffect(() => {
    return function cleanUpObjectUrls() {
      isMountedRef.current = false;
      revokeAttachmentObjectUrls(imageAttachmentsRef.current);
    };
  }, []);

  return (
    <>
      <Modal
        modalKey="PhotoUploadModal"
        isOpen
        onClose={handleHide}
        closeOnBackdropClick={false}
        hasHeader={false}
        bodyPadding={0}
      >
        <LegacyModalLayout>
          <header>Upload photos</header>
          <main>
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
                  <span style={{ marginLeft: '0.7rem' }}>Add more photos</span>
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
          </main>
          <footer>
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
                !!captionExceedsCharLimit ||
                multiImageUploading ||
                imageAttachments.length === 0 ||
                (imageAttachments.length > 1 && !onSubmitMultiple)
              }
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
          content={`The file size is larger than your limit of ${maxSize / mb} MB`}
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
      (file) => file.size / mb > maxSize
    );
    const allowedFiles = acceptedFiles.filter(
      (file) => file.size / mb <= maxSize
    );

    if (oversizedFiles.length > 0) {
      setAlertModalShown(true);
    }

    if (allowedFiles.length > 0) {
      const newAttachments: ImageAttachment[] = allowedFiles.map((file) => ({
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
      setImageAttachments((prev) => [...prev, ...newAttachments]);
    }

    event.target.value = '';
  }

  async function handleSubmit() {
    if (multiImageUploading) return;
    if (!!captionExceedsCharLimit) return;

    const attachmentsSnapshot = imageAttachments;
    if (attachmentsSnapshot.length === 0) return;

    setMultiImageUploading(true);
    setMultiImageUploadErrorText('');

    let didClose = false;
    try {
      const captionText = finalizeEmoji(caption);

      if (attachmentsSnapshot.length === 1) {
        await onSubmitSingle({
          file: attachmentsSnapshot[0].file,
          caption: captionText
        });
        didClose = true;
        onHide();
        return;
      }

      if (!onSubmitMultiple) return;

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

      const orderedUrls = attachmentsSnapshot.map(
        (attachment) =>
          uploadedUrlsById[attachment.id] || existingUrlsById[attachment.id] || ''
      );

      if (orderedUrls.some((url) => !url)) {
        setMultiImageUploadErrorTextSafely(
          'Some photos failed to upload. Please retry or remove them.'
        );
        return;
      }

      const imageMarkdown = orderedUrls.map((url) => `![](${url})`).join('\n');
      const composedMessage = stringIsEmpty(captionText)
        ? imageMarkdown
        : `${imageMarkdown}\n${captionText}`;

      await onSubmitMultiple({
        caption: captionText,
        message: composedMessage,
        uploadedUrls: orderedUrls
      });

      didClose = true;
      onHide();
    } catch (error) {
      console.error(error);
    } finally {
      if (!didClose) {
        setMultiImageUploadingSafely(false);
      }
    }
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
