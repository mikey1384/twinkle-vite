import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Suspense
} from 'react';
import { shouldRenderRichTextLiterally } from './helpers/renderMode';
import AIAudioButton from './AIAudioButton';
import InvisibleTextContainer, {
  stripMarkdownLinkUrls
} from './InvisibleTextContainer';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { fullTextStates, richTextHeights } from '~/constants/state';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import { hasStructuredPreviewMarkdown } from '~/helpers/stringHelpers';
import { mobileMaxWidth } from '~/constants/css';
import {
  getRichTextEmbedPreviewMode,
  getRichTextPreviewMaxHeight,
  getRichTextSubjectPreviewVariant,
  type RichTextSubjectPreviewVariant
} from './embedPreviewMode';
import {
  applyRichTextOverflowMeasurement,
  isRichTextMeasurementOverflown,
  resolveRichTextContentTransition,
  resolveRichTextHeightToPersist,
  resolveInitialRichTextHeight,
  resolveInitialRichTextPresentationState,
  resolveRichTextCollapseThreshold,
  shouldShowRichTextFully
} from './helpers/overflow';
import { createStringRevision } from '~/helpers/stringRevision';

const Markdown = lazyWithRetry(() => import('./Markdown'));

const collapsedLineHeight = 1.7;

type RichTextRootStyle = React.CSSProperties & {
  '--rich-text-line-height'?: number;
  '--rich-text-preview-max-lines'?: number;
  '--rich-text-preview-mobile-max-lines'?: number;
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
      grid-template-columns: minmax(5.6rem, 0.82fr) minmax(0, 1.18fr) minmax(
          4.6rem,
          0.58fr
        );
      gap: 0.45rem;
      min-height: 9.8rem;
      padding: 0.58rem;
    }
    .compact-ai-card-preview__card-stage .compact-ai-card-thumb--static {
      width: 5.1rem !important;
      height: 7.2rem !important;
    }
    .compact-ai-card-preview__market {
      gap: 0.32rem;
      padding-left: 0.35rem;
    }
    .compact-ai-card-preview__details {
      align-items: center;
      text-align: center;
    }
    .compact-ai-card-preview__header {
      justify-content: center;
      max-width: 100%;
    }
    .compact-ai-card-preview__owner--inline {
      display: none;
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
    .compact-ai-card-preview__stat > span,
    .compact-ai-card-preview__stat b {
      font-size: 1rem;
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
    /* The outer feed-card target panel already draws a border, so the profile
       embed must not draw its own or it reads as a double border. */
    .profile-embed-card.profile-embed-card--bordered {
      border: 0;
      border-radius: 0;
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
  isStreaming,
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
  subjectPreviewVariant,
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
  isStreaming?: boolean;
  children?: any;
  contentId?: number | string;
  contentType?: string;
  hideDictation?: boolean;
  isAudioButtonShown?: boolean;
  aiActionPlacement?: 'floating' | 'inline';
  compactEmbedPreview?: boolean;
  subjectPreviewVariant?: RichTextSubjectPreviewVariant;
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
  const contentRevision = useMemo(
    () => (isStreaming ? 'streaming' : createStringRevision(String(text))),
    [isStreaming, text]
  );
  const embedPreviewMode = getRichTextEmbedPreviewMode({
    compactEmbedPreview,
    isPreview
  });
  const appliedSubjectPreviewVariant = getRichTextSubjectPreviewVariant({
    compactEmbedPreview,
    subjectPreviewVariant
  });
  const embedPreview = Boolean(embedPreviewMode);
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
  const containerNodeRef = useRef<HTMLDivElement | null>(null);
  const measuredOverflowRef = useRef<boolean | null>(null);
  const isPreviewRef = useRef(isPreview);
  // Preview RichText is deterministic: no expansion state or shared height cache.
  const fullTextState = useMemo(
    () =>
      isPreview ? {} : fullTextStates[`${contentType}-${contentId}`] || {},
    [contentId, contentType, isPreview]
  );
  const defaultMinHeight = useMemo(
    () =>
      resolveInitialRichTextHeight({
        cachedState:
          richTextHeights[`${contentType}-${contentId}`]?.[section],
        contentRevision,
        isPreview,
        isStreaming
      }),
    [contentRevision, contentType, contentId, isPreview, isStreaming, section]
  );
  const [isParsed, setIsParsed] = useState(false);
  const TextRef = useRef<any>(null);
  const minHeightRef = useRef(defaultMinHeight);
  const heightContentRevisionRef = useRef<string | null>(
    typeof defaultMinHeight === 'number' ? contentRevision : null
  );
  const [minHeight, setMinHeight] = useState(defaultMinHeight);
  const initialPresentationState = useMemo(
    () =>
      resolveInitialRichTextPresentationState({
        cachedState: fullTextState[section],
        contentRevision,
        isPreview,
        isStreaming
      }),
    [contentRevision, fullTextState, isPreview, isStreaming, section]
  );
  const contentRevisionRef = useRef(contentRevision);
  const wasStreamingRef = useRef(Boolean(isStreaming));
  const isExpandedRef = useRef(initialPresentationState.isExpanded);
  const [presentationState, setPresentationState] = useState(
    initialPresentationState
  );
  const { isExpanded, isOverflown } = presentationState;
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
  const renderAsLiteralText = shouldRenderRichTextLiterally({
    cleanString,
    isStreaming,
    tooLongNonUrlToken
  });
  const fullContentShown = shouldShowRichTextFully({
    isExpanded,
    isOverflown,
    isPreview
  });

  const hasMarkdownEmbed = useMemo(
    () => /!\[[^\]]*\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/.test(String(text)),
    [text]
  );
  const hasStructuredMarkdown = useMemo(
    () => hasStructuredPreviewMarkdown(String(text || '')),
    [text]
  );
  // Multi-paragraph content must use the block-preview (max-height) clamp, not
  // the line-clamp mode. Line-clamp forces blocks to display:inline and joins
  // paragraphs with a `\A\A` (white-space: pre) hack inside -webkit-line-clamp,
  // which iOS Safari mis-lays-out (later lines/mentions overlap earlier text).
  const hasMultipleParagraphs = useMemo(
    () => /\n\s*\n/.test(String(text || '')),
    [text]
  );
  const isBlockPreservingPreview = Boolean(
    isPreview && (hasStructuredMarkdown || hasMultipleParagraphs)
  );
  const isLineClampedPreview = Boolean(
    isPreview && !hasMarkdownEmbed && !isBlockPreservingPreview
  );
  const previewMobileMaxLines = mobileMaxLines || maxLines;
  const effectiveCollapsedLineHeight = lineHeight ?? collapsedLineHeight;
  const previewCollapsedMaxHeight = getRichTextPreviewMaxHeight({
    hasMarkdownEmbed,
    lineHeight: effectiveCollapsedLineHeight,
    maxLines,
    subjectPreviewVariant: appliedSubjectPreviewVariant
  });
  const previewMobileCollapsedMaxHeight = getRichTextPreviewMaxHeight({
    hasMarkdownEmbed,
    lineHeight: effectiveCollapsedLineHeight,
    maxLines: previewMobileMaxLines,
    subjectPreviewVariant: appliedSubjectPreviewVariant
  });
  const shouldUseBlockPreviewMaxHeight =
    isBlockPreservingPreview && !isExpanded;
  const handleMeasureContainerNode = useCallback(
    (node: HTMLDivElement) => {
      containerNodeRef.current = node;
      if (isPreview) return;

      const collapseThreshold = resolveRichTextCollapseThreshold({
        computedMaxHeight: window.getComputedStyle(node).maxHeight,
        fallbackClientHeight: node.clientHeight
      });
      const extraAllowedHeight =
        !renderAsLiteralText &&
        hasTopEmbeddedContent &&
        embeddedContentRef.current
          ? embeddedContentRef.current.offsetHeight
          : 0;
      const overflown = isRichTextMeasurementOverflown({
        scrollHeight: node.scrollHeight,
        collapseThreshold,
        extraAllowedHeight
      });

      // ResizeObserver is allowed to report the same layout repeatedly. Do not
      // schedule a React update unless the user-visible overflow result changed;
      // an unconditional measurement revision can feed a layout/update loop.
      if (measuredOverflowRef.current === overflown) return;
      measuredOverflowRef.current = overflown;
      setPresentationState((state) =>
        applyRichTextOverflowMeasurement({
          state,
          isOverflown: overflown
        })
      );
    },
    [hasTopEmbeddedContent, isPreview, renderAsLiteralText]
  );
  const measurementConfig = `${Boolean(isPreview)}:${Boolean(
    renderAsLiteralText
  )}:${previewCollapsedMaxHeight}`;
  const measurementConfigRef = useRef(measurementConfig);
  const wasPreviewRef = useRef(Boolean(isPreview));

  useLayoutEffect(() => {
    const transition = resolveRichTextContentTransition({
      contentRevision,
      isStreaming: Boolean(isStreaming),
      previousContentRevision: contentRevisionRef.current,
      wasStreaming: wasStreamingRef.current
    });
    contentRevisionRef.current = contentRevision;
    wasStreamingRef.current = Boolean(isStreaming);
    if (transition === 'unchanged') {
      return;
    }
    if (transition === 'reset') {
      isExpandedRef.current = false;
    }
    measuredOverflowRef.current = null;
    minHeightRef.current = defaultMinHeight;
    heightContentRevisionRef.current =
      typeof defaultMinHeight === 'number' ? contentRevision : null;
    setMinHeight(defaultMinHeight);
    setPresentationState((state) => ({
      isExpanded: transition === 'reset' ? false : state.isExpanded,
      isOverflown: null
    }));
  }, [contentRevision, defaultMinHeight, isStreaming]);

  useLayoutEffect(() => {
    const previewChanged = wasPreviewRef.current !== Boolean(isPreview);
    const configChanged = measurementConfigRef.current !== measurementConfig;
    wasPreviewRef.current = Boolean(isPreview);
    measurementConfigRef.current = measurementConfig;
    if (!previewChanged && !configChanged) {
      return;
    }
    if (previewChanged) {
      isExpandedRef.current = false;
    }
    measuredOverflowRef.current = null;
    if (isPreview) {
      containerNodeRef.current = null;
    }
    setPresentationState((state) => ({
      isExpanded: previewChanged ? false : state.isExpanded,
      isOverflown: null
    }));
  }, [isPreview, measurementConfig]);

  useEffect(() => {
    if (isPreview || !containerNodeRef.current) {
      return;
    }
    handleMeasureContainerNode(containerNodeRef.current);
  }, [
    handleMeasureContainerNode,
    isPreview,
    previewCollapsedMaxHeight,
    text
  ]);

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
    // Raw-text fallback renders synchronously; no height reservation needed,
    // and with isParsed never set the observed min-height would stick forever.
    if (
      !isPreview &&
      !renderAsLiteralText &&
      typeof ResizeObserver === 'function' &&
      TextRef.current &&
      typeof defaultMinHeight !== 'number'
    ) {
      resizeObserver = new ResizeObserver((entries) => {
        const clientHeight = entries[0].target.clientHeight;
        const newHeight = clientHeight;
        const heightChanged = minHeightRef.current !== newHeight;
        heightContentRevisionRef.current = contentRevision;
        minHeightRef.current = newHeight;
        if (heightChanged) {
          setMinHeight(newHeight);
        }
      });
      resizeObserver.observe(TextRef.current);
    }
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [contentRevision, defaultMinHeight, isPreview, renderAsLiteralText]);

  useEffect(() => {
    minHeightRef.current = minHeight;
  }, [minHeight]);

  useEffect(() => {
    const key = `${contentType}-${contentId}`;
    return () => {
      if (isPreviewRef.current) {
        return;
      }
      if (contentType && section) {
        const heightToPersist = resolveRichTextHeightToPersist({
          contentRevision: contentRevisionRef.current,
          height: minHeightRef.current,
          heightContentRevision: heightContentRevisionRef.current
        });
        fullTextStates[key] = {
          ...fullTextStates[key],
          [section]: {
            contentRevision: contentRevisionRef.current,
            isExpanded: isExpandedRef.current
          }
        };
        if (typeof heightToPersist === 'number') {
          richTextHeights[key] = {
            ...richTextHeights[key],
            [section]: {
              contentRevision: contentRevisionRef.current,
              height: heightToPersist
            }
          };
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markdownContent = useMemo(() => {
    if (renderAsLiteralText) {
      return text;
    }
    // The root div is opacity: 0 until parsing completes, so this fallback is
    // never visible — only its height matters. Render the text with link URLs
    // stripped (same transform as the measurement path) so the reserved space
    // approximates the rendered content; a fixed-height spinner made
    // containers like the profile popup jump ~15rem while the chunk loaded.
    return (
      <Suspense fallback={<>{stripMarkdownLinkUrls(text)}</>}>
        <Markdown
          contentId={contentId}
          contentType={contentType}
          embedPreviewMode={embedPreviewMode}
          isPreview={embedPreview}
          isProfileComponent={isProfileComponent}
          isAIMessage={isAIMessage}
          disableImageModal={disableImageModal}
          linkColor={appliedLinkColor}
          markerColor={markerColor}
          subjectPreviewVariant={appliedSubjectPreviewVariant}
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
    contentId,
    contentType,
    disableImageModal,
    embedPreviewMode,
    embedPreview,
    isAIMessage,
    isProfileComponent,
    markerColor,
    appliedSubjectPreviewVariant,
    theme,
    text,
    renderAsLiteralText
  ]);

  return (
    <ErrorBoundary
      style={{ width: '100%', position: 'relative' }}
      componentPath="components/Texts/RichText"
    >
      <div
        ref={TextRef}
        style={
          {
            opacity: isParsed || renderAsLiteralText ? 1 : 0,
            minHeight:
              !isParsed && !renderAsLiteralText && minHeight
                ? `${minHeight}px`
                : undefined,
            maxHeight:
              fullContentShown ||
              isLineClampedPreview ||
              shouldUseBlockPreviewMaxHeight
                ? undefined
                : previewCollapsedMaxHeight,
            overflow: fullContentShown ? undefined : 'hidden',
            ...(lineHeight === undefined
              ? {}
              : { '--rich-text-line-height': lineHeight }),
            '--rich-text-preview-max-lines': maxLines,
            '--rich-text-preview-mobile-max-lines': previewMobileMaxLines,
            ...style
          } as RichTextRootStyle
        }
        className={`${className} ${
          compactEmbedPreview ? 'rich-text--compact-comment-embeds' : ''
        } ${
          isBlockPreservingPreview ? 'rich-text--block-preview' : ''
        } ${RichTextCss} ${css`
          ${
            shouldUseBlockPreviewMaxHeight
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
              : ''
          }

          ${
            isBlockPreservingPreview
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
              : ''
          }
          ${
            isLineClampedPreview
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
              : ''
          }
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
        {!isPreview && (
          <ErrorBoundary componentPath="components/Texts/RichText/InvisibleTextContainer">
            <InvisibleTextContainer
              collapsedMaxHeight={previewCollapsedMaxHeight}
              contentId={contentId}
              contentType={contentType}
              embedPreviewMode={embedPreviewMode}
              isAIMessage={isAIMessage}
              isProfileComponent={isProfileComponent}
              lineHeight={effectiveCollapsedLineHeight}
              linkColor={appliedLinkColor}
              markerColor={markerColor}
              isPreview={embedPreview}
              renderAsLiteralText={renderAsLiteralText}
              subjectPreviewVariant={appliedSubjectPreviewVariant}
              theme={theme}
              text={text}
              onSetContainerNode={handleMeasureContainerNode}
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
          justify-content: ${
            isShowMoreButtonCentered ? 'center' : 'flex-start'
          };
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
              setMinHeight(isExpanded ? 0 : minHeight);
              setPresentationState((state) => {
                const nextIsExpanded = !state.isExpanded;
                isExpandedRef.current = nextIsExpanded;
                return { ...state, isExpanded: nextIsExpanded };
              });
            }}
          >
            <Icon icon={isExpanded ? 'chevron-up' : 'chevron-down'} />
            <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
          </Button>
        )}
      </div>
      {isAIMessage && !hideDictation && !isStreaming && (
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
