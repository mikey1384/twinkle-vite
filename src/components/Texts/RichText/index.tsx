import React, { useEffect, useMemo, useRef, useState } from 'react';
import Markdown from './Markdown';
import { Color } from '~/constants/css';
import { useContentState } from '~/helpers/hooks';
import { returnTheme } from '~/helpers';
import { useContentContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
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

export default function RichText({
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
  contentId?: number;
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
  const onSetFullTextState = useContentContext(
    (v) => v.actions.onSetFullTextState
  );
  const contentState =
    contentType && section
      ? useContentState({ contentType, contentId: contentId as number })
      : {};
  const { fullTextState = {} } = contentState;
  const [isParsed, setIsParsed] = useState(false);
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

  useEffect(() => {
    return function saveFullTextStateBeforeUnmount() {
      if (contentType && section) {
        onSetFullTextState({
          contentId,
          contentType,
          section,
          fullTextShown: fullTextShownRef.current,
          textLength: text.length
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appliedLinkColor = useMemo(
    () => Color[isStatusMsg ? statusMsgLinkColor : linkColor](),
    [isStatusMsg, linkColor, statusMsgLinkColor]
  );

  const markerColor = useMemo(
    () =>
      Color[isStatusMsg ? statusMsgListItemMarkerColor : listItemMarkerColor](),
    [isStatusMsg, listItemMarkerColor, statusMsgListItemMarkerColor]
  );
  const renderedText = useMemo(() => {
    const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
    return text.replace(linkRegex, (_: any, text: string) => text);
  }, [text]);

  const InvisibleTextContainer = useMemo(() => {
    return (
      <div
        ref={handleSetContainerRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          lineHeight: 1.7,
          maxHeight: `calc(1.5em * ${maxLines})`,
          overflow: 'hidden'
        }}
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
  }, [maxLines, renderedText]);

  return (
    <ErrorBoundary
      style={{ width: '100%' }}
      componentPath="components/Texts/RichText"
    >
      <div
        style={{
          opacity: isParsed ? 1 : 0,
          width: '100%',
          ...style
        }}
        className={`${className} ${css`
          width: 100%;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          word-break: break-word;
          line-height: 1.7;
          .katex-html {
            display: none !important;
          }
          a {
            color: ${appliedLinkColor};
          }
          p {
            margin: 0;
          }
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
        {cleanString ? (
          text
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
            {text}
          </Markdown>
        )}
        {InvisibleTextContainer}
      </div>
      <div
        style={{
          height: 'auto',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {isOverflown && (
          <a
            className="unselectable"
            style={{
              fontWeight: 'bold',
              cursor: 'pointer',
              color: readMoreColor || Color[linkColor](),
              display: 'inline',
              paddingTop: '1rem'
            }}
            onClick={() => {
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
