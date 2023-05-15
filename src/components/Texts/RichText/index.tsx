import React, { Fragment, useEffect, useRef, useState } from 'react';
import Markdown from './Markdown';
import { Color } from '~/constants/css';
import { useContentState, useTheme } from '~/helpers/hooks';
import { useContentContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';

const BodyRef = document.scrollingElement || document.documentElement;
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
  section?: string;
  maxLines?: number;
  readMoreHeightFixed?: boolean;
  readMoreColor?: string;
  theme?: string;
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    statusMsgLink: { color: statusMsgLinkColor },
    link: { color: linkColor },
    listItemMarker: { color: listItemMarkerColor },
    statusMsgListItemMarker: { color: statusMsgListItemMarkerColor }
  } = useTheme(theme || profileTheme);

  const onSetFullTextState = useContentContext(
    (v) => v.actions.onSetFullTextState
  );
  const ContainerRef: React.RefObject<any> = useRef(null);
  const contentState =
    contentType && section
      ? useContentState({ contentType, contentId: contentId as number })
      : {};
  const { fullTextState = {} } = contentState;
  const [Content, setContent] = useState<any>(<>{text}</>);
  const [isParsed, setIsParsed] = useState(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(
    null
  );
  const fullTextRef = useRef(fullTextState[section]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fullTextShown, setFullTextShown] = useState<boolean>(
    isPreview ? false : fullTextState[section]
  );
  const [isOverflown, setIsOverflown] = useState<boolean | null>(
    !!fullTextShown
  );
  const overflownRef = useRef(isOverflown);
  useEffect(() => {
    if (!overflownRef.current) {
      const overflown =
        ContainerRef.current?.scrollHeight >
        ContainerRef.current?.clientHeight + 30;
      if (!fullTextRef.current) {
        setFullTextShown(!overflown);
      }
      setIsOverflown(overflown);
      if (!isPreview) {
        overflownRef.current = overflown;
      }
    }
  }, [Content, imageLoaded, text, isPreview, maxLines]);

  useEffect(() => {
    if (fullTextState[section] && !isPreview) {
      fullTextRef.current = true;
      setFullTextShown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview]);

  useEffect(() => {
    if (fullTextShown && typeof savedScrollPosition === 'number') {
      const appElement = document.getElementById('App');
      if (appElement) appElement.scrollTop = savedScrollPosition;
      BodyRef.scrollTop = savedScrollPosition;
      setSavedScrollPosition(null);
    }
  }, [fullTextShown, savedScrollPosition]);

  useEffect(() => {
    return function saveFullTextStateBeforeUnmount() {
      if (contentType && section) {
        onSetFullTextState({
          contentId,
          contentType,
          section,
          fullTextShown: fullTextRef.current
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary
      style={{ width: '100%' }}
      componentPath="components/Texts/RichText"
    >
      <div
        ref={ContainerRef}
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
          line-height: 1.6;
          a {
            color: ${Color[isStatusMsg ? statusMsgLinkColor : linkColor]()};
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
              color: ${Color[
                isStatusMsg ? statusMsgListItemMarkerColor : listItemMarkerColor
              ]()};
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
            isStatusMsg={!!isStatusMsg}
            isProfileComponent={isProfileComponent}
            statusMsgLinkColor={statusMsgLinkColor}
            linkColor={linkColor}
            listItemMarkerColor={listItemMarkerColor}
            statusMsgListItemMarkerColor={statusMsgListItemMarkerColor}
            Content={Content}
            onSetContent={(content) => {
              setIsParsed(true);
              setContent(content);
            }}
            onSetImageLoaded={setImageLoaded}
          >
            {text}
          </Markdown>
        )}
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
            style={{
              fontWeight: 'bold',
              cursor: 'pointer',
              color: readMoreColor || Color[linkColor](),
              display: 'inline',
              paddingTop: '1rem'
            }}
            onClick={() => {
              const appElement = document.getElementById('App');
              setSavedScrollPosition(
                appElement?.scrollTop || BodyRef.scrollTop || 0
              );
              setFullTextShown((shown) => !shown);
              fullTextRef.current = !fullTextRef.current;
            }}
          >
            {fullTextShown ? 'Show Less' : 'Show More'}
          </a>
        )}
      </div>
    </ErrorBoundary>
  );
}
