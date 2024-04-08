import React, { memo, useMemo } from 'react';
import Markdown from './Markdown';
import { css } from '@emotion/css';

function InvisibleTextContainer({
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
  const renderedText = useMemo(() => {
    const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
    return text.replace(linkRegex, (_: any, text: string) => text);
  }, [text]);

  return (
    <div
      ref={handleSetContainerRef}
      style={{ maxHeight: `calc(1.5em * ${maxLines})` }}
      className={css`
        position: absolute;
        white-space: pre-wrap;
        visibility: hidden;
        width: 100%;
        overflow-wrap: break-word;
        word-break: break-word;
        line-height: 1.7;
        overflow: hidden;
      `}
    >
      <Markdown
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
  function handleSetContainerRef(node: HTMLDivElement) {
    if (node !== null) {
      onSetContainerNode(node);
    }
  }
}

export default memo(InvisibleTextContainer);
