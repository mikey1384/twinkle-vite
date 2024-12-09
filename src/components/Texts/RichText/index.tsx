import React, {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense
} from 'react';
import Markdown from './Markdown';
import AIAudioButton from './AIAudioButton';
import InvisibleTextContainer from './InvisibleTextContainer';
import Loading from '~/components/Loading';
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

const RichTextCss = css`
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  line-height: 1.7;
  position: relative;
  .katex-html {
    display: none !important;
  }
  p {
    margin: 0;
  }
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
`;

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
  isShowMoreButtonCentered,
  voice,
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
  isShowMoreButtonCentered?: boolean;
  isAIMessage?: boolean;
  section?: string;
  maxLines?: number;
  readMoreHeightFixed?: boolean;
  readMoreColor?: string;
  theme?: string;
  voice?: string;
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
  const defaultMinHeightRef = useRef(defaultMinHeight);
  const [isParsed, setIsParsed] = useState(false);
  const TextRef = useRef<any>(null);
  const minHeightRef = useRef(defaultMinHeight);
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
  const thresholdRef = useRef<number | null>(null);
  const embeddedContentRef = useRef<HTMLDivElement | null>(null);
  const [hasTopEmbeddedContent, setHasTopEmbeddedContent] = useState(false);

  useEffect(() => {
    if (text.length < prevFullTextLength) {
      setFullTextShown(false);
      fullTextShownRef.current = false;
      setIsOverflown(false);
    }
  }, [text, prevFullTextLength]);

  useEffect(() => {
    if (containerNode && !fullTextShown) {
      if (!thresholdRef.current) {
        thresholdRef.current = containerNode.clientHeight;
      }

      let threshold = thresholdRef.current;
      if (!isPreview && hasTopEmbeddedContent && embeddedContentRef.current) {
        threshold += embeddedContentRef.current.offsetHeight;
      }

      const overflown = containerNode.scrollHeight > threshold;
      setFullTextShown(!overflown);
      setIsOverflown(overflown);
      if (!isPreview) {
        overflownRef.current = overflown;
      }
    }
  }, [isPreview, fullTextShown, containerNode, hasTopEmbeddedContent]);

  useEffect(() => {
    const visibleHeight = TextRef.current.clientHeight;
    if (containerNode && isParsed) {
      const hasEmbeddedContent = containerNode.querySelector(
        'img, iframe, video, audio'
      );
      if (!hasEmbeddedContent) {
        const heightToApply = isOverflown ? visibleHeight - 20 : visibleHeight;
        TextRef.current.style.height = fullTextShown
          ? 'auto'
          : `${heightToApply}px`;
      } else {
        TextRef.current.style.height = fullTextShown ? 'auto' : visibleHeight;
      }
    } else if (!isParsed) {
      TextRef.current.style.height = fullTextShown
        ? 'auto'
        : visibleHeight - 20;
    } else {
      TextRef.current.style.height = 'auto';
    }
  }, [containerNode, fullTextShown, isOverflown, isParsed]);

  const appliedLinkColor = useMemo(
    () => Color[isStatusMsg ? statusMsgLinkColor : linkColor](),
    [isStatusMsg, linkColor, statusMsgLinkColor]
  );

  const markerColor = useMemo(
    () =>
      Color[isStatusMsg ? statusMsgListItemMarkerColor : listItemMarkerColor](),
    [isStatusMsg, listItemMarkerColor, statusMsgListItemMarkerColor]
  );

  useEffect(() => {
    let resizeObserver: any;
    if (
      typeof ResizeObserver === 'function' &&
      TextRef.current &&
      !defaultMinHeightRef.current
    ) {
      resizeObserver = new ResizeObserver((entries) => {
        const clientHeight = entries[0].target.clientHeight;
        const newHeight = clientHeight;
        setMinHeight(newHeight);
      });
      resizeObserver.observe(TextRef.current);
    }
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    minHeightRef.current = minHeight;
  }, [minHeight]);

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
          // eslint-disable-next-line react-hooks/exhaustive-deps
          [section]: defaultMinHeightRef.current || minHeightRef.current
        };
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markdownContent = useMemo(() => {
    if (cleanString) {
      return text;
    }
    return (
      <Suspense fallback={<Loading />}>
        <Markdown
          contentId={contentId}
          contentType={contentType}
          isProfileComponent={isProfileComponent}
          isAIMessage={isAIMessage}
          linkColor={appliedLinkColor}
          markerColor={markerColor}
          onSetIsParsed={setIsParsed}
          embeddedContentRef={embeddedContentRef}
          onSetHasTopEmbeddedContent={setHasTopEmbeddedContent}
        >
          {text}
        </Markdown>
      </Suspense>
    );
  }, [
    appliedLinkColor,
    cleanString,
    contentId,
    contentType,
    isAIMessage,
    isProfileComponent,
    markerColor,
    text
  ]);

  return (
    <ErrorBoundary
      style={{ width: '100%', position: 'relative' }}
      componentPath="components/Texts/RichText"
    >
      <div
        ref={TextRef}
        style={{
          opacity: isParsed ? 1 : 0,
          minHeight: !isParsed && minHeight ? `${minHeight}px` : undefined,
          maxHeight: fullTextShown ? undefined : `calc(1.5em * ${maxLines})`,
          overflow: fullTextShown ? undefined : 'hidden',
          ...style
        }}
        className={`${className} ${RichTextCss} ${css`
          a {
            color: ${appliedLinkColor};
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
        {!cleanString && (
          <ErrorBoundary componentPath="components/Texts/RichText/InvisibleTextContainer">
            <InvisibleTextContainer
              contentId={contentId}
              contentType={contentType}
              isAIMessage={isAIMessage}
              isProfileComponent={isProfileComponent}
              linkColor={appliedLinkColor}
              markerColor={markerColor}
              text={text}
              maxLines={maxLines}
              onSetContainerNode={setContainerNode}
              onSetIsParsed={setIsParsed}
            />
          </ErrorBoundary>
        )}
        <ErrorBoundary componentPath="components/Texts/RichText/Markdown">
          {markdownContent}
        </ErrorBoundary>
      </div>
      <div
        className={css`
          height: auto;
          display: flex;
          align-items: center;
          justify-content: ${isShowMoreButtonCentered
            ? 'center'
            : 'flex-start'};
        `}
      >
        {isOverflown && !isPreview && (
          <a
            style={{
              color: readMoreColor || appliedLinkColor
            }}
            className={`unselectable ${css`
              font-weight: bold;
              cursor: pointer;
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
      {isAIMessage && (
        <AIAudioButton
          contentKey={`${contentId}-${contentType}-${section}`}
          text={text}
          voice={voice}
        />
      )}
    </ErrorBoundary>
  );
}

export default memo(RichText);
