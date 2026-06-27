import { useMemo, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import {
  cloudFrontURL,
  mb,
  returnMaxUploadSize
} from '~/constants/defaultValues';
import { addCommasToNumber, generateFileName } from '~/helpers/stringHelpers';
import {
  needsImageConversion,
  convertToWebFriendlyFormat
} from '~/helpers/imageHelpers';

// Single source of truth for uploading a file as an inline embed and getting
// back its resolvable URL. Shared by the Textarea drop/paste path (mouse +
// native file drop) and the touch drag-to-embed path so the conversion, size
// checks, and progress reporting stay identical across both.
export default function useEmbedFileUpload() {
  const fileUploadLvl = useKeyContext((v) => v.myState.fileUploadLvl);
  const userId = useKeyContext((v) => v.myState.userId);
  const maxSize = useMemo(
    () => returnMaxUploadSize(fileUploadLvl),
    [fileUploadLvl]
  );
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const saveFileData = useAppContext((v) => v.requestHelpers.saveFileData);
  const [uploadErrorType, setUploadErrorType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const normalizedProgress = useMemo(() => {
    if (!Number.isFinite(uploadProgress) || uploadProgress <= 0) return 0;
    if (uploadProgress >= 1) return 1;
    return uploadProgress;
  }, [uploadProgress]);

  const errorModalContent = useMemo(() => {
    switch (uploadErrorType) {
      case 'size':
        return {
          title: 'File too large',
          content: `The file size exceeds the maximum allowed upload size of ${addCommasToNumber(
            maxSize / mb
          )}MB.`
        };
      default:
        return {
          title: 'Upload error',
          content:
            'An error occurred while trying to upload your file. Please try again.'
        };
    }
  }, [maxSize, uploadErrorType]);

  return {
    uploadForEmbed,
    uploading,
    uploadProgress,
    normalizedProgress,
    uploadErrorType,
    setUploadErrorType,
    errorModalContent
  };

  async function uploadForEmbed(file: File): Promise<string | undefined> {
    if (uploadErrorType) setUploadErrorType('');
    if (!file || !maxSize || !userId) return undefined;
    if (file.size / mb > maxSize) {
      setUploadErrorType('size');
      return undefined;
    }
    setUploading(true);

    let fileToUpload = file;
    if (needsImageConversion(file.name)) {
      try {
        const { file: convertedFile } = await convertToWebFriendlyFormat(file);
        // Re-check size after conversion (converted file could be larger)
        if (convertedFile.size / mb > maxSize) {
          setUploading(false);
          setUploadErrorType('size');
          return undefined;
        }
        fileToUpload = convertedFile;
      } catch (error) {
        console.warn('Image conversion failed:', error);
      }
    }

    const filePath = uuidv1();
    const appliedFileName = generateFileName(fileToUpload.name);
    try {
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
      if (uploadErrorType) setUploadErrorType('');
      return `${cloudFrontURL}/attachments/embed/${filePath}/${encodeURIComponent(
        appliedFileName
      )}`;
    } catch (err) {
      console.error(err);
      setUploadErrorType('upload');
      return undefined;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function handleUploadProgress({
    loaded,
    total
  }: {
    loaded: number;
    total: number;
  }) {
    if (!total || !Number.isFinite(total) || total <= 0) {
      setUploadProgress(0);
      return;
    }
    const ratio = loaded / total;
    if (!Number.isFinite(ratio)) {
      setUploadProgress(0);
      return;
    }
    setUploadProgress(Math.max(0, Math.min(1, ratio)));
  }
}
