import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import Markdown from './Markdown';
import InvisibleTextContainer from './InvisibleTextContainer';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { returnTheme } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
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
  isAIMessage?: boolean;
  section?: string;
  maxLines?: number;
  readMoreHeightFixed?: boolean;
  readMoreColor?: string;
  theme?: string;
  voice?: string;
}) {
  text = text || '';
  const textToSpeech = useAppContext((v) => v.requestHelpers.textToSpeech);
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
  const [preparing, setPreparing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const TextRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const handleAudioClick = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
    } else {
      setPreparing(true);
      try {
        const data = await textToSpeech(text, voice);
        const audioUrl = URL.createObjectURL(data);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audioRef.current.play();
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
        setIsPlaying(true);
      } catch (error) {
        console.error(error);
      } finally {
        setPreparing(false);
      }
    }
  };

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
      {isAIMessage && (
        <div style={{ position: 'absolute', bottom: '-3rem', right: 0 }}>
          <Button loading={preparing} skeuomorphic onClick={handleAudioClick}>
            <Icon icon={isPlaying ? 'stop' : 'volume'} />
          </Button>
        </div>
      )}
    </ErrorBoundary>
  );
}

export default memo(RichText);
