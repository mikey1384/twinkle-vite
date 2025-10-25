import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback
} from 'react';
import ProgressBar from '~/components/ProgressBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import {
  cloudFrontURL,
  mb,
  returnMaxUploadSize
} from '~/constants/defaultValues';
import { addCommasToNumber, generateFileName } from '~/helpers/stringHelpers';
import AlertModal from '~/components/Modals/AlertModal';
import { debounce } from '~/helpers';

export default function Textarea({
  className,
  draggedFile,
  hasError,
  innerRef,
  minRows = 1,
  maxRows = 20,
  onDrop,
  style,
  theme,
  disableFocusGlow,
  ...rest
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onDrop' | 'ref'> & {
  draggedFile?: File;
  hasError?: boolean;
  innerRef?: React.Ref<HTMLTextAreaElement> | ((instance: any) => void);
  minRows?: number;
  maxRows?: number;
  onDrop?: (filePath: string) => void;
  theme?: string;
  disableFocusGlow?: boolean;
}) {
  const fileUploadLvl = useKeyContext((v) => v.myState.fileUploadLvl);
  const userId = useKeyContext((v) => v.myState.userId);
  const maxSize = useMemo(
    () => returnMaxUploadSize(fileUploadLvl),
    [fileUploadLvl]
  );
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const saveFileData = useAppContext((v) => v.requestHelpers.saveFileData);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadErrorType, setUploadErrorType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const normalizedProgress = useMemo(() => {
    if (!Number.isFinite(uploadProgress) || uploadProgress <= 0) return 0;
    if (uploadProgress >= 1) return 1;
    return uploadProgress;
  }, [uploadProgress]);
  const progress = useMemo(
    () => Math.ceil(100 * normalizedProgress),
    [normalizedProgress]
  );

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';

    const computed = window.getComputedStyle(el);
    const paddingTop = parseFloat(computed.paddingTop || '0');
    const paddingBottom = parseFloat(computed.paddingBottom || '0');
    const padding = paddingTop + paddingBottom;

    let lineHeight = parseFloat(computed.lineHeight || '0');
    if (!lineHeight || Number.isNaN(lineHeight)) {
      const fontSize = parseFloat(computed.fontSize || '16');
      lineHeight = fontSize * 1.2;
    }

    const contentHeight = el.scrollHeight;
    const minHeight = lineHeight * (minRows || 1) + padding;
    let nextHeight = Math.max(contentHeight, minHeight);

    if (maxRows) {
      const maxHeight = lineHeight * maxRows + padding;
      nextHeight = Math.min(nextHeight, maxHeight);
      el.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
    } else {
      el.style.overflowY = 'hidden';
    }

    el.style.height = `${nextHeight}px`;
  }, [maxRows, minRows]);

  useLayoutEffect(() => {
    autoResize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest.value, maxRows, minRows]);

  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty(
        '--vh',
        `${window.innerHeight * 0.01}px`
      );
    };
    const debouncedSetVh = debounce(setVh, 150);
    window.addEventListener('resize', debouncedSetVh as any);
    setVh();
    return () => window.removeEventListener('resize', debouncedSetVh as any);
  }, []);

  useEffect(() => {
    const debounced = debounce(() => autoResize(), 150);
    window.addEventListener('resize', debounced as any);
    return () => window.removeEventListener('resize', debounced as any);
  }, [autoResize]);

  const errorModalContent = useMemo(() => {
    switch (uploadErrorType) {
      case 'size':
        return {
          title: 'File too large',
          content: `The file size exceeds the maximum allowed upload size of ${addCommasToNumber(
            maxSize / mb
          )}MB.`
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
    <div
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        ...style
      }}
    >
      <textarea
        {...rest}
        autoComplete="off"
        rows={1}
        ref={(ref) => {
          textareaRef.current = ref;
          if (innerRef) {
            if (typeof innerRef === 'function') {
              innerRef(ref);
            } else {
              innerRef.current = ref;
            }
          }
        }}
        onDrop={onDrop ? handleDrop : undefined}
        onPaste={
          onDrop || (rest as any).onPaste ? handleCombinedPaste : undefined
        }
        onInput={(e) => {
          autoResize();
          if (rest.onInput) (rest.onInput as any)(e);
        }}
        onDragEnter={() => {
          setIsDragging(true);
        }}
        onDragLeave={() => {
          setIsDragging(false);
        }}
        style={{
          color: hasError ? Color.red() : undefined,
          border: hasError
            ? `1px solid ${Color.red()}`
            : onDrop
            ? isDragging
              ? '2px dashed #00aaff'
              : style?.border
            : style?.border
        }}
        className={`${className} ${css`
          opacity: ${uploading ? 0.2 : 1};
          font-family: 'Noto Sans', Helvetica, sans-serif, Arial;
          width: 100%;
          box-sizing: border-box;
          position: relative;
          font-size: 1.7rem;
          padding: 1rem;
          border: 1px solid var(--ui-border);
          resize: none;
          touch-action: manipulation;
          border-radius: inherit;
          &:focus {
            outline: none;
            ${disableFocusGlow
              ? `border: none; box-shadow: none;`
              : `border: 1px solid ${Color.logoBlue()}; box-shadow: 0px 0px 3px ${Color.logoBlue(
                  0.8
                )};`}
            ::placeholder {
              color: ${Color.lighterGray()};
            }
          }
          ::placeholder {
            color: ${Color.gray()};
          }
          @media (max-width: ${mobileMaxWidth}) {
            line-height: 1.6;
            font-size: 16px;
          }
        `}`}
      />
      {uploading && (
        <div
          style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            top: '-5px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <ProgressBar
            theme={theme}
            progress={progress}
            color={progress === 100 ? Color.green() : undefined}
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

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = draggedFile || e.dataTransfer.files[0];
    handleFileUpload(file);
  }

  function handleCombinedPaste(e: React.ClipboardEvent) {
    // Always allow parent onPaste to run first, if provided
    const parentHasOnPaste = !!(rest as any).onPaste;
    if (parentHasOnPaste) {
      try {
        (rest as any).onPaste(e);
      } catch (err) {
        // ignore parent handler errors to avoid breaking default behavior
        console.error(err);
      }
    }

    if (e.defaultPrevented || !onDrop) return;

    const items = Array.from(e.clipboardData?.items || []);
    const fileItems = items.filter((it) => it && it.kind === 'file');
    if (fileItems.length === 0) return;

    const inferExt = (mime: string) => {
      const map: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/heic': 'heic',
        'image/heif': 'heif',
        'application/pdf': 'pdf',
        'text/plain': 'txt'
      };
      if (map[mime]) return map[mime];
      const parts = mime?.split('/') || [];
      return parts[1] || '';
    };

    // Upload images first (common expectation), then other files
    const imageItems = fileItems.filter((it) => /^image\//.test(it.type));
    const otherItems = fileItems.filter((it) => !/^image\//.test(it.type));

    const uploadFromItems = (arr: DataTransferItem[]) => {
      for (const item of arr) {
        const blob = item.getAsFile();
        if (!blob) continue;
        const ext = inferExt(blob.type);
        const isImage = /^image\//.test(blob.type);
        const name =
          blob.name?.trim() ||
          (isImage ? `image.${ext || 'png'}` : `pasted-file.${ext || 'bin'}`);
        const file = new File([blob], name, { type: blob.type });

        handleFileUpload(file);
      }
    };

    uploadFromItems(imageItems);
    // Surface non-image file uploads as well so unsupported-file errors show
    // even when text payloads (like filenames) accompany the clipboard data.
    uploadFromItems(otherItems);
  }

  async function handleFileUpload(file: File) {
    setIsDragging(false);
    if (!file || !maxSize || !userId) return;
    if (file.size / mb > maxSize) {
      return setUploadErrorType('size');
    }
    if (!file.type.startsWith('image/')) {
      return setUploadErrorType('type');
    }
    setUploading(true);
    const filePath = uuidv1();
    const appliedFileName = generateFileName(file.name);
    try {
      await uploadFile({
        filePath,
        fileName: appliedFileName,
        file,
        context: 'embed',
        onUploadProgress: handleUploadProgress
      });
      await saveFileData({
        fileName: appliedFileName,
        filePath,
        actualFileName: file.name,
        rootType: 'embed'
      });
      onDrop?.(
        `${cloudFrontURL}/attachments/embed/${filePath}/${encodeURIComponent(
          appliedFileName
        )}`
      );
    } catch (err) {
      console.error(err);
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
