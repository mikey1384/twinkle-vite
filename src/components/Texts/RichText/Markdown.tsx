import React, { Fragment, useEffect, useState } from 'react';
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
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import {
  applyTextEffects,
  applyTextSize,
  processInternalLink
} from '~/helpers/stringHelpers';

export default function Markdown({
  contentId,
  contentType,
  children,
  isInvisible,
  isProfileComponent,
  isAIMessage,
  linkColor,
  markerColor,
  onSetIsParsed
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
}) {
  const key = `${contentId}-${contentType}`;
  const [Content, setContent] = useState<any>(
    <Fragment key={key}>{children}</Fragment>
  );
  useEffect(() => {
    const hasExcessivelyLongWord = (text: string) => {
      const words = text.split(/\s+/);
      return words.some((word) => {
        const isMarkdownImage = /^!\[.*\]\(.*\)$/.test(word);
        return !isMarkdownImage && word.length > 800;
      });
    };

    if (hasExcessivelyLongWord(children)) {
      setContent(<Fragment key={key}>{children}</Fragment>);
      onSetIsParsed(true);
    } else {
      processMarkdown();
    }

    async function processMarkdown() {
      try {
        const preprocessedText = preprocessText(children);
        const markupString = isAIMessage
          ? await unified()
              .use(remarkParse)
              .use(remarkGfm)
              .use(remarkMath)
              .use(remarkRehype)
              .use(rehypeKatex)
              .use(rehypeStringify)
              .process(
                preprocessedText
                  .replace(/\\\[([\s\S]*?)\\\]/g, (_, p1) => `$${p1}$`)
                  .replace(
                    /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g,
                    (_, p1, p2) => `$${p1 || p2}$`
                  )
              )
          : await unified()
              .use(remarkParse)
              .use(remarkGfm)
              .use(remarkRehype)
              .use(rehypeStringify)
              .process(preprocessedText);
        const result = convertStringToJSX({
          string:
            removeNbsp(
              handleMentions(
                applyTextSize(
                  applyTextEffects({
                    string: markupString.value as string
                  })
                )
              )
            ) || ''
        });
        setContent(<Fragment key={key}>{result}</Fragment>);
        onSetIsParsed(true);
      } catch (error) {
        console.error('Error processing markdown:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkColor, markerColor, children]);

  return (
    <ErrorBoundary
      componentPath={`components/Texts/RichText/Markdown/Rendered/Content${
        isInvisible ? '/Invisible' : '/Visible'
      }`}
    >
      {Content}
    </ErrorBoundary>
  );

  function convertStringToJSX({ string }: { string: string }): React.ReactNode {
    const result = parse(string, {
      replace: (domNode) => {
        if (domNode.type === 'tag') {
          if (domNode?.attribs?.class) {
            domNode.attribs.className = domNode.attribs.class;
            delete domNode.attribs.class;
          }
          switch (domNode.name) {
            case 'a': {
              const node = domNode.children?.[0];
              let href = unescapeEqualSignAndDash(domNode.attribs?.href || '');
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
                cleanLink = cleanLink.replace(/]t|]s|]h|]b/g, '');
                return (
                  <Link style={{ color: linkColor }} to={cleanLink}>
                    {node?.data}
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
                    {unescapeEqualSignAndDash(node?.data || 'Link')}
                  </a>
                );
              }
            }
            case 'code': {
              return (
                <code {...domNode.attribs}>
                  {domNode.children &&
                    domNode.children.map((node) => {
                      if (node.name === 'br') {
                        return '\n';
                      }
                      const unescapedChildren = node
                        ? unescapeEqualSignAndDash(
                            unescapeHtml(node.data || '')
                          )
                        : '';
                      return removeNbsp(unescapedChildren);
                    })}
                </code>
              );
            }
            case 'em': {
              return isAIMessage ? (
                <em>{convertToJSX(domNode.children || [])}</em>
              ) : (
                <strong>{convertToJSX(domNode.children || [])}</strong>
              );
            }
            case 'img': {
              return (
                <EmbeddedComponent
                  contentId={contentId}
                  contentType={contentType}
                  isProfileComponent={isProfileComponent}
                  src={domNode.attribs?.src || ''}
                  alt={domNode.attribs?.alt || ''}
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
              return (
                <div
                  style={{
                    width: '100%',
                    marginInlineStart: '0px',
                    marginInlineEnd: '0px',
                    display: 'block'
                  }}
                >
                  {convertToJSX(domNode.children || [])}
                </div>
              );
            }
            case 'strong': {
              return isAIMessage ? (
                <strong>{convertToJSX(domNode.children || [])}</strong>
              ) : (
                <em>{convertToJSX(domNode.children || [])}</em>
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
                    {convertToJSX(domNode.children || [])}
                  </table>
                </div>
              );
            }
            default:
              break;
          }
        }
      }
    });
    return result;
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
      if (node.type === 'text') {
        if (
          node.data.includes('\n') &&
          node.parent?.name !== 'tr' &&
          node.parent?.name !== 'th' &&
          node.parent?.name !== 'table' &&
          node.parent?.name !== 'thead' &&
          node.parent?.name !== 'tbody' &&
          node.parent?.name !== 'li'
        ) {
          return isAIMessage
            ? node.data
            : node.data
                .split('\n')
                .flatMap((segment: string, subIndex: number) => [
                  subIndex > 0 && <br key={`br-${index}-${subIndex}`} />,
                  segment
                ]);
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
        const key = `${node.type} + ${index}`;
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
                    ? children.map((child: any) =>
                        unescapeEqualSignAndDash(child)
                      )
                    : 'Link'}
                </Link>
              );
            } else {
              let cleanHref = decodeURIComponent(href);
              cleanHref = cleanHref.replace(/]t|]s|]h|]b/g, '');
              return (
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
              );
            }
          }
          case 'code': {
            return (
              <code {...commonProps} key={key}>
                {children &&
                  children.map((child: any) => {
                    const unescapedChild = unescapeEqualSignAndDash(
                      unescapeHtml(child || '')
                    );
                    return removeNbsp(unescapedChild);
                  })}
              </code>
            );
          }
          case 'em': {
            return isAIMessage ? (
              <em {...commonProps} key={key}>
                {children}
              </em>
            ) : (
              <strong {...commonProps} key={key}>
                {children}
              </strong>
            );
          }
          case 'img': {
            return (
              <EmbeddedComponent
                {...commonProps}
                isProfileComponent={isProfileComponent}
                contentId={contentId}
                contentType={contentType}
                key={key}
              />
            );
          }
          case 'input':
            if (attribs.type === 'checkbox') {
              return (
                <input
                  {...attribs}
                  checked={Object.keys(attribs).includes('checked')}
                  key={key}
                  onChange={() => null}
                  disabled={false}
                />
              );
            }
            break;
          case 'li': {
            return (
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
            );
          }
          case 'strong': {
            return isAIMessage ? (
              <strong {...commonProps} key={key}>
                {children}
              </strong>
            ) : (
              <em {...commonProps} key={key}>
                {children}
              </em>
            );
          }
          case 'table':
            return (
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
                  {children}
                </table>
              </div>
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

  function handleMentions(text: string) {
    const mentionRegex = /@[a-zA-Z0-9_]{3,}/gi;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    traverse(doc.body);
    let result = doc.body.innerHTML;
    if (result.includes('\n')) {
      result = result.replace('\n', '<br />');
    }
    if (result.includes('＠')) {
      result = result.replace(/＠/g, '@');
    }
    return result;

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
        if (mentionRegex.test(nodeValue)) {
          newNodeValue = newNodeValue.replace(
            mentionRegex,
            (string: string) => {
              const path = string.slice(1);
              const anchor = `<a class="mention" href="/users/${path}">@${path}</a>`;
              return anchor;
            }
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
    let processedText = text;
    if (processedText.includes('<')) {
      processedText = processedText.replace(/</g, '&lt;');
    }
    if (processedText.includes('>')) {
      processedText = processedText.replace(/>/g, '&gt;');
    }
    if (processedText.includes('=')) {
      processedText = processedText.replace(/=/g, '\\=');
    }
    if (processedText.includes('_')) {
      processedText = processedText.replace(/_/g, '\\_');
    }
    if (processedText.includes('-')) {
      processedText = processedText.replace(/-(?!\s\[[x ]\])/g, '\\-');
    }
    if (processedText.includes('+')) {
      processedText = processedText.replace(/\+/g, '&#43;');
    }
    const lines = processedText.split('\n');
    const tablePattern = new RegExp('\\|.*\\|.*\\|');
    const containsTable = lines.some((line) => tablePattern.test(line));
    if (containsTable || isAIMessage) {
      return text;
    }
    const maxNbsp = 9;
    let nbspCount = 0;
    let inList = false;
    let lastLineWasList = false;

    const processedLines = lines.map((line) => {
      const trimmedLine = line.trim();
      const isList = trimmedLine.match(/^\d\./);

      if (isList) {
        inList = true;
        lastLineWasList = true;
      } else if (trimmedLine === '' && inList) {
        inList = false;
        lastLineWasList = true;
      } else if (trimmedLine !== '') {
        lastLineWasList = false;
      }

      if (trimmedLine === '' && !lastLineWasList && nbspCount < maxNbsp) {
        nbspCount++;
        return line + '&nbsp;';
      } else {
        return line;
      }
    });
    return processedLines.join('\n');
  }

  function removeNbsp(text?: string) {
    if (isAIMessage) return text;
    if (typeof text !== 'string') return text;
    if (!text.includes('&nbsp;')) return text;
    return (text || '').replace(/&nbsp;/g, '');
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
        text.includes('%5C_')
      )
    ) {
      return text;
    }

    return (text || '')
      .replace(/\\=/g, '=')
      .replace(/\\-/g, '-')
      .replace(/\\_/g, '_')
      .replace(/%5C=/g, '=')
      .replace(/%5C-/g, '-')
      .replace(/%5C_/g, '_');
  }
}
