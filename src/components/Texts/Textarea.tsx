import React, { useState, useRef, useEffect } from 'react';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { getImageAttachmentIdFromDataTransfer } from '~/helpers/imageAttachmentEmbedHelpers';
import useEmbedFileUpload from '~/helpers/hooks/useEmbedFileUpload';

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
  onAttachmentDrop,
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
  onDrop?: (
    filePath: string,
    options?: { fromAttachment?: boolean }
  ) => void;
  onAttachmentDrop?: (attachmentId: string) => Promise<void> | void;
  theme?: string;
  disableFocusGlow?: boolean;
  disableAutoResize?: boolean;
}) {
  const dropEnabled = !!onDrop || !!onAttachmentDrop;
  const {
    uploadForEmbed,
    uploading,
    normalizedProgress,
    uploadErrorType,
    errorModalContent
  } = useEmbedFileUpload();
  const [isDragging, setIsDragging] = useState(false);
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
  const textareaSizingStyleKey = getTextareaSizingStyleKey(style);

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

  useEffect(() => {
    cachedStylesRef.current = null;
  }, [className, textareaSizingStyleKey, theme]);

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
    textareaSizingStyleKey,
    theme
  ]);

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
        onDrop={dropEnabled ? handleDrop : undefined}
        onPaste={(e) => {
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
              setTimeout(() => {
                if (el) {
                  el.offsetHeight; // Force reflow
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

          // iOS: while focused, do not run the delayed shrink/reflow routine.
          // It can make Safari adjust the page scroll under the open keyboard.
          if (isIOS) {
            if (idleTimerRef.current) {
              clearTimeout(idleTimerRef.current);
              idleTimerRef.current = null;
            }
          }

          if (rest.onInput) (rest.onInput as any)(e);
        }}
        onFocus={(e) => {
          isFocusedRef.current = true;
          if (rest.onFocus) (rest.onFocus as any)(e);
        }}
        onBlur={(e) => {
          isFocusedRef.current = false;
          if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
          }
          if (isIOS) {
            // On iOS, delayed shrinking avoids keyboard/layout scroll jumps while
            // typing; blur is the safe point to reconcile height.
            allowShrinkRef.current = true;
            scheduleResize(true);
          }
          if (rest.onBlur) (rest.onBlur as any)(e);
        }}
        onDragEnter={() => {
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          if (!dropEnabled) return;
          event.preventDefault();
          event.stopPropagation();
          if (!isDragging) {
            setIsDragging(true);
          }
        }}
        onDragLeave={() => {
          setIsDragging(false);
        }}
        style={{
          color: hasError ? Color.red() : undefined,
          border: hasError
            ? `1px solid ${Color.red()}`
            : dropEnabled
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
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
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
          &.home-feed-comment-intent-target:not(:focus) {
            border-color: var(--ui-border-strong);
            box-shadow: 0 0 0 3px ${Color.logoBlue(0.16)};
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
    if (onAttachmentDrop) {
      const attachmentId = getImageAttachmentIdFromDataTransfer(e.dataTransfer);
      if (attachmentId) {
        await onAttachmentDrop(attachmentId);
        return;
      }
    }
    if (!onDrop) return;
    const fromAttachment = !!draggedFile;
    const file = draggedFile || e.dataTransfer.files[0];
    if (file) {
      setIsDragging(false);
      const url = await uploadForEmbed(file);
      if (url) onDrop(url, { fromAttachment });
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
        'image/bmp': 'bmp',
        'image/tiff': 'tiff',
        'image/avif': 'avif',
        'image/svg+xml': 'svg',
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

        uploadForEmbed(file).then((url) => {
          if (url) onDrop?.(url);
        });
      }
    };

    if (fileItems.length > 0) {
      uploadFromItems(fileItems);
    }
  }
}

function getTextareaSizingStyleKey(style?: React.CSSProperties) {
  if (!style) return '';

  const sizingKeys: (keyof React.CSSProperties)[] = [
    'height',
    'minHeight',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'letterSpacing',
    'lineHeight',
    'textIndent',
    'textTransform',
    'whiteSpace',
    'wordSpacing'
  ];

  return sizingKeys
    .map((key) => `${key}:${String(style[key] ?? '')}`)
    .join('|');
}
