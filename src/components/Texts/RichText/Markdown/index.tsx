import React, { useEffect, useMemo, useState, Fragment } from 'react';
import { unified } from 'unified';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeKatex from 'rehype-katex';
import parse from 'html-react-parser';
import parseStyle from 'style-to-object';
import EmbeddedComponent from './EmbeddedComponent';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import {
  applyTextEffects,
  applyTextSize,
  processInternalLink
} from '~/helpers/stringHelpers';
import LazyCodeBlockWrapper from './LazyCodeBlockWrapper';
import {
  protectCurrencyLiteralsOutsideMath,
  restoreCurrencyPlaceholders
} from './helpers/currencyPlaceholders';
import {
  containsDescendantTagNames,
  getParentTagName,
  handleMentions,
  hasMeaningfulContent,
  isSectionLabelParagraph,
  keyToCamelCase,
  preprocessText,
  removeNbsp,
  splitLabelAndContent,
  splitNodesByDoubleBreaks,
  stripLeadingBreakNodes,
  unescapeEqualSignAndDash,
  unescapeHtml
} from './helpers';

const SECTION_LABEL_CLASS = 'rich-text-section-label';

function Markdown({
  contentId,
  contentType,
  children,
  isInvisible,
  isPreview,
  isProfileComponent,
  isAIMessage,
  disableImageModal,
  linkColor,
  markerColor,
  theme,
  onSetIsParsed,
  embeddedContentRef,
  onSetHasTopEmbeddedContent
}: {
  contentId?: number | string;
  contentType?: string;
  isInvisible?: boolean;
  isPreview?: boolean;
  isProfileComponent?: boolean;
  isAIMessage?: boolean;
  disableImageModal?: boolean;
  children: string;
  linkColor: string;
  markerColor: string;
  theme?: string;
  onSetIsParsed: (parsed: boolean) => void;
  embeddedContentRef?: React.RefObject<HTMLDivElement | null>;
  onSetHasTopEmbeddedContent?: (hasTop: boolean) => void;
}) {
  const key = useMemo(
    () => `${contentId}-${contentType}`,
    [contentId, contentType]
  );
  const componentPath = useMemo(
    () =>
      `components/Texts/RichText/Markdown/Rendered/Content${
        isInvisible ? '/Invisible' : '/Visible'
      }`,
    [isInvisible]
  );

  const [isProcessed, setIsProcessed] = useState(false);
  const [hasLongWord, setHasLongWord] = useState(false);

  const processedContent = useMemo(() => {
    const hasExcessivelyLongWord = (text: string) => {
      const words = text.split(/\s+/);
      return words.some((word) => {
        const isMarkdownImage = /^!\[.*\]\(.*\)$/.test(word);
        return !isMarkdownImage && word.length > 800;
      });
    };

    if (hasExcessivelyLongWord(children)) {
      setHasLongWord(true);
      return {
        content: <Fragment key={key}>{children}</Fragment>,
        processed: true
      };
    }

    try {
      // For AI messages, convert LaTeX math delimiters BEFORE preprocessing
      let textToProcess = children;
      if (isAIMessage) {
        textToProcess = children
          .replace(/\\\[([\s\S]*?)\\\]/g, (_, p1: string) => {
            // Replace newlines with space - KaTeX handles single-line better
            const content = p1.trim().replace(/\n/g, ' ');
            return '\n\n$$' + content + '$$\n\n';
          })
          .replace(/\\\(([\s\S]*?)\\\)/g, (_, p1: string) => {
            return '$' + p1.trim() + '$';
          });
      }

      const preprocessedText = preprocessText(textToProcess, { isAIMessage });

      // For AI messages, protect currency from being interpreted as math
      let textForMarkdown = preprocessedText;
      if (isAIMessage) {
        textForMarkdown =
          protectCurrencyLiteralsOutsideMath(preprocessedText);
      }

      const markupString = isAIMessage
        ? unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkMath)
            .use(remarkRehype)
            .use(rehypeKatex)
            .use(rehypeStringify)
            .processSync(textForMarkdown)
            .toString()
        : unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype)
            .use(rehypeStringify)
            .processSync(preprocessedText)
            .toString();

      // Restore currency symbols
      const finalString = isAIMessage
        ? restoreCurrencyPlaceholders(markupString)
        : markupString;

      const result = convertStringToJSX({
        string: removeNbsp(
          handleMentions(
            applyTextSize(
              applyTextEffects({
                string: finalString
              })
            )
          ),
          { isAIMessage }
        )
      });

      return {
        content: <Fragment key={key}>{result}</Fragment>,
        processed: true
      };
    } catch (error) {
      console.error('Error processing markdown:', error);
      return {
        content: <Fragment key={key}>{children}</Fragment>,
        processed: true
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    children,
    componentPath,
    disableImageModal,
    isAIMessage,
    isPreview,
    isProfileComponent,
    key,
    linkColor,
    markerColor,
    theme
  ]);

  useEffect(() => {
    if ((processedContent.processed && !isProcessed) || hasLongWord) {
      setIsProcessed(true);
      onSetIsParsed(true);
    }
  }, [processedContent, isProcessed, hasLongWord, onSetIsParsed]);

  useEffect(() => {
    const firstContent = children.trim().split('\n')[0];
    const isFirstContentEmbedded = /^!\[.*?\]\(.*?\)/.test(firstContent);
    onSetHasTopEmbeddedContent?.(isFirstContentEmbedded);
  }, [children, onSetHasTopEmbeddedContent]);

  return (
    <ErrorBoundary componentPath={componentPath}>
      {processedContent?.content}
    </ErrorBoundary>
  );

  function convertStringToJSX({
    string
  }: {
    string?: string;
  }): React.ReactNode {
    let paragraphKeyCounter = -1;
    return (
      <ErrorBoundary componentPath={`${componentPath}/convertStringToJSX`}>
        {parse(string || '', {
          replace: (domNode) => {
            if (domNode.type === 'tag') {
              if (domNode?.attribs?.class) {
                domNode.attribs.className = domNode.attribs.class;
                delete domNode.attribs.class;
              }
              switch (domNode.name) {
                case 'a': {
                  const node = domNode.children?.[0];
                  let href = unescapeEqualSignAndDash(
                    domNode.attribs?.href || ''
                  );
                  const { isInternalLink, replacedLink } =
                    processInternalLink(href);
                  if (
                    !isInternalLink &&
                    href &&
                    !href.toLowerCase().startsWith('http://') &&
                    !href.toLowerCase().startsWith('https://')
                  ) {
                    href = 'http://' + href;
                  }
                  if (
                    isInternalLink ||
                    domNode.attribs?.class === 'mention' ||
                    domNode.attribs?.className === 'mention'
                  ) {
                    let cleanLink = decodeURIComponent(replacedLink);
                    cleanLink = unescapeEqualSignAndDash(cleanLink);
                    cleanLink = cleanLink.replace(/]t|]s|]h|]b/g, '');
                    return (
                      <Link style={{ color: linkColor }} to={cleanLink}>
                        {(node as any)?.data}
                      </Link>
                    );
                  } else {
                    let cleanHref = decodeURIComponent(href);
                    cleanHref = cleanHref.replace(/]t|]s|]h|]b/g, '');
                    return (
                      <a
                        style={{
                          ...parseStyle(domNode.attribs?.style || ''),
                          color: linkColor
                        }}
                        href={cleanHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {unescapeEqualSignAndDash(
                          (node as any)?.data || 'Link'
                        )}
                      </a>
                    );
                  }
                }
                case 'code': {
                  return (
                    <code {...domNode.attribs}>
                      {domNode.children &&
                        domNode.children.map((node: any) => {
                          if ((node as any).name === 'br') {
                            return '\n';
                          }
                          const unescapedChildren = node
                            ? unescapeEqualSignAndDash(
                                unescapeHtml((node as any).data || '')
                              )
                            : '';
                          return removeNbsp(unescapedChildren, {
                            isAIMessage
                          });
                        })}
                    </code>
                  );
                }
                case 'em': {
                  return (
                    <span
                      style={{
                        fontStyle: isAIMessage ? 'italic' : 'normal',
                        fontWeight: isAIMessage ? 'normal' : 700
                      }}
                    >
                      {convertToJSX(domNode.children || [])}
                    </span>
                  );
                }
                case 'img': {
                  return (
                    <EmbeddedComponent
                      contentId={contentId}
                      contentType={contentType}
                      isPreview={isPreview}
                      isProfileComponent={isProfileComponent}
                      disableImageModal={disableImageModal}
                      src={unescapeEqualSignAndDash(domNode.attribs?.src || '')}
                      alt={unescapeEqualSignAndDash(domNode.attribs?.alt || '')}
                      theme={theme}
                      embeddedContentRef={embeddedContentRef}
                    />
                  );
                }
                case 'li': {
                  return (
                    <li
                      className={css`
                        ::marker {
                          color: ${markerColor} !important;
                        }
                      `}
                    >
                      {convertToJSX(domNode.children ? domNode.children : [])}
                    </li>
                  );
                }
                case 'p': {
                  const paragraphIndex = ++paragraphKeyCounter;
                  const paragraphKey = `${key}-paragraph-${paragraphIndex}`;
                  const parentTagName = getParentTagName(domNode);
                  const isWithinList = parentTagName === 'li';
                  const paragraphStyle = {
                    width: '100%',
                    marginInlineStart: '0px',
                    marginInlineEnd: '0px'
                  };
                  const baseChildNodes = domNode.children || [];
                  const childNodes = isWithinList
                    ? stripLeadingBreakNodes(baseChildNodes)
                    : baseChildNodes;
                  const breakIndex =
                    parentTagName === 'li'
                      ? childNodes.findIndex(
                          (child: any) =>
                            child?.type === 'tag' && child.name === 'br'
                        )
                      : -1;
                  const shouldSplit =
                    isWithinList &&
                    breakIndex > -1 &&
                    hasMeaningfulContent(childNodes.slice(0, breakIndex)) &&
                    hasMeaningfulContent(childNodes.slice(breakIndex + 1));
                  const labelSplit = !isWithinList
                    ? splitLabelAndContent(childNodes)
                    : null;

                  const renderSegment = (
                    nodes: any[],
                    keySuffix: string | number
                  ) => {
                    const normalizedNodes =
                      (isWithinList ? stripLeadingBreakNodes(nodes) : nodes) ||
                      [];
                    if (!normalizedNodes.length) {
                      return null;
                    }
                    const hasMediaOrBlockChild = containsDescendantTagNames(
                      { children: normalizedNodes },
                      ['img', 'table', 'pre', 'div', 'iframe']
                    );
                    const isLabelParagraph =
                      !isWithinList && isSectionLabelParagraph(normalizedNodes);
                    const paragraphClassName = isLabelParagraph
                      ? SECTION_LABEL_CLASS
                      : undefined;
                    if (!hasMediaOrBlockChild) {
                      return (
                        <p
                          key={`${paragraphKey}-segment-${keySuffix}`}
                          className={paragraphClassName}
                          style={{
                            ...paragraphStyle
                          }}
                        >
                          {convertToJSX(normalizedNodes)}
                        </p>
                      );
                    }
                    return (
                      <div
                        key={`${paragraphKey}-segment-${keySuffix}`}
                        style={{
                          width: '100%',
                          marginInlineStart: '0px',
                          marginInlineEnd: '0px',
                          display: 'block'
                        }}
                      >
                        {convertToJSX(normalizedNodes)}
                      </div>
                    );
                  };

                  const renderWithLabelSplit = (
                    nodes: any[],
                    keySuffix: string | number
                  ) => {
                    if (!nodes?.length) {
                      return null;
                    }
                    if (!isWithinList) {
                      const splitResult = splitLabelAndContent(nodes);
                      if (splitResult) {
                        return (
                          <Fragment
                            key={`${paragraphKey}-segment-${keySuffix}`}
                          >
                            {renderSegment(
                              splitResult.labelNodes,
                              `${keySuffix}-label`
                            )}
                            {renderSegment(
                              splitResult.contentNodes,
                              `${keySuffix}-body`
                            )}
                          </Fragment>
                        );
                      }
                    }
                    return renderSegment(nodes, keySuffix);
                  };

                  if (!isWithinList) {
                    const segments = splitNodesByDoubleBreaks(childNodes);
                    if (segments.length > 1) {
                      return (
                        <Fragment key={`${paragraphKey}-segments`}>
                          {segments.map((segmentNodes, segmentIndex) =>
                            renderWithLabelSplit(
                              segmentNodes,
                              `segment-${segmentIndex}`
                            )
                          )}
                        </Fragment>
                      );
                    }
                  }

                  if (shouldSplit) {
                    const leadingChildren = childNodes.slice(0, breakIndex);
                    const trailingChildren = childNodes.slice(breakIndex + 1);
                    return (
                      <Fragment key={`${paragraphKey}-split`}>
                        {renderSegment(leadingChildren, 'lead')}
                        {renderSegment(trailingChildren, 'body')}
                      </Fragment>
                    );
                  }

                  if (labelSplit) {
                    return (
                      <Fragment key={`${paragraphKey}-label-split`}>
                        {renderSegment(labelSplit.labelNodes, 'label')}
                        {renderSegment(labelSplit.contentNodes, 'body')}
                      </Fragment>
                    );
                  }

                  return renderWithLabelSplit(childNodes, 'single');
                }
                case 'strong': {
                  return (
                    <span
                      style={{
                        fontWeight: isAIMessage ? 700 : 'normal',
                        fontStyle: isAIMessage ? 'normal' : 'italic'
                      }}
                    >
                      {convertToJSX(domNode.children || [])}
                    </span>
                  );
                }
                case 'hr': {
                  return (
                    <hr
                      className={css`
                        margin-top: 1.25em;
                        margin-bottom: 1.25em;
                      `}
                    />
                  );
                }
                case 'table': {
                  return (
                    <div
                      className={css`
                        width: 100%;
                        display: flex;
                        overflow-x: auto;
                      `}
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
                            border: 1px solid var(--ui-border);
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
                        {convertToJSX(domNode.children || [])}
                      </table>
                    </div>
                  );
                }
                case 'pre': {
                  const codeNode = domNode.children?.find(
                    (child: any) => child.name === 'code'
                  );
                  if (codeNode) {
                    const className = (codeNode as any).attribs?.class || '';
                    const language = className.replace('language-', '');

                    const codeContent =
                      (codeNode as any).children
                        ?.map((child: any) => child.data || '')
                        .join('')
                        .trimEnd() || '';

                    const code = unescapeHtml(codeContent);

                    return (
                      <div data-codeblock>
                        {language ? (
                          <LazyCodeBlockWrapper
                            language={language}
                            value={code}
                            stickyTopGap={contentType === 'chat' ? '6rem' : 0}
                          />
                        ) : (
                          <pre>
                            <code className={className || undefined}>
                              {code}
                            </code>
                          </pre>
                        )}
                      </div>
                    );
                  }
                  return null;
                }

                default:
                  break;
              }
            }
          }
        })}
      </ErrorBoundary>
    );
  }

  function convertToJSX(
    nodes: {
      children?: any[];
      data?: any;
      name?: string;
      type: string;
      attribs?: { [key: string]: any };
    }[]
  ): React.ReactNode {
    return nodes.map((node: any, index) => {
      const parentTagName = getParentTagName(node);
      if (node.type === 'text') {
        if (
          node.data.includes('\n') &&
          parentTagName !== 'tr' &&
          parentTagName !== 'th' &&
          parentTagName !== 'table' &&
          parentTagName !== 'thead' &&
          parentTagName !== 'tbody' &&
          parentTagName !== 'li'
        ) {
          if (isAIMessage) return node.data;
          const parts = node.data.split('\n');
          return parts.map((segment: string, i: number) => (
            <Fragment key={`textline-${index}-${i}`}>
              {i > 0 ? <br /> : null}
              {segment}
            </Fragment>
          ));
        }
        return node.data.trim() !== '' || /^ +$/.test(node.data)
          ? node.data
          : null;
      } else if (node.type === 'tag') {
        const TagName = node.name;
        const children: any = node.children
          ? convertToJSX(node.children)
          : null;
        const attribs = { ...node.attribs };
        if (attribs.style) {
          attribs.style = keyToCamelCase(parseStyle(attribs.style));
        }
        if (attribs.class) {
          attribs.className = attribs.class;
          delete attribs.class;
        }
        const commonProps: { [key: string]: any } = attribs;
        const key = `${TagName || node.type}-${index}`;
        switch (TagName) {
          case 'a': {
            let href = unescapeEqualSignAndDash(attribs?.href || '');
            const { isInternalLink, replacedLink } = processInternalLink(href);
            if (
              !isInternalLink &&
              href &&
              !href.toLowerCase().startsWith('http://') &&
              !href.toLowerCase().startsWith('https://')
            ) {
              href = 'http://' + href;
            }
            commonProps.href = href;
            if (isInternalLink || attribs?.className === 'mention') {
              let cleanLink = decodeURIComponent(replacedLink);
              cleanLink = cleanLink.replace(/]t|]s|]h|]b/g, '');
              return (
                <ErrorBoundary
                  componentPath={`${componentPath}/convertToJSX/Link`}
                  key={key}
                >
                  <Link
                    {...commonProps}
                    style={{
                      ...attribs.style,
                      color: linkColor
                    }}
                    to={cleanLink}
                    key={key}
                  >
                    {children?.length
                      ? children.map((child: any) => {
                          return unescapeEqualSignAndDash(child);
                        })
                      : 'Link'}
                  </Link>
                </ErrorBoundary>
              );
            } else {
              let cleanHref = decodeURIComponent(href);
              cleanHref = cleanHref.replace(/]t|]s|]h|]b/g, '');
              return (
                <ErrorBoundary
                  componentPath={`${componentPath}/convertToJSX/a`}
                  key={key}
                >
                  <a
                    {...commonProps}
                    href={cleanHref}
                    style={{
                      ...attribs.style,
                      color: linkColor
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={key}
                  >
                    {children?.length
                      ? children.map((child: any) =>
                          unescapeEqualSignAndDash(child)
                        )
                      : 'Link'}
                  </a>
                </ErrorBoundary>
              );
            }
          }
          case 'code': {
            const className = node.attribs?.class || '';
            const language = className.replace('language-', '');

            const codeContent =
              node.children
                ?.map((child: { data: any }) => child.data || '')
                .join('')
                .trimEnd() || '';

            const code = unescapeHtml(codeContent);

            const isInlineCode = node.parent && node.parent.name !== 'pre';

            if (isInlineCode) {
              return (
                <code {...commonProps} key={key}>
                  {code}
                </code>
              );
            } else {
              return language ? (
                <LazyCodeBlockWrapper
                  language={language}
                  value={code}
                  key={key}
                  stickyTopGap={contentType === 'chat' ? '6rem' : 0}
                />
              ) : (
                <code {...commonProps} key={key}>
                  {code}
                </code>
              );
            }
          }

          case 'em': {
            return (
              <ErrorBoundary
                componentPath={`${componentPath}/convertToJSX/em`}
                key={key}
              >
                {isAIMessage ? (
                  <em {...commonProps} key={key}>
                    {children}
                  </em>
                ) : (
                  <strong {...commonProps} key={key}>
                    {children}
                  </strong>
                )}
              </ErrorBoundary>
            );
          }
          case 'img': {
            return (
              <ErrorBoundary
                componentPath={`${componentPath}/convertToJSX/img`}
                key={key}
              >
                <EmbeddedComponent
                  {...commonProps}
                  isProfileComponent={isProfileComponent}
                  isPreview={isPreview}
                  disableImageModal={disableImageModal}
                  contentId={contentId}
                  contentType={contentType}
                  embeddedContentRef={embeddedContentRef}
                  src={unescapeEqualSignAndDash(commonProps?.src || '')}
                  alt={unescapeEqualSignAndDash(commonProps?.alt || '')}
                  theme={theme}
                  key={key}
                />
              </ErrorBoundary>
            );
          }
          case 'input':
            if (attribs.type === 'checkbox') {
              return (
                <ErrorBoundary
                  componentPath={`${componentPath}/convertToJSX/input`}
                  key={key}
                >
                  <input
                    {...attribs}
                    checked={Object.keys(attribs).includes('checked')}
                    key={key}
                    onChange={() => null}
                    disabled={false}
                  />
                </ErrorBoundary>
              );
            }
            break;
          case 'li': {
            return (
              <ErrorBoundary
                componentPath={`${componentPath}/convertToJSX/li`}
                key={key}
              >
                <li
                  {...commonProps}
                  className={css`
                    ::marker {
                      color: ${markerColor} !important;
                    }
                  `}
                  key={key}
                >
                  {children}
                </li>
              </ErrorBoundary>
            );
          }
          case 'p': {
            const { style, ...restProps } = commonProps;
            const parentTagName = getParentTagName(node);
            const isWithinList = parentTagName === 'li';
            const sharedStyle = {
              width: '100%',
              marginInlineStart: '0px',
              marginInlineEnd: '0px'
            };
            const baseChildNodes = node.children || [];
            const childNodes = isWithinList
              ? stripLeadingBreakNodes(baseChildNodes)
              : baseChildNodes;
            const breakIndex =
              parentTagName === 'li'
                ? childNodes.findIndex(
                    (child: any) => child?.type === 'tag' && child.name === 'br'
                  )
                : -1;
            const shouldSplit =
              isWithinList &&
              breakIndex > -1 &&
              hasMeaningfulContent(childNodes.slice(0, breakIndex)) &&
              hasMeaningfulContent(childNodes.slice(breakIndex + 1));
            const labelSplit = !isWithinList
              ? splitLabelAndContent(childNodes)
              : null;

            const renderSegment = (
              nodes: any[],
              keySuffix: string,
              pathSuffix: string
            ) => {
              const normalizedNodes =
                (isWithinList ? stripLeadingBreakNodes(nodes) : nodes) || [];
              if (!normalizedNodes.length) {
                return null;
              }
              const hasMediaOrBlockChild = containsDescendantTagNames(
                { children: normalizedNodes },
                ['img', 'table', 'pre', 'div', 'iframe']
              );
              const isLabelParagraph =
                !isWithinList && isSectionLabelParagraph(normalizedNodes);
              const paragraphClassName = isLabelParagraph
                ? SECTION_LABEL_CLASS
                : undefined;
              const existingClassName =
                typeof restProps.className === 'string'
                  ? restProps.className
                  : undefined;
              const combinedClassName = paragraphClassName
                ? [existingClassName, paragraphClassName]
                    .filter(Boolean)
                    .join(' ')
                : existingClassName;
              if (!hasMediaOrBlockChild) {
                return (
                  <ErrorBoundary
                    componentPath={`${componentPath}/convertToJSX/p${pathSuffix}`}
                    key={`${key}-${keySuffix}`}
                  >
                    <p
                      {...restProps}
                      style={{
                        ...sharedStyle,
                        ...style
                      }}
                      className={combinedClassName}
                      key={`${key}-${keySuffix}`}
                    >
                      {convertToJSX(normalizedNodes)}
                    </p>
                  </ErrorBoundary>
                );
              }
              return (
                <ErrorBoundary
                  componentPath={`${componentPath}/convertToJSX/p/Block${pathSuffix}`}
                  key={`${key}-${keySuffix}`}
                >
                  <div
                    {...restProps}
                    style={{
                      ...sharedStyle,
                      display: 'block',
                      ...style
                    }}
                    key={`${key}-${keySuffix}`}
                  >
                    {convertToJSX(normalizedNodes)}
                  </div>
                </ErrorBoundary>
              );
            };

            const renderWithLabelSplit = (
              nodes: any[],
              keySuffix: string,
              pathSuffix: string
            ) => {
              if (!nodes?.length) {
                return null;
              }
              if (!isWithinList) {
                const splitResult = splitLabelAndContent(nodes);
                if (splitResult) {
                  return (
                    <Fragment key={`${key}-segment-${keySuffix}`}>
                      {renderSegment(
                        splitResult.labelNodes,
                        `${keySuffix}-label`,
                        `${pathSuffix}/Label`
                      )}
                      {renderSegment(
                        splitResult.contentNodes,
                        `${keySuffix}-body`,
                        `${pathSuffix}/Body`
                      )}
                    </Fragment>
                  );
                }
              }
              return renderSegment(nodes, keySuffix, pathSuffix);
            };

            if (!isWithinList) {
              const segments = splitNodesByDoubleBreaks(childNodes);
              if (segments.length > 1) {
                return (
                  <Fragment key={`${key}-segments`}>
                    {segments.map((segmentNodes, segmentIndex) =>
                      renderWithLabelSplit(
                        segmentNodes,
                        `segment-${segmentIndex}`,
                        `/Segment`
                      )
                    )}
                  </Fragment>
                );
              }
            }

            if (shouldSplit) {
              const leadingChildren = childNodes.slice(0, breakIndex);
              const trailingChildren = childNodes.slice(breakIndex + 1);
              return (
                <Fragment key={`${key}-split`}>
                  {renderSegment(leadingChildren, 'lead', '/Lead')}
                  {renderSegment(trailingChildren, 'body', '/Body')}
                </Fragment>
              );
            }

            if (labelSplit) {
              return (
                <Fragment key={`${key}-label-split`}>
                  {renderSegment(labelSplit.labelNodes, 'label', '/Label')}
                  {renderSegment(labelSplit.contentNodes, 'body', '/Body')}
                </Fragment>
              );
            }

            return renderWithLabelSplit(childNodes, 'single', '');
          }
          case 'strong': {
            return (
              <ErrorBoundary
                componentPath={`${componentPath}/convertToJSX/strong`}
                key={key}
              >
                {isAIMessage ? (
                  <strong {...commonProps} key={key}>
                    {children}
                  </strong>
                ) : (
                  <em {...commonProps} key={key}>
                    {children}
                  </em>
                )}
              </ErrorBoundary>
            );
          }
          case 'hr': {
            return (
              <ErrorBoundary
                componentPath={`${componentPath}/convertToJSX/hr`}
                key={key}
              >
                <hr
                  {...commonProps}
                  className={css`
                    margin-top: 1.25em;
                    margin-bottom: 1.25em;
                  `}
                />
              </ErrorBoundary>
            );
          }
          case 'table':
            return (
              <ErrorBoundary
                componentPath={`${componentPath}/convertToJSX/table`}
                key={key}
              >
                <div
                  key={key}
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
                        border: 1px solid var(--ui-border);
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
                    {children}
                  </table>
                </div>
              </ErrorBoundary>
            );
          default: {
            const params = [TagName, { ...commonProps, key }];
            if (Array.isArray(children) && children.length > 0) {
              params.push(children);
            }
            return React.createElement(...(params as [string, object, any[]]));
          }
        }
      }
    });
  }

}

export default React.memo(Markdown);
