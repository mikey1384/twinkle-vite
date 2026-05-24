import React, {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense
} from 'react';
import AIAudioButton from './AIAudioButton';
import InvisibleTextContainer from './InvisibleTextContainer';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { fullTextStates, richTextHeights } from '~/constants/state';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import { mobileMaxWidth } from '~/constants/css';

const Markdown = lazyWithRetry(() => import('./Markdown'));

const collapsedLineHeight = 1.7;

function hasStructuredPreviewMarkdown(text: string) {
  return (
    /(^|\n)\s{0,3}#{1,6}\s+\S/.test(text) ||
    /(^|\n)\s{0,3}(?:[-*+]|\d+[.)])\s+\S/.test(text) ||
    /(^|\n)\s{0,3}>\s+\S/.test(text) ||
    /(^|\n)\s{0,3}(?:```|~~~)/.test(text) ||
    /(^|\n)\s{0,3}\|.+\|/.test(text) ||
    /\\\[|\\\(|\$\$/.test(text)
  );
}

type RichTextRootStyle = React.CSSProperties & {
  '--rich-text-line-height'?: number;
};

const RichTextCss = css`
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: var(--rich-text-line-height, ${collapsedLineHeight});
  position: relative;
  .katex-html {
    display: none !important;
  }
  .katex-display {
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 100%;
    padding: 0.5em 0;
  }
  p {
    margin: 0;
  }
  &.rich-text--compact-comment-embeds {
    .rich-text-embedded-component {
      box-sizing: border-box;
      align-items: stretch;
      max-width: 100%;
      min-width: 0;
      overflow: hidden;
      padding: 0.42rem 0;
    }
    .rich-text-embedded-component > * {
      box-sizing: border-box;
      max-width: 100%;
      min-width: 0;
    }
    .compact-main-content-embed--has-media,
    .compact-main-content-embed--build.compact-main-content-embed--has-media {
      grid-template-columns: minmax(0, 1fr) !important;
    }
    .compact-main-content-embed--build {
      min-height: 8.8rem;
      padding: 0.74rem;
    }
    .compact-main-content-embed--build strong {
      font-size: 1.2rem;
      line-height: 1.18;
    }
    .compact-main-content-embed--build p {
      font-size: 1.1rem;
      line-height: 1.3;
    }
    .compact-main-content-embed__media {
      aspect-ratio: 16 / 9;
      height: auto !important;
      min-height: 0 !important;
      max-height: 7.6rem !important;
    }
    .compact-main-content-embed--ai-story-card {
      min-height: 9.8rem;
      padding: 0.74rem;
    }
    .compact-main-content-embed--ai-story-has-image
      .compact-main-content-embed__story-main {
      grid-template-columns: minmax(0, 1fr);
    }
    .compact-main-content-embed__story-image-frame {
      aspect-ratio: 16 / 9;
      max-height: 6.8rem;
    }
    .compact-main-content-embed__story-title {
      font-size: 1.18rem;
      line-height: 1.24;
    }
    .compact-main-content-embed__story-body {
      max-height: 4.7rem;
      font-size: 1.1rem;
      line-height: 1.35;
      -webkit-line-clamp: 3;
    }
    .compact-ai-card-preview {
      grid-template-columns: 5.6rem minmax(0, 1fr);
      gap: 0.72rem;
      min-height: 9.8rem;
      padding: 0.76rem;
    }
    .compact-ai-card-preview__card-stage .compact-ai-card-thumb--static {
      width: 5.1rem !important;
      height: 7.2rem !important;
    }
    .compact-ai-card-preview__market {
      display: none;
    }
    .compact-ai-card-preview__details {
      align-items: flex-start;
      text-align: left;
    }
    .compact-ai-card-preview__header {
      justify-content: flex-start;
      max-width: 100%;
    }
    .compact-ai-card-preview__owner--inline {
      display: inline;
    }
    .compact-ai-card-preview__word {
      max-width: 100%;
      font-size: 1.18rem;
    }
    .compact-ai-card-preview__quality-line,
    .compact-ai-card-preview__prompt {
      font-size: 1.1rem;
    }
    .compact-ai-card-preview__prompt {
      margin: 0.12rem 0;
      -webkit-line-clamp: 2;
    }
    .compact-ai-card-multi {
      gap: 0.55rem;
      min-height: 12rem;
      padding: 0.74rem;
    }
    .compact-ai-card-multi__title {
      font-size: 1.1rem;
      line-height: 1.18;
    }
    .compact-ai-card-multi__preview {
      height: 8.9rem;
    }
    .compact-ai-card-multi__preview > div {
      transform: scale(0.68);
      transform-origin: center;
    }
    .compact-comment-embed--has-media,
    .compact-comment-embed--media-only {
      grid-template-columns: 3.8rem minmax(0, 1fr) !important;
    }
    .compact-comment-embed__media {
      grid-column: 1 / -1;
      aspect-ratio: 16 / 9;
      height: auto;
      min-height: 0;
      max-height: 7.2rem;
    }
    .compact-default-internal-embed__description,
    .compact-main-content-embed__attachment,
    .compact-ai-card-preview__summoned {
      display: none;
    }
  }
  p + p {
    margin-top: 1em;
  }
  p.rich-text-section-label {
    font-weight: 600;
  }
  p.rich-text-section-label:first-child {
    margin-top: 0;
  }
  p.rich-text-section-label:not(:first-child) {
    margin-top: 1.25em;
  }
  p.rich-text-section-label + p,
  p.rich-text-section-label + ul,
  p.rich-text-section-label + ol,
  p.rich-text-section-label + div {
    margin-top: 0.55em;
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 1.2em 0 0.45em;
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
    margin: 1em 0;
  }
  [data-codeblock] {
    width: 100%;
    margin: 1em 0;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style-type: disc;
    list-style-position: inside;
    > li {
      margin-left: 3.5ch;
      & + li {
        margin-top: 0.9em;
      }
    }
  }
  ul ul {
    list-style-type: circle;
  }
  ul ul ul {
    list-style-type: square;
  }
  p + ol,
  p + ul {
    margin-top: 1em;
  }
  ol {
    margin: 0;
    padding: 0;
    list-style-type: decimal;
    list-style-position: outside;
    > li {
      margin-left: 3.5ch;
      & + li {
        margin-top: 0.9em;
      }
    }
  }
  ol + p,
  ul + p {
    margin-top: 1em;
  }
`;

function RichText({
  style,
  className,
  cleanString,
  children: text = '',
  contentId,
  contentType,
  hideDictation,
  isPreview,
  isStatusMsg,
  isProfileComponent,
  isAIMessage,
  disableImageModal,
  isAudioButtonShown = true,
  aiActionPlacement = 'floating',
  compactEmbedPreview,
  isShowMoreButtonCentered,
  voice,
  maxLines = 10,
  mobileMaxLines,
  lineHeight,
  section = '',
  showMoreButtonStyle,
  readMoreColor,
  theme
}: {
  style?: React.CSSProperties;
  className?: string;
  cleanString?: boolean;
  children?: any;
  contentId?: number | string;
  contentType?: string;
  hideDictation?: boolean;
  isAudioButtonShown?: boolean;
  aiActionPlacement?: 'floating' | 'inline';
  compactEmbedPreview?: boolean;
  isUseNewFormat?: boolean;
  isPreview?: boolean;
  isStatusMsg?: boolean;
  isProfileComponent?: boolean;
  isShowMoreButtonCentered?: boolean;
  isAIMessage?: boolean;
  disableImageModal?: boolean;
  section?: string;
  maxLines?: number;
  mobileMaxLines?: number;
  lineHeight?: number;
  readMoreHeightFixed?: boolean;
  readMoreColor?: string;
  showMoreButtonStyle?: React.CSSProperties;
  theme?: string;
  voice?: string;
}) {
  text = text || '';
  const embedPreview = Boolean(isPreview || compactEmbedPreview);
  const {
    color: linkColor,
    colorKey: linkColorKey,
    themeName
  } = useRoleColor('link', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const { color: statusMsgLinkColor, colorKey: statusMsgLinkColorKey } =
    useRoleColor('statusMsgLink', {
      themeName,
      fallback: linkColor
    });
  const { color: listItemMarkerColor } = useRoleColor('listItemMarker', {
    themeName,
    fallback: 'darkerGray'
  });
  const { color: statusMsgListItemMarkerColor } = useRoleColor(
    'statusMsgListItemMarker',
    {
      themeName,
      fallback: 'white'
    }
  );
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(
    null
  );
  const isPreviewRef = useRef(isPreview);
  // Preview RichText is deterministic: no expansion state or shared height cache.
  const fullTextState = useMemo(
    () =>
      isPreview ? {} : fullTextStates[`${contentType}-${contentId}`] || {},
    [contentId, contentType, isPreview]
  );
  const defaultMinHeight = useMemo(
    () =>
      isPreview
        ? undefined
        : richTextHeights[`${contentType}-${contentId}`]?.[section],
    [contentType, contentId, isPreview, section]
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
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    isPreviewRef.current = isPreview;
  }, [isPreview]);

  const tooLongNonUrlToken = useMemo(() => {
    const tooLongNonUrlToken =
      /(^|\s)(?!https?:\/\/)(?!www\.)\S{400,}(?=\s|$)/i.test(text);
    return tooLongNonUrlToken;
  }, [text]);

  const hasMarkdownEmbed = useMemo(
    () => /!\[[^\]]*\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/.test(String(text)),
    [text]
  );
  const hasStructuredMarkdown = useMemo(
    () => hasStructuredPreviewMarkdown(String(text || '')),
    [text]
  );
  const isBlockPreservingPreview = Boolean(isPreview && hasStructuredMarkdown);
  const isLineClampedPreview = Boolean(
    isPreview && !hasMarkdownEmbed && !isBlockPreservingPreview
  );
  const previewMobileMaxLines = mobileMaxLines || maxLines;
  const effectiveCollapsedLineHeight = lineHeight ?? collapsedLineHeight;
  const previewCollapsedMaxHeight = `calc(${effectiveCollapsedLineHeight}em * ${maxLines})`;
  const previewMobileCollapsedMaxHeight = `calc(${effectiveCollapsedLineHeight}em * ${previewMobileMaxLines})`;
  const shouldUseBlockPreviewMaxHeight =
    isBlockPreservingPreview && !fullTextShown;

  useEffect(() => {
    if (isPreview) {
      return;
    }
    if (text.length < prevFullTextLength) {
      setFullTextShown(false);
      fullTextShownRef.current = false;
      setIsOverflown(false);
    }
  }, [isPreview, text, prevFullTextLength]);

  useEffect(() => {
    if (isPreview) {
      setFullTextShown(false);
      fullTextShownRef.current = false;
      setIsOverflown(false);
      return;
    }
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
    if (!TextRef.current) {
      return;
    }
    if (isPreview) {
      TextRef.current.style.height = '';
      return;
    }
    const visibleHeight = TextRef.current.clientHeight;
    if (containerNode && isParsed) {
      const hasEmbeddedContent = containerNode.querySelector(
        'img, iframe, video, audio'
      );
      if (!hasEmbeddedContent) {
        const heightToApply =
          isOverflown && !isPreview ? visibleHeight - 20 : visibleHeight;
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
  }, [containerNode, fullTextShown, isOverflown, isParsed, isPreview]);

  const appliedLinkColor = useMemo(
    () => (isStatusMsg ? statusMsgLinkColor : linkColor),
    [isStatusMsg, linkColor, statusMsgLinkColor]
  );

  const markerColor = useMemo(
    () => (isStatusMsg ? statusMsgListItemMarkerColor : listItemMarkerColor),
    [isStatusMsg, listItemMarkerColor, statusMsgListItemMarkerColor]
  );

  const showMoreButtonColorKey = useMemo(() => {
    if (readMoreColor) return 'logoBlue';
    if (isStatusMsg) return statusMsgLinkColorKey || 'white';
    return linkColorKey || 'logoBlue';
  }, [isStatusMsg, linkColorKey, readMoreColor, statusMsgLinkColorKey]);

  useEffect(() => {
    let resizeObserver: any;
    if (
      !isPreview &&
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
  }, [isPreview]);

  useEffect(() => {
    minHeightRef.current = minHeight;
  }, [minHeight]);

  useEffect(() => {
    const key = `${contentType}-${contentId}`;
    const defaultHeight = defaultMinHeightRef.current;
    return () => {
      if (isPreviewRef.current) {
        return;
      }
      if (contentType && section) {
        const heightToPersist = defaultHeight ?? minHeightRef.current;
        fullTextStates[key] = {
          ...fullTextStates[key],
          [section]: {
            fullTextShown: fullTextShownRef.current,
            textLength: text.length
          }
        };
        if (typeof heightToPersist === 'number') {
          richTextHeights[key] = {
            ...richTextHeights[key],
            [section]: heightToPersist
          };
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markdownContent = useMemo(() => {
    if (cleanString || tooLongNonUrlToken) {
      return text;
    }
    return (
      <Suspense fallback={<Loading />}>
        <Markdown
          contentId={contentId}
          contentType={contentType}
          isPreview={embedPreview}
          isProfileComponent={isProfileComponent}
          isAIMessage={isAIMessage}
          disableImageModal={disableImageModal}
          linkColor={appliedLinkColor}
          markerColor={markerColor}
          theme={theme}
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
    disableImageModal,
    embedPreview,
    isAIMessage,
    isProfileComponent,
    markerColor,
    theme,
    text,
    tooLongNonUrlToken
  ]);

  return (
    <ErrorBoundary
      style={{ width: '100%', position: 'relative' }}
      componentPath="components/Texts/RichText"
      autoRecoverDomMutationError
    >
      <div
        ref={TextRef}
        style={
          {
            opacity: isParsed || tooLongNonUrlToken ? 1 : 0,
            minHeight: !isParsed && minHeight ? `${minHeight}px` : undefined,
            maxHeight:
              fullTextShown ||
              isLineClampedPreview ||
              shouldUseBlockPreviewMaxHeight
                ? undefined
                : previewCollapsedMaxHeight,
            overflow: fullTextShown ? undefined : 'hidden',
            ...(lineHeight === undefined
              ? {}
              : { '--rich-text-line-height': lineHeight }),
            ...style
          } as RichTextRootStyle
        }
        className={`${className} ${
          compactEmbedPreview ? 'rich-text--compact-comment-embeds' : ''
        } ${
          isBlockPreservingPreview ? 'rich-text--block-preview' : ''
        } ${RichTextCss} ${css`
          ${shouldUseBlockPreviewMaxHeight
            ? `
              max-height: ${previewCollapsedMaxHeight};

              ${
                previewMobileMaxLines !== maxLines
                  ? `
                    @media (max-width: ${mobileMaxWidth}) {
                      max-height: ${previewMobileCollapsedMaxHeight};
                    }
                  `
                  : ''
              }
            `
            : ''}

          ${isBlockPreservingPreview
            ? `
              > h1:first-child,
              > h2:first-child,
              > h3:first-child,
              > h4:first-child,
              > h5:first-child,
              > h6:first-child,
              > p:first-child,
              > ul:first-child,
              > ol:first-child,
              > pre:first-child,
              > div:first-child {
                margin-top: 0;
              }

              > h1,
              > h2,
              > h3,
              > h4,
              > h5,
              > h6 {
                line-height: 1.18;
              }
            `
            : ''}
          ${isLineClampedPreview
            ? `
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: ${maxLines};
              position: relative;
              text-overflow: ellipsis;

              ${
                previewMobileMaxLines !== maxLines
                  ? `
                    @media (max-width: ${mobileMaxWidth}) {
                      -webkit-line-clamp: ${previewMobileMaxLines};
                    }
                  `
                  : ''
              }

              > p,
              > h1,
              > h2,
              > h3,
              > h4,
              > h5,
              > h6,
              > ol,
              > ul {
                display: inline;
              }

              > p + p::before {
                content: '\\A\\A';
                white-space: pre;
              }

              > ol,
              > ul {
                padding: 0;
              }

              > ol > li,
              > ul > li {
                display: inline;
                margin-left: 0;
              }

              > ol > li + li::before,
              > ul > li + li::before {
                content: ' ';
              }
            `
            : ''}
          a {
            color: ${appliedLinkColor};
          }
          li {
            > p {
              margin: 0;
            }
            > p:first-of-type {
              display: inline;
            }
            > p:not(:first-of-type) {
              display: block;
              margin-top: 0.65em;
            }
            > p:not(:first-of-type) > br:first-child {
              display: none;
            }
            ::marker {
              font-family: 'Roboto', 'Noto Sans';
              color: ${markerColor};
            }
          }
        `}`}
      >
        {!isPreview && !cleanString && !tooLongNonUrlToken && (
          <ErrorBoundary componentPath="components/Texts/RichText/InvisibleTextContainer">
            <InvisibleTextContainer
              contentId={contentId}
              contentType={contentType}
              isAIMessage={isAIMessage}
              isProfileComponent={isProfileComponent}
              linkColor={appliedLinkColor}
              markerColor={markerColor}
              isPreview={embedPreview}
              theme={theme}
              text={text}
              maxLines={maxLines}
              onSetContainerNode={setContainerNode}
              onSetIsParsed={setIsParsed}
            />
          </ErrorBoundary>
        )}
        <ErrorBoundary
          componentPath="components/Texts/RichText/Markdown"
          autoRecoverDomMutationError
        >
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
          <Button
            variant="soft"
            tone="raised"
            shape="pill"
            size="sm"
            uppercase={false}
            color={showMoreButtonColorKey}
            style={{
              marginTop: '1rem',
              ...(showMoreButtonStyle || {}),
              ...(readMoreColor ? { color: readMoreColor } : {})
            }}
            onClick={() => {
              setMinHeight(fullTextShown ? 0 : minHeight);
              setFullTextShown((shown) => !shown);
              fullTextShownRef.current = !fullTextShownRef.current;
            }}
          >
            <Icon icon={fullTextShown ? 'chevron-up' : 'chevron-down'} />
            <span>{fullTextShown ? 'Show Less' : 'Show More'}</span>
          </Button>
        )}
      </div>
      {isAIMessage && !hideDictation && (
        <>
          {aiActionPlacement === 'inline' ? (
            <div
              style={{
                marginTop: '0.7rem',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Button
                variant="soft"
                tone="raised"
                onClick={handleCopyMessage}
                style={{
                  padding: '0.5rem 0.7rem',
                  lineHeight: 1
                }}
                color="darkerGray"
              >
                <Icon icon={copySuccess ? 'check' : 'copy'} />
              </Button>
              {isAudioButtonShown && (
                <AIAudioButton
                  contentKey={`${contentId}-${contentType}-${section}`}
                  text={text}
                  voice={voice}
                />
              )}
            </div>
          ) : (
            <div
              style={{
                position: 'absolute',
                bottom: '-3rem',
                right: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Button
                variant="soft"
                tone="raised"
                onClick={handleCopyMessage}
                style={{
                  padding: '0.5rem 0.7rem',
                  lineHeight: 1
                }}
                color="darkerGray"
              >
                <Icon icon={copySuccess ? 'check' : 'copy'} />
              </Button>
              {isAudioButtonShown && (
                <AIAudioButton
                  contentKey={`${contentId}-${contentType}-${section}`}
                  text={text}
                  voice={voice}
                />
              )}
            </div>
          )}
        </>
      )}
    </ErrorBoundary>
  );

  async function handleCopyMessage() {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      const textArea = document.createElement('textarea');
      textArea.value = text;
      try {
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
      } finally {
        if (textArea.parentNode) {
          textArea.parentNode.removeChild(textArea);
        }
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }
}

export default memo(RichText);
