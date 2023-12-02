import React, { useEffect, useState, memo } from 'react';
import { unified } from 'unified';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import parse from 'html-react-parser';
import parseStyle from 'style-to-object';
import EmbeddedComponent from './EmbeddedComponent';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import {
  applyTextEffects,
  applyTextSize,
  processInternalLink
} from '~/helpers/stringHelpers';

function Markdown({
  contentId,
  contentType,
  children,
  isProfileComponent,
  isAIMessage,
  linkColor,
  markerColor,
  onSetIsParsed
}: {
  contentId?: number;
  contentType?: string;
  isProfileComponent?: boolean;
  isAIMessage?: boolean;
  children: string;
  linkColor: string;
  markerColor: string;
  onSetIsParsed: (parsed: boolean) => void;
}) {
  const [Content, setContent] = useState<any>(<>{children}</>);
  useEffect(() => {
    const hasExcessivelyLongWord = (text: string) => {
      const words = text.split(/\s+/);
      return words.some((word) => word.length > 800);
    };

    if (hasExcessivelyLongWord(children)) {
      setContent(children);
      onSetIsParsed(true);
    } else {
      processMarkdown();
    }

    async function processMarkdown() {
      try {
        const preprocessedText = preprocessText(children);
        const markupString = await unified()
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
        setContent(result);
        onSetIsParsed(true);
      } catch (error) {
        console.error('Error processing markdown:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkColor, markerColor, children]);

  return <>{Content}</>;

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
              if (isInternalLink || domNode.attribs?.class === 'mention') {
                return (
                  <Link style={{ color: linkColor }} to={replacedLink}>
                    {node?.data}
                  </Link>
                );
              } else {
                return (
                  <a
                    style={{
                      ...parseStyle(domNode.attribs?.style || ''),
                      color: linkColor
                    }}
                    href={href}
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
        const commonProps: { [key: string]: any } = {
          key: node.type + index,
          ...attribs
        };
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
              return (
                <Link
                  {...commonProps}
                  style={{
                    ...attribs.style,
                    color: linkColor
                  }}
                  to={replacedLink}
                >
                  {children?.length
                    ? children.map((child: any) =>
                        unescapeEqualSignAndDash(child)
                      )
                    : 'Link'}
                </Link>
              );
            } else {
              return (
                <a
                  {...commonProps}
                  style={{
                    ...attribs.style,
                    color: linkColor
                  }}
                  target="_blank"
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
              <code {...commonProps}>
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
              <em {...commonProps}>{children}</em>
            ) : (
              <strong {...commonProps}>{children}</strong>
            );
          }
          case 'img': {
            return (
              <EmbeddedComponent
                {...commonProps}
                isProfileComponent={isProfileComponent}
                contentId={contentId}
                contentType={contentType}
              />
            );
          }
          case 'input':
            if (attribs.type === 'checkbox') {
              return (
                <input
                  {...attribs}
                  checked={Object.keys(attribs).includes('checked')}
                  key={index}
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
              >
                {children}
              </li>
            );
          }
          case 'strong': {
            return isAIMessage ? (
              <strong {...commonProps}>{children}</strong>
            ) : (
              <em {...commonProps}>{children}</em>
            );
          }
          case 'table':
            return (
              <div
                key={index}
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
            const params = [TagName, commonProps];
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
            docFrag.appendChild(tempDiv.firstChild);
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
        text.includes('%5C-')
      )
    ) {
      return text;
    }

    return (text || '')
      .replace(/\\=/g, '=')
      .replace(/\\-/g, '-')
      .replace(/%5C=/g, '=')
      .replace(/%5C-/g, '-');
  }
}

export default memo(Markdown);
