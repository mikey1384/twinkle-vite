import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import Markdown from './Markdown';
import { css } from '@emotion/css';

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

  const renderedText = useMemo(() => {
    const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
    return text.replace(linkRegex, (_, text: string) => text);
  }, [text]);

  const handleSetContainerRef = useCallback(
    (node: HTMLDivElement) => {
      if (node !== null) {
        containerRef.current = node;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          onSetContainerNode(node);
        }, 100);
      }
    },
    [onSetContainerNode]
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
      word-break: break-word;
      line-height: 1.7;
      overflow: hidden;
      max-height: calc(1.5em * ${maxLines});
    `,
    [maxLines]
  );

  return (
    <div ref={handleSetContainerRef} className={containerStyle}>
      <Markdown
        isInvisible
        contentId={contentId}
        contentType={contentType}
        isProfileComponent={isProfileComponent}
        isAIMessage={isAIMessage}
        linkColor={linkColor}
        markerColor={markerColor}
        onSetIsParsed={onSetIsParsed}
      >
        {renderedText}
      </Markdown>
    </div>
  );
}
