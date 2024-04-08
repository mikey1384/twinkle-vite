import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import Markdown from './Markdown';
import { Color } from '~/constants/css';
import { returnTheme } from '~/helpers';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { fullTextStates, richTextHeights } from '~/constants/state';
import ErrorBoundary from '~/components/ErrorBoundary';

type Color =
  | 'blue'
  | 'gray'
  | 'green'
  | 'lime'
  | 'logoBlue'
  | 'orange'
  | 'passionFruit'
  | 'pink'
  | 'purple'
  | 'red'
  | 'yellow';

function RichText({
  style,
  className,
  cleanString,
  children: text = '',
  contentId,
  contentType,
  isPreview,
  isStatusMsg,
  isProfileComponent,
  isAIMessage,
  maxLines = 10,
  section = '',
  readMoreColor,
  theme
}: {
  style?: React.CSSProperties;
  className?: string;
  cleanString?: boolean;
  children?: any;
  contentId?: number | string;
  contentType?: string;
  isUseNewFormat?: boolean;
  isPreview?: boolean;
  isStatusMsg?: boolean;
  isProfileComponent?: boolean;
  isAIMessage?: boolean;
  section?: string;
  maxLines?: number;
  readMoreHeightFixed?: boolean;
  readMoreColor?: string;
  theme?: string;
}) {
  text = text || '';
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    statusMsgLink: { color: statusMsgLinkColor },
    link: { color: linkColor },
    listItemMarker: { color: listItemMarkerColor },
    statusMsgListItemMarker: { color: statusMsgListItemMarkerColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(
    null
  );
  const fullTextState = useMemo(
    () => fullTextStates[`${contentType}-${contentId}`] || {},
    [contentId, contentType]
  );
  const defaultMinHeight = useMemo(
    () => richTextHeights[`${contentType}-${contentId}`]?.[section],
    [contentType, contentId, section]
  );
  const [isParsed, setIsParsed] = useState(false);
  const TextRef = useRef(null);
  const [minHeight, setMinHeight] = useState(defaultMinHeight);
  const fullTextShownRef = useRef(fullTextState[section]?.fullTextShown);
  const [fullTextShown, setFullTextShown] = useState<boolean>(
    isPreview ? false : fullTextState[section]?.fullTextShown
  );
  const [isOverflown, setIsOverflown] = useState<boolean | null>(
    !!fullTextShown
  );
  const overflownRef = useRef(isOverflown);
  const prevFullTextLength = useMemo(
    () => fullTextState?.[section]?.textLength,
    [fullTextState, section]
  );

  useEffect(() => {
    if (text.length < prevFullTextLength) {
      setFullTextShown(false);
      fullTextShownRef.current = false;
      setIsOverflown(false);
    }
  }, [text, prevFullTextLength]);

  useEffect(() => {
    if (containerNode && !fullTextShown) {
      const overflown =
        containerNode.scrollHeight > containerNode.clientHeight + 30;
      setFullTextShown(!overflown);
      setIsOverflown(overflown);
      if (!isPreview) {
        overflownRef.current = overflown;
      }
    }
  }, [isPreview, fullTextShown, containerNode]);

  const appliedLinkColor = useMemo(
    () => Color[isStatusMsg ? statusMsgLinkColor : linkColor](),
    [isStatusMsg, linkColor, statusMsgLinkColor]
  );

  const markerColor = useMemo(
    () =>
      Color[isStatusMsg ? statusMsgListItemMarkerColor : listItemMarkerColor](),
    [isStatusMsg, listItemMarkerColor, statusMsgListItemMarkerColor]
  );

  const InvisibleTextContainer = useMemo(() => {
    const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
    const renderedText = cleanString
      ? text
      : text.replace(linkRegex, (_: any, text: string) => text);
    return (
      <div
        ref={handleSetContainerRef}
        className={css`
          position: absolute;
          white-space: pre-wrap;
          visibility: hidden;
          width: 100%;
          overflow-wrap: break-word;
          word-break: break-word;
          line-height: 1.7;
          max-height: calc(1.5em * ${maxLines});
          overflow: hidden;
        `}
      >
        {cleanString ? (
          renderedText
        ) : (
          <Markdown
            contentId={contentId}
            contentType={contentType}
            isProfileComponent={isProfileComponent}
            isAIMessage={isAIMessage}
            linkColor={appliedLinkColor}
            markerColor={markerColor}
            onSetIsParsed={setIsParsed}
          >
            {renderedText}
          </Markdown>
        )}
      </div>
    );
    function handleSetContainerRef(node: HTMLDivElement) {
      if (node !== null) {
        setContainerNode(node);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanString, maxLines, text]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const { contentRect } = entries[0];
      const newHeight = contentRect.height;
      setMinHeight(newHeight);
    });

    if (TextRef.current) {
      resizeObserver.observe(TextRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isParsed && containerNode?.clientHeight) {
      setMinHeight(containerNode?.clientHeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isParsed]);

  useEffect(() => {
    const key = `${contentType}-${contentId}`;
    return () => {
      if (contentType && section) {
        fullTextStates[key] = {
          ...fullTextStates[key],
          [section]: {
            fullTextShown: fullTextShownRef.current,
            textLength: text.length
          }
        };
        richTextHeights[key] = {
          ...richTextHeights[key],
          [section]: minHeight
        };
      }
    };
  }, [contentType, section, contentId, text, minHeight]);

  return (
    <ErrorBoundary
      style={{ width: '100%' }}
      componentPath="components/Texts/RichText"
    >
      <div
        ref={TextRef}
        style={style}
        className={`${className} ${css`
          opacity: ${isParsed ? 1 : 0};
          width: 100%;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          word-break: break-word;
          line-height: 1.7;
          position: relative;
          .katex-html {
            display: none !important;
          }
          a {
            color: ${appliedLinkColor};
          }
          p {
            margin: 0;
          }
          ${minHeight ? `min-height: ${minHeight}px;` : ''}
          ${fullTextShown
            ? ''
            : `max-height: calc(1.5em * ${maxLines});
                overflow: hidden;`}
          img {
            width: 100%;
            max-height: 400px;
            display: block;
            object-fit: contain;
          }
          pre {
            white-space: pre-wrap;
            overflow-wrap: break-word;
            word-break: break-word;
            width: 100%;
          }
          ul {
            margin: 0;
            padding: 0;
            list-style-type: disc;
            list-style-position: inside;
          }
          ul ul {
            list-style-type: circle;
          }
          ul ul ul {
            list-style-type: square;
          }
          ol {
            margin: 0;
            padding: 0;
            list-style-type: decimal;
            list-style-position: outside;
            > li {
              margin-left: 3.5ch;
            }
          }
          li {
            > p {
              display: inline;
            }
            ::marker {
              font-family: 'Roboto', 'Noto Sans';
              color: ${markerColor};
            }
          }
        `}`}
      >
        <ErrorBoundary componentPath="components/Texts/RichText/InvisibleTextContainer">
          {InvisibleTextContainer}
        </ErrorBoundary>
        <ErrorBoundary componentPath="components/Texts/RichText/Markdown">
          {cleanString ? (
            <ErrorBoundary componentPath="components/Texts/RichText/Markdown/CleanString">
              {text}
            </ErrorBoundary>
          ) : (
            <ErrorBoundary componentPath="components/Texts/RichText/Markdown/Rendered">
              <Markdown
                contentId={contentId}
                contentType={contentType}
                isProfileComponent={isProfileComponent}
                isAIMessage={isAIMessage}
                linkColor={appliedLinkColor}
                markerColor={markerColor}
                onSetIsParsed={setIsParsed}
              >
                {text}
              </Markdown>
            </ErrorBoundary>
          )}
        </ErrorBoundary>
      </div>
      <div
        className={css`
          height: auto;
          display: flex;
          align-items: center;
        `}
      >
        {isOverflown && (
          <a
            className={`unselectable ${css`
              font-weight: bold;
              cursor: pointer;
              color: ${readMoreColor || Color[linkColor]()};
              display: inline;
              padding-top: 1rem;
            `}`}
            onClick={() => {
              setMinHeight(fullTextShown ? 0 : minHeight);
              setFullTextShown((shown) => !shown);
              fullTextShownRef.current = !fullTextShownRef.current;
            }}
          >
            {fullTextShown ? 'Show Less' : 'Show More'}
          </a>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(RichText);
