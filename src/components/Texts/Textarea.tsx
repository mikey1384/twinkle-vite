import React, {
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
  useEffect
} from 'react';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import {
  cloudFrontURL,
  mb,
  returnMaxUploadSize
} from '~/constants/defaultValues';
import { addCommasToNumber, generateFileName } from '~/helpers/stringHelpers';

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
  disableAutoResize = false,
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
  disableAutoResize?: boolean;
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

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    const computed = window.getComputedStyle(el);
    const paddingTop = parseFloat(computed.paddingTop || '0');
    const paddingBottom = parseFloat(computed.paddingBottom || '0');
    const padding = paddingTop + paddingBottom;

    let lineHeight = parseFloat(computed.lineHeight || '0');
    if (!lineHeight || Number.isNaN(lineHeight)) {
      const fontSize = parseFloat(computed.fontSize || '16');
      lineHeight = fontSize * 1.2;
    }

    const baseMinHeight = lineHeight * (minRows || 1) + padding;

    if (disableAutoResize) {
      el.style.height = '';
      el.style.minHeight = `${baseMinHeight}px`;
      el.style.overflowY = 'auto';
      return;
    }

    el.style.minHeight = `${baseMinHeight}px`;
    el.style.height = '0';

    const contentHeight = el.scrollHeight;
    let nextHeight = Math.max(contentHeight, baseMinHeight);

    if (maxRows) {
      const maxHeight = lineHeight * maxRows + padding;
      nextHeight = Math.min(nextHeight, maxHeight);
      el.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
    } else {
      el.style.overflowY = 'hidden';
    }

    el.style.height = `${nextHeight}px`;
    el.style.minHeight = '';
  }, [maxRows, minRows, disableAutoResize]);

  useLayoutEffect(() => {
    autoResize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest.value, maxRows, minRows, disableAutoResize]);
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const container = el.parentElement || el;

    let rafId: number | null = null;
    const schedule = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        autoResize();
        rafId = null;
      });
    };

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      let lastWidth = container.clientWidth;
      ro = new ResizeObserver((entries) => {
        const entry = entries[entries.length - 1];
        // Only react to width changes to avoid loops from height mutations
        const nextWidth = Math.round(entry.contentRect.width);
        if (nextWidth !== Math.round(lastWidth)) {
          lastWidth = nextWidth;
          schedule();
        }
      });
      ro.observe(container);
    } else {
      const handler = () => schedule();
      window.addEventListener('orientationchange', handler, {
        passive: true
      } as any);
      window.addEventListener('resize', handler, { passive: true } as any);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('orientationchange', handler as any);
        window.removeEventListener('resize', handler as any);
      };
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
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
        borderRadius,
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
            : style?.border,
          pointerEvents: uploading ? 'none' : style?.pointerEvents,
          minHeight: style?.minHeight,
          height: style?.height
        }}
        className={`${className} ${css`
          opacity: ${uploading ? 0.2 : 1};
          font-family: inherit;
          width: 100%;
          box-sizing: border-box;
          position: relative;
          font-size: 1.7rem;
          padding: 1rem;
          border: 1px solid var(--ui-border);
          border-radius: inherit;
          background: #fff;
          resize: none;
          touch-action: manipulation;
          overflow-anchor: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease,
            background 0.18s ease;
          &:focus {
            outline: none;
            ${disableFocusGlow
              ? `border: none; box-shadow: none;`
              : `border-color: var(--ui-border-strong); box-shadow: none;`}
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
          className={css`
            position: absolute;
            width: 100%;
            height: 100%;
            inset: 0;
            pointer-events: none;
            z-index: 999;
            border-radius: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
          `}
        >
          <FileUploadStatusIndicator
            hideUploading
            theme={theme}
            uploadProgress={normalizedProgress}
            style={{ width: '70%', marginTop: 0 }}
          />
        </div>
      )}
      {uploadErrorType && (
        <div
          className={css`
            width: 100%;
            margin-top: 0.5rem;
            color: ${Color.red()};
            font-size: 1.3rem;
            line-height: 1.2;
            text-align: left;
          `}
          role="alert"
          aria-live="polite"
        >
          <strong>{errorModalContent.title}:</strong>{' '}
          {errorModalContent.content}
        </div>
      )}
    </div>
  );

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploading) return;
    const file = draggedFile || e.dataTransfer.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  }

  function handleCombinedPaste(e: React.ClipboardEvent) {
    const parentHasOnPaste = !!(rest as any).onPaste;
    if (parentHasOnPaste) {
      try {
        (rest as any).onPaste(e);
      } catch (err) {
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

    if (fileItems.length > 0) {
      uploadFromItems(fileItems);
    }
  }

  async function handleFileUpload(file: File) {
    setIsDragging(false);
    if (uploadErrorType) setUploadErrorType('');
    if (!file || !maxSize || !userId) return;
    if (file.size / mb > maxSize) {
      return setUploadErrorType('size');
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

      if (uploadErrorType) setUploadErrorType('');
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
