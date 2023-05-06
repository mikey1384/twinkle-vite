import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import { mentions, legacyTextSize, legacyTextColor } from './plugins';
import { Link } from 'react-router-dom';
import { Color } from '~/constants/css';
import { useContentState, useTheme } from '~/helpers/hooks';
import { useContentContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';

const readMoreLabel = localize('readMore');

export default function LongText({
  style,
  className,
  cleanString,
  children: text,
  contentId,
  contentType,
  isPreview,
  isStatusMsg,
  maxLines = 10,
  section = '',
  readMoreHeightFixed,
  readMoreColor,
  theme
}: {
  style?: any;
  className?: string;
  cleanString?: boolean;
  children?: any;
  contentId?: number;
  contentType?: string;
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

  return (
    <ErrorBoundary componentPath="components/Texts/LongText">
      <div
        ref={ContainerRef}
        style={{
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          minWidth: '100%',
          width: 0,
          ...style
        }}
        className={`${className} ${css`
          p {
            margin: 0;
          }
          ${fullText
            ? ''
            : `display: -webkit-box;
          -webkit-line-clamp: ${maxLines};
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;`}
          img {
            width: 100%;
            max-height: 400px;
            display: block;
            object-fit: contain;
          }
        `}`}
      >
        {cleanString ? (
          text
        ) : (
          <ReactMarkdown
            remarkPlugins={[
              remarkGfm,
              remarkEmoji,
              mentions,
              legacyTextSize,
              legacyTextColor
            ]}
            components={{
              a: (props: any) => {
                const { isInternalLink, replacedLink } = processInternalLink(
                  props.href
                );
                return isInternalLink || props.className === 'mention' ? (
                  <Link
                    style={{
                      color:
                        Color[isStatusMsg ? statusMsgLinkColor : linkColor]()
                    }}
                    to={replacedLink}
                  >
                    {props.children}
                  </Link>
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
                        min-width: 25vw;
                        width: 80%;
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
          height: readMoreHeightFixed ? '2rem' : 'auto',
          display: 'flex',
          alignItems: 'center',
          paddingBottom: '1rem'
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
        return '\n';
      } else {
        return '\n';
      }
    });
  }
}
