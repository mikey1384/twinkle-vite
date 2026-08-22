import React, {
  Suspense,
  useMemo,
  useCallback,
  useRef,
  useEffect
} from 'react';
import { css } from '@emotion/css';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import type {
  RichTextEmbedPreviewMode,
  RichTextSubjectPreviewVariant
} from './embedPreviewMode';

const Markdown = lazyWithRetry(() => import('./Markdown'));

export function stripMarkdownLinkUrls(text: string) {
  const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
  return text.replace(linkRegex, (_, label: string) => label);
}

export default function InvisibleTextContainer({
  collapsedMaxHeight,
  contentId,
  contentType,
  embedPreviewMode,
  isAIMessage,
  isPreview,
  isProfileComponent,
  linkColor,
  markerColor,
  subjectPreviewVariant,
  theme,
  text,
  onSetContainerNode,
  onSetIsParsed
}: {
  collapsedMaxHeight: string;
  contentId?: string | number;
  contentType?: string;
  embedPreviewMode?: RichTextEmbedPreviewMode;
  isAIMessage?: boolean;
  isPreview?: boolean;
  isProfileComponent?: boolean;
  linkColor: string;
  markerColor: string;
  subjectPreviewVariant?: RichTextSubjectPreviewVariant;
  theme?: string;
  text: string;
  onSetContainerNode: (node: HTMLDivElement) => void;
  onSetIsParsed: (isParsed: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const parsedRef = useRef(false);

  const scheduleContainerNodeUpdate = useCallback(
    (node: HTMLDivElement) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        onSetContainerNode(node);
      }, 100);
    },
    [onSetContainerNode]
  );

  const renderedText = useMemo(() => stripMarkdownLinkUrls(text), [text]);

  const handleSetContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node === null) return;

      containerRef.current = node;
      if (parsedRef.current) {
        scheduleContainerNodeUpdate(node);
      }
    },
    [scheduleContainerNodeUpdate]
  );

  const handleSetIsParsed = useCallback(
    (isParsed: boolean) => {
      parsedRef.current = isParsed;
      onSetIsParsed(isParsed);
      if (isParsed && containerRef.current) {
        scheduleContainerNodeUpdate(containerRef.current);
      }
    },
    [onSetIsParsed, scheduleContainerNodeUpdate]
  );

  useEffect(() => {
    const node = containerRef.current;
    const resizeObserver =
      node && typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            if (parsedRef.current) {
              scheduleContainerNodeUpdate(node);
            }
          })
        : null;
    if (resizeObserver && node) {
      resizeObserver.observe(node);
    }

    return () => {
      resizeObserver?.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [scheduleContainerNodeUpdate]);

  const containerStyle = useMemo(
    () => css`
      position: absolute;
      white-space: pre-wrap;
      visibility: hidden;
      width: 100%;
      overflow-wrap: break-word;
      overflow-wrap: anywhere;
      word-break: break-word;
      line-height: 1.7;
      overflow: hidden;
      max-height: ${collapsedMaxHeight};
    `,
    [collapsedMaxHeight]
  );

  return (
    <div ref={handleSetContainerRef} className={containerStyle}>
      <Suspense fallback={null}>
        <Markdown
          isInvisible
          contentId={contentId}
          contentType={contentType}
          embedPreviewMode={embedPreviewMode}
          isPreview={isPreview}
          isProfileComponent={isProfileComponent}
          isAIMessage={isAIMessage}
          linkColor={linkColor}
          markerColor={markerColor}
          subjectPreviewVariant={subjectPreviewVariant}
          theme={theme}
          onSetIsParsed={handleSetIsParsed}
        >
          {renderedText}
        </Markdown>
      </Suspense>
    </div>
  );
}
