import React, {
  lazy,
  Suspense,
  useMemo,
  useCallback,
  useRef,
  useEffect
} from 'react';
import { css } from '@emotion/css';

const Markdown = lazy(() => import('./Markdown'));

export default function InvisibleTextContainer({
  contentId,
  contentType,
  isAIMessage,
  isProfileComponent,
  linkColor,
  markerColor,
  text,
  maxLines,
  onSetContainerNode,
  onSetIsParsed
}: {
  contentId?: string | number;
  contentType?: string;
  isAIMessage?: boolean;
  isProfileComponent?: boolean;
  linkColor: string;
  markerColor: string;
  text: string;
  maxLines: number;
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

  const renderedText = useMemo(() => {
    const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
    return text.replace(linkRegex, (_, text: string) => text);
  }, [text]);

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
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
      max-height: calc(1.5em * ${maxLines});
    `,
    [maxLines]
  );

  return (
    <div ref={handleSetContainerRef} className={containerStyle}>
      <Suspense fallback={null}>
        <Markdown
          isInvisible
          contentId={contentId}
          contentType={contentType}
          isProfileComponent={isProfileComponent}
          isAIMessage={isAIMessage}
          linkColor={linkColor}
          markerColor={markerColor}
          onSetIsParsed={handleSetIsParsed}
        >
          {renderedText}
        </Markdown>
      </Suspense>
    </div>
  );
}
