import React, { useMemo, useState, useRef, useEffect } from 'react';
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

const isIOS =
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

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
  const rafIdRef = useRef<number | null>(null);
  const isPastingRef = useRef(false);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastValueRef = useRef<string | undefined>(undefined);
  const allowShrinkRef = useRef(false);
  const isFocusedRef = useRef(false);
  const cachedStylesRef = useRef<{
    padding: number;
    lineHeight: number;
  } | null>(null);
  const scheduleResizeRef = useRef<(immediate?: boolean) => void>(() => {});

  const normalizedProgress = useMemo(() => {
    if (!Number.isFinite(uploadProgress) || uploadProgress <= 0) return 0;
    if (uploadProgress >= 1) return 1;
    return uploadProgress;
  }, [uploadProgress]);

  // Cache computed styles to avoid repeated style recalculations
  const getCachedStyles = (el: HTMLTextAreaElement) => {
    if (!cachedStylesRef.current) {
      const computed = window.getComputedStyle(el);
      const paddingTop = parseFloat(computed.paddingTop || '0');
      const paddingBottom = parseFloat(computed.paddingBottom || '0');
      let lineHeight = parseFloat(computed.lineHeight || '0');
      if (!lineHeight || Number.isNaN(lineHeight)) {
        const fontSize = parseFloat(computed.fontSize || '16');
        lineHeight = fontSize * 1.2;
      }
      cachedStylesRef.current = {
        padding: paddingTop + paddingBottom,
        lineHeight
      };
    }
    return cachedStylesRef.current;
  };

  // Core resize logic - separated to avoid recreating on every render
  const doResize = () => {
    const el = textareaRef.current;
    if (!el) return;

    const { padding, lineHeight } = getCachedStyles(el);
    const baseMinHeight = lineHeight * (minRows || 1) + padding;

    if (disableAutoResize) {
      el.style.height = '';
      el.style.minHeight = `${baseMinHeight}px`;
      el.style.overflowY = 'auto';
      return;
    }

    // On iOS while focused, avoid the height=0 measurement trick - it causes layout
    // thrashing and scroll jumps. Just check if content overflows.
    // On desktop, we can do full resize even while focused.
    // Exception: Allow full resize on iOS if allowShrinkRef is true (idle timer expired or value cleared)
    // Use tracked focus state (isFocusedRef) instead of document.activeElement to avoid
    // momentary focus loss during cut/paste operations triggering unwanted shrinks
    if (isIOS && isFocusedRef.current && !allowShrinkRef.current) {
      const currentHeight = el.offsetHeight;
      // Only grow while typing on iOS, shrink happens on blur or after idle timeout
      if (el.scrollHeight > currentHeight) {
        const maxHeight = maxRows ? lineHeight * maxRows + padding : Infinity;
        const nextHeight = Math.min(el.scrollHeight, maxHeight);
        el.style.height = `${nextHeight}px`;
        el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
      }
      return;
    }
    // Reset allowShrink after using it
    allowShrinkRef.current = false;

    // Non-iOS or not focused: use standard measurement
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
  };

  // Debounced resize for iOS - prevents UI freeze during rapid updates
  const scheduleResize = (immediate = false) => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }

    if (immediate && !isIOS) {
      // Non-iOS: immediate resize is fine
      rafIdRef.current = requestAnimationFrame(() => {
        doResize();
        rafIdRef.current = null;
        isPastingRef.current = false;
      });
    } else {
      // iOS or deferred: use setTimeout to break out of the input event loop
      const delay = isPastingRef.current ? 100 : isIOS ? 50 : 0;
      resizeTimeoutRef.current = setTimeout(() => {
        rafIdRef.current = requestAnimationFrame(() => {
          doResize();
          rafIdRef.current = null;
          isPastingRef.current = false;
        });
      }, delay);
    }
  };

  // Keep ref in sync so ResizeObserver always uses latest resize logic
  scheduleResizeRef.current = scheduleResize;

  // Invalidate cached styles when style-affecting props change
  useEffect(() => {
    cachedStylesRef.current = null;
  }, [className, style, theme]);

  // Initial resize and value change handling
  useEffect(() => {
    const currentValue = String(rest.value ?? '');
    const previousValue = lastValueRef.current ?? '';

    // On iOS: only allow immediate shrinking when value is CLEARED (submission)
    // Normal character deletion should wait for idle timer
    if (isIOS && previousValue.length > 0 && currentValue.length === 0) {
      allowShrinkRef.current = true;
    }

    lastValueRef.current = currentValue;
    scheduleResize(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rest.value,
    maxRows,
    minRows,
    disableAutoResize,
    className,
    style,
    theme
  ]);

  // ResizeObserver for container width changes
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const container = el.parentElement || el;

    let ro: ResizeObserver | null = null;
    let fallbackHandler: (() => void) | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      let lastWidth = container.clientWidth;
      ro = new ResizeObserver((entries) => {
        const entry = entries[entries.length - 1];
        const nextWidth = Math.round(entry.contentRect.width);
        if (nextWidth !== Math.round(lastWidth)) {
          lastWidth = nextWidth;
          // Invalidate cached styles on width change
          cachedStylesRef.current = null;
          scheduleResizeRef.current(false);
        }
      });
      ro.observe(container);
    } else {
      fallbackHandler = () => {
        cachedStylesRef.current = null;
        scheduleResizeRef.current(false);
      };
      window.addEventListener('orientationchange', fallbackHandler, {
        passive: true
      });
      window.addEventListener('resize', fallbackHandler, { passive: true });
    }

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      ro?.disconnect();
      if (fallbackHandler) {
        window.removeEventListener('orientationchange', fallbackHandler);
        window.removeEventListener('resize', fallbackHandler);
      }
    };
  }, []);

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
        onPaste={(e) => {
          // Mark that we're pasting so resize uses longer delay
          isPastingRef.current = true;
          if (onDrop || (rest as any).onPaste) {
            handleCombinedPaste(e);
          }
          // Schedule resize after paste completes with delay
          scheduleResize(false);

          // iOS workaround: After paste, iOS's touch hit-testing can get stuck.
          // Force a layout recalculation to reset iOS gesture recognizer state.
          if (isIOS) {
            const el = textareaRef.current;
            if (el) {
              // Force reflow by reading offsetHeight then toggling a property
              setTimeout(() => {
                if (el) {
                  el.offsetHeight; // Force reflow
                  // Toggle transform to force layer recalculation
                  el.style.transform = 'translateZ(0)';
                  requestAnimationFrame(() => {
                    if (el) {
                      el.style.transform = '';
                    }
                  });
                }
              }, 150);
            }
          }
        }}
        onInput={(e) => {
          // Don't resize during paste - let the paste handler's delay take over
          if (!isPastingRef.current) {
            scheduleResize(false);
          }

          // iOS idle timer: after 3 seconds of no typing, allow shrinking
          if (isIOS) {
            if (idleTimerRef.current) {
              clearTimeout(idleTimerRef.current);
            }
            idleTimerRef.current = setTimeout(() => {
              allowShrinkRef.current = true;
              scheduleResize(true);
            }, 3000);
          }

          if (rest.onInput) (rest.onInput as any)(e);
        }}
        onFocus={(e) => {
          isFocusedRef.current = true;
          if (rest.onFocus) (rest.onFocus as any)(e);
        }}
        onBlur={(e) => {
          isFocusedRef.current = false;
          // Clear idle timer on blur
          if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
          }
          // Do a full resize when focus leaves to handle shrinking
          allowShrinkRef.current = true;
          scheduleResize(true);
          if (rest.onBlur) (rest.onBlur as any)(e);
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
