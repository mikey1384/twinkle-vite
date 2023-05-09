import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import LegacyFormat from './LegacyFormat';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import { mentions } from './plugins';
import { Link } from 'react-router-dom';
import { Color } from '~/constants/css';
import { useContentState, useTheme } from '~/helpers/hooks';
import { useContentContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';

const BodyRef = document.scrollingElement || document.documentElement;
const readMoreLabel = localize('readMore');
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
const legacySizeRegex =
  /(?:h\[(.+?)\]h|b\[(.+?)\]b|o\[(.+?)\]o|s\[(.+?)\]s|t\[(.+?)\]t)/;
const legacyColorRegexObj: { [K in Color]: RegExp } = {
  blue: /(?:b\|)([\s\S]+?)(?:\|b)/,
  gray: /(?:gr\|)([\s\S]+?)(?:\|gr)/,
  green: /(?:g\|)([\s\S]+?)(?:\|g)/,
  lime: /(?:l\|)([\s\S]+?)(?:\|l)/,
  logoBlue: /(?:lb\|)([\s\S]+?)(?:\|lb)/,
  orange: /(?:o\|)([\s\S]+?)(?:\|o)/,
  passionFruit: /(?:pf\|)([\s\S]+?)(?:\|pf)/,
  pink: /(?:p\|)([\s\S]+?)(?:\|p)/,
  purple: /(?:pu\|)([\s\S]+?)(?:\|pu)/,
  red: /(?:r\|)([\s\S]+?)(?:\|r)/,
  yellow: /(?:y\|)([\s\S]+?)(?:\|y)/
};
const legacyColorRegex = new RegExp(
  Object.values(legacyColorRegexObj)
    .map((regex) => `(?:${regex.source})`)
    .join('|')
);
const legacyFormatRegex = new RegExp(
  `(${legacySizeRegex.source})|(${legacyColorRegex.source})`
);

export default function RichText({
  style,
  className,
  cleanString,
  children: text,
  contentId,
  contentType,
  isUseNewFormat,
  isPreview,
  isStatusMsg,
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
  section?: string;
  maxLines?: number;
  readMoreHeightFixed?: boolean;
  readMoreColor?: string;
  theme?: string;
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    statusMsgLink: { color: statusMsgLinkColor },
    link: { color: linkColor }
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
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(
    null
  );
  const fullTextRef = useRef(fullTextState[section]);
  const [fullText, setFullText] = useState(
    isPreview ? false : fullTextState[section]
  );
  const [isOverflown, setIsOverflown] = useState<boolean | null>(null);
  useEffect(() => {
    setFullText(false);
    setIsOverflown(
      ContainerRef.current?.scrollHeight >
        ContainerRef.current?.clientHeight + 2
    );
  }, [text, isPreview]);

  useEffect(() => {
    if (fullTextState[section] && !isPreview) {
      fullTextRef.current = true;
      setFullText(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview]);

  useEffect(() => {
    if (fullText && typeof savedScrollPosition === 'number') {
      const appElement = document.getElementById('App');
      if (appElement) appElement.scrollTop = savedScrollPosition;
      BodyRef.scrollTop = savedScrollPosition;
      setSavedScrollPosition(null);
    }
  }, [fullText, savedScrollPosition]);

  useEffect(() => {
    return function saveFullTextStateBeforeUnmount() {
      if (contentType && section && fullTextRef.current) {
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

  const isUseLegacyFormat = useMemo(() => {
    return !isUseNewFormat && legacyFormatRegex.test(text);
  }, [isUseNewFormat, text]);

  return (
    <ErrorBoundary componentPath="components/Texts/RichText">
      <div
        ref={ContainerRef}
        style={{
          width: '100%',
          ...style
        }}
        className={`${className} ${css`
          width: 100%;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          word-break: break-word;
          line-height: 1.5;
          a {
            color: ${Color[isStatusMsg ? statusMsgLinkColor : linkColor]()};
          }
          p {
            margin: 0;
          }
          ${fullText
            ? ''
            : `max-height: calc(1.5em * ${maxLines});
                overflow: hidden;
                &:after {
                  width: 100%;
                  height: 1.4em;
                  background-image: linear-gradient(
                    to bottom,
                    rgba(255, 255, 255, 0),
                    rgba(255, 255, 255, 1) 80%
                  );
                }`}
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
            line-height: 1.2;
            list-style-type: disc;
            padding-left: 1.5rem;
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
            padding-left: 1.5rem;
          }
          li {
            margin-left: 1rem;
          }
        `}`}
      >
        {cleanString ? (
          text
        ) : isUseLegacyFormat ? (
          <LegacyFormat
            text={text}
            fullText={fullText}
            isOverflown={isOverflown}
          />
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkEmoji, mentions]}
            components={{
              a: (props: any) => {
                const { isInternalLink, replacedLink } = processInternalLink(
                  props.href
                );
                return isInternalLink || props.className === 'mention' ? (
                  <Link to={replacedLink}>{props.children}</Link>
                ) : (
                  <a
                    style={{
                      color:
                        Color[isStatusMsg ? statusMsgLinkColor : linkColor]()
                    }}
                    href={props.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {props.children}
                  </a>
                );
              },
              code: (props: any) => {
                const filteredChildren = removeNbsp(props.children);
                return <code>{filteredChildren}</code>;
              },
              input: (props: any) => {
                return (
                  <input {...props} onChange={() => null} disabled={false} />
                );
              },
              li: (props: any) => {
                return (
                  <li>
                    {props.children.map((child: any) =>
                      typeof child === 'string'
                        ? child.split('').map((text, index) => {
                            return /\n/gi.test(text) && index === 0 ? '' : text;
                          })
                        : child
                    )}
                  </li>
                );
              },
              em: (props: any) => {
                return <strong>{props.children}</strong>;
              },
              strong: (props: any) => {
                return <em>{props.children}</em>;
              },
              table: (props: any) => {
                return (
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <table
                      style={{ borderCollapse: 'collapse' }}
                      className={css`
                        margin-top: 1.5rem;
                        min-width: 25vw;
                        width: 85%;
                        max-width: 100%;
                        tr {
                          display: table-row;
                          width: 100%;
                        }
                        th,
                        td {
                          text-align: center;
                          width: 33%;
                          border: 1px solid ${Color.borderGray()};
                          padding: 0.5rem;
                          white-space: nowrap;
                          &:first-child {
                            width: 2%;
                          }
                        }
                        td img {
                          width: 100%;
                          height: auto;
                        }
                      `}
                    >
                      {props.children}
                    </table>
                  </div>
                );
              }
            }}
          >
            {convertLineBreak(text)}
          </ReactMarkdown>
        )}
      </div>
      <div
        style={{
          height: 'auto',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {!fullText && isOverflown && (
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
              setFullText(true);
              fullTextRef.current = true;
            }}
          >
            {readMoreLabel}
          </a>
        )}
      </div>
    </ErrorBoundary>
  );

  function processInternalLink(url: string) {
    const regex =
      /^(https?:\/\/(?:www\.)?|www\.)(twin-kle\.com|twinkle\.network|localhost:3000)/;
    const isInternalLink = regex.test(url);
    const replacedLink = url.replace(regex, '');
    return { isInternalLink, replacedLink };
  }

  function convertLineBreak(text: string) {
    const maxNbsp = 10;
    let nbspCount = 0;
    return text.replace(/\n/gi, () => {
      nbspCount++;
      if (nbspCount > 1 && nbspCount < maxNbsp) {
        return '&nbsp;\n';
      } else {
        return '\n';
      }
    });
  }
  function removeNbsp(content: any): any {
    if (Array.isArray(content)) {
      return content.map(removeNbsp);
    }

    if (typeof content === 'string') {
      return content.replace(/&nbsp;/gi, '').replace(/```/, '');
    }

    return content;
  }
}
