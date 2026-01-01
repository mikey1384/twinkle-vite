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

const SECTION_LABEL_CLASS = 'rich-text-section-label';
const INLINE_LABEL_TAGS = new Set([
  'strong',
  'em',
  'span',
  'code',
  'u',
  'i',
  'b',
  'small'
]);
const INLINE_BREAK_TAGS = new Set([
  'a',
  'b',
  'code',
  'em',
  'i',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'u'
]);

function Markdown({
  contentId,
  contentType,
  children,
  isInvisible,
  isProfileComponent,
  isAIMessage,
  linkColor,
  markerColor,
  onSetIsParsed,
  embeddedContentRef,
  onSetHasTopEmbeddedContent
}: {
  contentId?: number | string;
  contentType?: string;
  isInvisible?: boolean;
  isProfileComponent?: boolean;
  isAIMessage?: boolean;
  children: string;
  linkColor: string;
  markerColor: string;
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

      const preprocessedText = preprocessText(textToProcess);

      // For AI messages, protect currency from being interpreted as math
      let textForMarkdown = preprocessedText;
      if (isAIMessage) {
        // Replace simple currency patterns with a temporary placeholder
        // Use negative lookahead to avoid matching math like $2(a+b)$ or $2x$
        textForMarkdown = preprocessedText.replace(
          /\$(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)(?![a-zA-Z(^_{}])/g,
          'TWINKLECURRENCY$1ENDTWINKLECURRENCY'
        );
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
        ? (() => {
            let restored = markupString;

            // Find all currency placeholders and replace them one by one
            const matches = [
              ...markupString.matchAll(
                /TWINKLECURRENCY([^E]+?)ENDTWINKLECURRENCY/g
              )
            ];

            for (const match of matches) {
              const fullMatch = match[0];
              const currencyValue = match[1];
              restored = restored.replace(fullMatch, `$${currencyValue}`);
            }

            return restored;
          })()
        : markupString;

      const result = convertStringToJSX({
        string: removeNbsp(
          handleMentions(
            applyTextSize(
              applyTextEffects({
                string: finalString
              })
            )
          )
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
  }, [children, linkColor, markerColor, isAIMessage, key]);

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
                          return removeNbsp(unescapedChildren);
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
                      isProfileComponent={isProfileComponent}
                      src={unescapeEqualSignAndDash(domNode.attribs?.src || '')}
                      alt={unescapeEqualSignAndDash(domNode.attribs?.alt || '')}
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
                  contentId={contentId}
                  contentType={contentType}
                  embeddedContentRef={embeddedContentRef}
                  src={unescapeEqualSignAndDash(commonProps?.src || '')}
                  alt={unescapeEqualSignAndDash(commonProps?.alt || '')}
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

  function containsDescendantTagNames(
    node: { children?: any[] },
    tagNames: string[]
  ): boolean {
    if (!node?.children) {
      return false;
    }
    return node.children.some((child: any) => {
      if (child?.type !== 'tag') {
        return false;
      }
      if (tagNames.includes(child.name)) {
        return true;
      }
      return containsDescendantTagNames(child, tagNames);
    });
  }

  function getParentTagName(node?: { parent?: any }) {
    const parent = node?.parent as { name?: string } | undefined;
    return typeof parent?.name === 'string' ? parent.name : undefined;
  }

  function stripLeadingBreakNodes(nodes?: any[]) {
    if (!Array.isArray(nodes)) {
      return [];
    }
    let startIndex = 0;
    while (startIndex < nodes.length) {
      const child = nodes[startIndex];
      if (
        (child?.type === 'tag' && child.name === 'br') ||
        (child?.type === 'text' && !child.data?.trim())
      ) {
        startIndex++;
        continue;
      }
      break;
    }
    return nodes.slice(startIndex);
  }

  function isBreakNode(node?: any) {
    return node?.type === 'tag' && node.name === 'br';
  }

  function splitNodesByDoubleBreaks(nodes?: any[]) {
    if (!Array.isArray(nodes) || !nodes.length) {
      return [];
    }
    const segments: any[][] = [];
    let current: any[] = [];
    let i = 0;
    while (i < nodes.length) {
      if (isBreakNode(nodes[i])) {
        const breakNodes: any[] = [];
        while (i < nodes.length && isBreakNode(nodes[i])) {
          breakNodes.push(nodes[i]);
          i++;
        }
        if (breakNodes.length >= 2) {
          if (current.length) {
            segments.push(current);
          }
          current = [];
        } else {
          current.push(...breakNodes);
        }
        continue;
      }
      current.push(nodes[i]);
      i++;
    }
    if (current.length) {
      segments.push(current);
    }
    return segments;
  }

  function hasMeaningfulContent(nodes?: any[]) {
    const normalizedNodes = stripLeadingBreakNodes(nodes);
    if (!normalizedNodes.length) {
      return false;
    }
    return normalizedNodes.some((child: any) => {
      if (child?.type === 'text') {
        return !!child.data?.trim();
      }
      if (child?.type === 'tag') {
        if (child.name === 'br') {
          return false;
        }
        return true;
      }
      return false;
    });
  }

  function splitLabelAndContent(nodes?: any[]) {
    if (!Array.isArray(nodes) || !nodes.length) {
      return null;
    }
    const normalizedNodes = stripLeadingBreakNodes(nodes);
    const breakIndex = normalizedNodes.findIndex(
      (child: any) => child?.type === 'tag' && child.name === 'br'
    );
    if (breakIndex === -1) {
      return null;
    }
    const labelNodes = normalizedNodes.slice(0, breakIndex);
    const contentNodes = stripLeadingBreakNodes(
      normalizedNodes.slice(breakIndex + 1)
    );
    if (
      !labelNodes.length ||
      !contentNodes.length ||
      !isSectionLabelParagraph(labelNodes) ||
      !hasMeaningfulContent(contentNodes)
    ) {
      return null;
    }
    return { labelNodes, contentNodes };
  }

  function isSectionLabelParagraph(nodes?: any[]) {
    if (!Array.isArray(nodes) || !nodes.length) {
      return false;
    }
    const normalizedNodes = stripLeadingBreakNodes(nodes).filter(
      (child: any) => {
        if (child?.type === 'tag' && child.name === 'br') {
          return false;
        }
        if (child?.type === 'text') {
          return !!child.data?.trim();
        }
        return true;
      }
    );
    if (!normalizedNodes.length) {
      return false;
    }
    const allInlineNodes = normalizedNodes.every((child: any) => {
      if (child?.type === 'text') {
        return true;
      }
      if (child?.type === 'tag') {
        if (INLINE_LABEL_TAGS.has(child.name)) {
          return true;
        }
        return false;
      }
      return false;
    });
    if (!allInlineNodes) {
      return false;
    }
    const labelText = normalizedNodes
      .map((child: any) => extractNodeText(child))
      .join('')
      .trim();
    if (!labelText || labelText.length > 160) {
      return false;
    }
    if (!/[:：]$/.test(labelText)) {
      return false;
    }
    const colonCount =
      (labelText.match(/:/g) || []).length +
      (labelText.match(/：/g) || []).length;
    if (colonCount !== 1) {
      return false;
    }
    return true;
  }

  function extractNodeText(node: any): string {
    if (!node) {
      return '';
    }
    if (node.type === 'text') {
      return typeof node.data === 'string' ? node.data : '';
    }
    if (Array.isArray(node.children)) {
      return node.children.map((child: any) => extractNodeText(child)).join('');
    }
    return '';
  }

  function handleMentions(text: string) {
    if (!text) {
      return text;
    }
    // Fullwidth ＠ (U+FF20) indicates invalid/non-existent users.
    // These should display as plain @username text, not links.
    const FAKE_AT_PLACEHOLDER = '\uE000';
    const hasFakeAt = text.includes('＠');
    const baseText = hasFakeAt
      ? text.replace(/＠/g, FAKE_AT_PLACEHOLDER)
      : text;
    const containsAngleBrackets = /[<>]/.test(baseText);
    if (baseText.indexOf('@') === -1 && !containsAngleBrackets) {
      const result = applyLineBreaks(baseText);
      return hasFakeAt ? result.replace(/\uE000/g, '@') : result;
    }
    const mentionTestRegex = /@[A-Za-z0-9_%]{3,}/;
    if (!mentionTestRegex.test(baseText) && !containsAngleBrackets) {
      const result = applyLineBreaks(baseText);
      return hasFakeAt ? result.replace(/\uE000/g, '@') : result;
    }
    const mentionReplaceRegex = /@[A-Za-z0-9_%]{3,}/g;
    const mentionReplacer = (match: string) => {
      const path = match.slice(1);
      return `<a class="mention" href="/users/${path}">@${path}</a>`;
    };
    if (!containsAngleBrackets) {
      let replaced = baseText.replace(mentionReplaceRegex, mentionReplacer);
      if (hasFakeAt) {
        replaced = replaced.replace(/\uE000/g, '@');
      }
      return applyLineBreaks(replaced);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(baseText, 'text/html');

    traverse(doc.body);
    let result = doc.body.innerHTML;
    if (hasFakeAt) {
      result = result.replace(/\uE000/g, '@');
    }
    return applyLineBreaks(result);

    function traverse(node: Node) {
      if (
        node.nodeType === Node.TEXT_NODE &&
        node.parentNode?.nodeName.toLowerCase() !== 'a' &&
        node.parentNode?.nodeName.toLowerCase() !== 'code'
      ) {
        const parent = node.parentNode;
        const nodeValue = node.nodeValue || '';

        let newNodeValue = nodeValue;
        if (nodeValue.includes('<')) {
          newNodeValue = newNodeValue.replace(/</g, '&lt;');
        }
        if (nodeValue.includes('>')) {
          newNodeValue = newNodeValue.replace(/>/g, '&gt;');
        }
        if (mentionTestRegex.test(nodeValue)) {
          newNodeValue = newNodeValue.replace(
            mentionReplaceRegex,
            mentionReplacer
          );
        }

        if (nodeValue !== newNodeValue) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = newNodeValue;
          const docFrag = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            const child = tempDiv.firstChild;
            docFrag.appendChild(child);
          }
          parent?.replaceChild(docFrag, node);
        }
      }

      for (const childNode of node.childNodes) {
        traverse(childNode);
      }
    }
  }

  function applyLineBreaks(value: string) {
    if (!value || !value.includes('\n')) {
      return value;
    }
    const lowerValue = value.toLowerCase();
    return value.replace(/\n/g, (_, offset) => {
      if (isWithinPreservedTag(lowerValue, offset, ['pre', 'code'])) {
        return '\n';
      }
      const prev = findPreviousNonWhitespace(value, offset - 1);
      const next = findNextNonWhitespace(value, offset + 1);
      const isBetweenTags = prev === '>' && next === '<';
      if (isBetweenTags) {
        return shouldPreserveBetweenInlineTags(value, offset) ? '<br />' : '';
      }
      return '<br />';
    });
  }

  function shouldPreserveBetweenInlineTags(html: string, newlineIndex: number) {
    const prevTagName = getPreviousClosingTagName(html, newlineIndex);
    const nextTagName = getNextOpeningTagName(html, newlineIndex);
    if (!prevTagName || !nextTagName) {
      return false;
    }
    return (
      INLINE_BREAK_TAGS.has(prevTagName) && INLINE_BREAK_TAGS.has(nextTagName)
    );
  }

  function getPreviousClosingTagName(html: string, newlineIndex: number) {
    const before = html.slice(0, newlineIndex);
    const match = before.match(/<\/([a-z0-9]+)\s*>\s*$/i);
    return match ? match[1].toLowerCase() : null;
  }

  function getNextOpeningTagName(html: string, newlineIndex: number) {
    const after = html.slice(newlineIndex + 1);
    const match = after.match(/^\s*<([a-z0-9]+)(\s|>)/i);
    return match ? match[1].toLowerCase() : null;
  }

  function findPreviousNonWhitespace(str: string, start: number) {
    for (let i = start; i >= 0; i--) {
      const char = str[i];
      if (!char) continue;
      if (char.trim()) {
        return char;
      }
    }
    return '';
  }

  function findNextNonWhitespace(str: string, start: number) {
    for (let i = start; i < str.length; i++) {
      const char = str[i];
      if (!char) continue;
      if (char.trim()) {
        return char;
      }
    }
    return '';
  }

  function isWithinPreservedTag(
    lowerHtml: string,
    index: number,
    tagNames: string[]
  ) {
    return tagNames.some((tag) => {
      const openTagIndex = lowerHtml.lastIndexOf(`<${tag}`, index);
      if (openTagIndex === -1) {
        return false;
      }
      const closeTagIndex = lowerHtml.lastIndexOf(`</${tag}>`, index);
      return openTagIndex > closeTagIndex;
    });
  }

  function keyToCamelCase(obj: { [key: string]: string } | null) {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      const camelCaseKey = key.replace(/-([a-z])/g, (match, p1) =>
        p1.toUpperCase()
      );
      newObj[camelCaseKey] = obj[key];
    }
    return newObj;
  }

  function preprocessText(text: string) {
    // Protection regex for code blocks and math blocks
    // For inline math $...$, we match content that contains at least one "math character"
    // (letter, backslash, caret, underscore, braces, parens, or math operators)
    // This avoids matching currency like $100 while allowing math like $2x$ or $2(a+b)$
    const protectedBlockRegex =
      /```[\s\S]*?```|`[^`\n]*`|\$\$[\s\S]*?\$\$|\$[^$\n]*[a-zA-Z_{}()+*/<>=\\^][^$\n]*\$/g;
    const matches = [...text.matchAll(protectedBlockRegex)];

    if (!matches.length) {
      return preprocessNonCode(text, { isAtStart: true, isAtEnd: true });
    }

    let lastIndex = 0;
    let processedText = '';

    matches.forEach((match) => {
      const beforeCode = text.slice(lastIndex, match.index!);
      if (beforeCode) {
        processedText += preprocessNonCode(beforeCode, {
          isAtStart: lastIndex === 0,
          isAtEnd: false
        });
      }

      processedText += match[0];
      lastIndex = match.index! + match[0].length;
    });

    const tail = text.slice(lastIndex);
    if (tail) {
      processedText += preprocessNonCode(tail, {
        isAtStart: lastIndex === 0,
        isAtEnd: true
      });
    }

    return processedText;
  }

  function preprocessNonCode(
    text: string,
    options?: { isAtStart?: boolean; isAtEnd?: boolean }
  ) {
    let processedText = text;

    const PLACEHOLDERS: string[] = [];
    function protect(regex: RegExp) {
      processedText = processedText.replace(regex, (match) => {
        const idx = PLACEHOLDERS.push(match.replace(/_/g, '%5F')) - 1;
        return `%%PH${idx}%%`;
      });
    }
    function unprotect() {
      processedText = processedText.replace(
        /%%PH(\d+)%%/g,
        (_, i) => PLACEHOLDERS[+i]
      );
    }

    protect(/(?:https?:\/\/|www\.|\/users\/)[^\s<>()]+/g);
    protect(/@[A-Za-z0-9_]{3,}/g);

    if (!isAIMessage) {
      if (processedText.includes('<')) {
        processedText = processedText.replace(/</g, '&lt;');
      }
      if (processedText.includes('>')) {
        processedText = processedText.replace(/>/g, '&gt;');
      }
      if (processedText.includes('=')) {
        processedText = processedText.replace(/=/g, '\\=');
      }
      if (processedText.includes('-')) {
        processedText = processedText.replace(/-(?!\s\[[x ]\])/g, '\\-');
      }
      if (processedText.includes('+')) {
        processedText = processedText.replace(/\+/g, '&#43;');
      }
    }

    const lines = processedText.split('\n');
    const tablePattern = /\|.*\|.*\|/;
    const containsTable = lines.some((line) => tablePattern.test(line));

    if (containsTable) {
      const isTableLine = (line: string) => tablePattern.test(line.trim());
      const restoreTableSyntax = (line: string) =>
        line.replace(/\\-/g, '-').replace(/&#43;/g, '+');
      processedText = lines
        .map((line) =>
          isTableLine(line)
            ? restoreTableSyntax(line)
            : line.replace(/_/g, '\\_')
        )
        .join('\n');
    } else if (processedText.includes('_')) {
      processedText = processedText.replace(/_/g, '\\_');
    }

    unprotect();

    processedText = ensureListBreakBeforeLabels(processedText);

    if (isAIMessage) {
      return processedText;
    }

    const maxNbsp = 9;
    let nbspCount = 0;
    let inList = false;
    let lastLineWasList = false;
    const startsWithBoundaryNewline =
      !options?.isAtStart && text.startsWith('\n');
    const endsWithBoundaryNewline = !options?.isAtEnd && text.endsWith('\n');

    const listLineRegex = /^\s*(?:[*+\-]|•|\d+\.)\s+/;
    const processedLines = processedText.split('\n').map((line, index, arr) => {
      const trimmedLine = line.trim();
      const isList = listLineRegex.test(trimmedLine);
      const isLeadingBoundaryLine =
        startsWithBoundaryNewline && index === 0 && trimmedLine === '';
      const isTrailingBoundaryLine =
        endsWithBoundaryNewline &&
        index === arr.length - 1 &&
        trimmedLine === '';
      const shouldPreserveBoundaryLine =
        isLeadingBoundaryLine || isTrailingBoundaryLine;

      if (isList) {
        inList = true;
        lastLineWasList = true;
      } else if (trimmedLine === '' && inList) {
        inList = false;
        lastLineWasList = true;
      } else if (trimmedLine !== '') {
        lastLineWasList = false;
      }

      if (
        trimmedLine === '' &&
        !shouldPreserveBoundaryLine &&
        !lastLineWasList &&
        nbspCount < maxNbsp
      ) {
        if (line === '') {
          nbspCount++;
          return '&nbsp;';
        }
        return line;
      }
      return line;
    });

    return processedLines.join('\n');
  }

  function ensureListBreakBeforeLabels(text: string) {
    if (!text) {
      return text;
    }
    const angleLabelPattern = '(?:&lt;|&#x3C;)[^>\\n]+(?:>|&gt;)';
    const strongLabelPattern = '(?:\\*\\*|__)[^\\n]+?:(?:\\*\\*|__)';
    const emLabelPattern = '(?:\\*|_)[^\\n]+?:(?:\\*|_)';
    const labelPattern = `(?:${angleLabelPattern}|${strongLabelPattern}|${emLabelPattern})`;
    const listLinePattern = '(?:[*+\\-]|\\d+\\.|•)';
    const regex = new RegExp(
      `(^|\\n)(\\s*${listLinePattern}\\s[^\\n]+)\\n(\\s*${labelPattern})`,
      'g'
    );
    return text.replace(regex, (_, prefix, listLine, labelLine) => {
      return `${prefix || ''}${listLine}\n\n${labelLine}`;
    });
  }

  function removeNbsp(text?: string) {
    if (isAIMessage) return text;
    if (typeof text !== 'string') return text;

    return (text || '').replace(/&(?:amp;)?nbsp;/g, '').replace(/\u00A0/g, '');
  }

  function unescapeHtml(text: string) {
    if (typeof text !== 'string') return text;
    if (!(text.includes('&lt;') || text.includes('&gt;'))) return text;
    return (text || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }

  function unescapeEqualSignAndDash(text: string) {
    if (typeof text !== 'string') return text;
    if (
      !(
        text.includes('\\=') ||
        text.includes('%5C=') ||
        text.includes('\\-') ||
        text.includes('\\_') ||
        text.includes('%5C-') ||
        text.includes('%5C_') ||
        text.includes('%5F')
      )
    ) {
      return text;
    }

    let result = (text || '')
      .replace(/%5C/gi, '\\')
      .replace(/\\=/g, '=')
      .replace(/\\-/g, '-')
      .replace(/\\_/g, '_')
      .replace(/%5F/gi, '_');

    return result;
  }
}

export default React.memo(Markdown);
