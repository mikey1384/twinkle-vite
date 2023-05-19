import React, { useEffect, useState } from 'react';
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

export default function Markdown({
  contentId,
  contentType,
  children,
  isProfileComponent,
  linkColor,
  markerColor,
  onSetIsParsed,
  onSetImageLoaded
}: {
  contentId?: number;
  contentType?: string;
  isProfileComponent?: boolean;
  children: string;
  linkColor: string;
  markerColor: string;
  onSetIsParsed: (parsed: boolean) => void;
  onSetImageLoaded: (arg0: boolean) => void;
}) {
  const [Content, setContent] = useState<any>(<>{children}</>);
  useEffect(() => {
    processMarkdown();

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
              let href = domNode.attribs?.href || '';
              const { isInternalLink, replacedLink } =
                processInternalLink(href);
              if (
                !isInternalLink &&
                href &&
                !href.startsWith('http://') &&
                !href.startsWith('https://')
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
                    {node?.data || 'Link'}
                  </a>
                );
              }
            }
            case 'code': {
              const node =
                domNode.children && domNode.children.length > 0
                  ? domNode.children[0]
                  : null;
              const unescapedChildren = node
                ? unescapeHtml(node.data || '')
                : '';
              return (
                <code {...domNode.attribs}>
                  {removeNbsp(unescapedChildren)}
                </code>
              );
            }
            case 'em': {
              return <strong>{convertToJSX(domNode.children || [])}</strong>;
            }
            case 'img': {
              return (
                <EmbeddedComponent
                  contentId={contentId}
                  contentType={contentType}
                  isProfileComponent={isProfileComponent}
                  src={domNode.attribs?.src || ''}
                  alt={domNode.attribs?.alt || ''}
                  onLoad={() => onSetImageLoaded(true)}
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
              return <em>{convertToJSX(domNode.children || [])}</em>;
            }
            case 'table': {
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
          node.parent?.name !== 'tbody'
        ) {
          return node.data
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
            let href = attribs?.href || '';
            const { isInternalLink, replacedLink } = processInternalLink(href);
            if (
              !isInternalLink &&
              href &&
              !href.startsWith('http://') &&
              !href.startsWith('https://')
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
                  {children?.length || Object.keys(children)?.length
                    ? children
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
                  {children?.length ? children : 'Link'}
                </a>
              );
            }
          }
          case 'code': {
            const unescapedChildren = unescapeHtml(children?.[0] || '');
            return (
              <code {...commonProps}>{removeNbsp(unescapedChildren)}</code>
            );
          }
          case 'em': {
            return <strong {...commonProps}>{children}</strong>;
          }
          case 'img': {
            return (
              <EmbeddedComponent
                {...commonProps}
                isProfileComponent={isProfileComponent}
                contentId={contentId}
                contentType={contentType}
                onLoad={() => onSetImageLoaded(true)}
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
            return <em {...commonProps}>{children}</em>;
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
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (
        node.parentNode?.nodeName.toLowerCase() !== 'a' &&
        node.parentNode?.nodeName.toLowerCase() !== 'code'
      ) {
        const parent = node.parentNode;
        const nodeValue = node.nodeValue || '';

        const newNodeValue = nodeValue.replace(mentionRegex, (string) => {
          const path = string.slice(1);
          const anchor = `<a class="mention" href="/users/${path}">@${path}</a>`;
          return anchor;
        });

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
    }
    return doc.body.innerHTML.replace('\n', '<br />').replace(/＠/g, '@');
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
    const maxNbsp = 9;
    let nbspCount = 0;
    const targetText = text || '';
    const escapedText = targetText.replace(/>/g, '&gt;').replace(/</g, '&lt;');

    return escapedText.replace(/(?<!\|)\n(?!.*\|)/gi, () => {
      nbspCount++;
      if (nbspCount <= maxNbsp) {
        return '&nbsp;\n';
      } else {
        return '\n';
      }
    });
  }
  function removeNbsp(text?: string) {
    if (typeof text !== 'string') return text;
    return (text || '').replace(/&nbsp;/g, '');
  }
  function unescapeHtml(text: string) {
    if (typeof text !== 'string') return text;
    return (text || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }
}
