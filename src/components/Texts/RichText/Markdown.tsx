import React, { useEffect } from 'react';
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
  Content,
  children,
  isStatusMsg,
  isProfileComponent,
  listItemMarkerColor,
  statusMsgLinkColor,
  statusMsgListItemMarkerColor,
  linkColor,
  onSetContent,
  onSetImageLoaded
}: {
  contentId?: number;
  contentType?: string;
  Content: string;
  isStatusMsg: boolean;
  isProfileComponent?: boolean;
  children: string;
  statusMsgLinkColor: string;
  linkColor: string;
  listItemMarkerColor: string;
  statusMsgListItemMarkerColor: string;
  onSetContent: (arg0: React.ReactNode) => void;
  onSetImageLoaded: (arg0: boolean) => void;
}) {
  function useProcessor(text: string) {
    useEffect(() => {
      processMarkdown();

      async function processMarkdown() {
        try {
          const markupString = await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype)
            .use(rehypeStringify)
            .process(preprocessText(text));
          const result = convertStringToJSX(
            applyTextSize(
              applyTextEffects({
                string: markupString.value as string
              })
            )
          );
          onSetContent(result);
        } catch (error) {
          console.error('Error processing markdown:', error);
        }
      }
    }, [text]);

    return <>{Content}</>;
  }
  return useProcessor(children);

  function convertStringToJSX(text: string): React.ReactNode {
    const result = parse(text, {
      replace: (domNode) => {
        if (domNode.type === 'text') {
          domNode.data = reversePreprocessing(domNode.data);
        }
        if (domNode.type === 'tag') {
          switch (domNode.name) {
            case 'a': {
              const node = domNode.children?.[0];
              let href = domNode.attribs?.href || '';
              if (
                href &&
                !href.startsWith('http://') &&
                !href.startsWith('https://')
              ) {
                href = 'http://' + href;
              }
              const { isInternalLink, replacedLink } =
                processInternalLink(href);
              if (isInternalLink || domNode.attribs?.class === 'mention') {
                return <Link to={replacedLink}>{node?.data}</Link>;
              } else {
                return (
                  <a
                    style={{
                      ...parseStyle(domNode.attribs?.style || ''),
                      color:
                        Color[isStatusMsg ? statusMsgLinkColor : linkColor]()
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
                      color: ${Color[
                        isStatusMsg
                          ? statusMsgListItemMarkerColor
                          : listItemMarkerColor
                      ]()} !important;
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
                    marginInlineEnd: '0px'
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
    return nodes.map((node, index) => {
      if (node.type === 'text') {
        return node.data.trim() !== '' || /^ +$/.test(node.data)
          ? reversePreprocessing(node.data)
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
            if (
              href &&
              !href.startsWith('http://') &&
              !href.startsWith('https://')
            ) {
              href = 'http://' + href;
            }
            const { isInternalLink, replacedLink } = processInternalLink(href);
            commonProps.href = href;
            if (isInternalLink || attribs?.className === 'mention') {
              return (
                <Link
                  {...commonProps}
                  style={{
                    ...attribs.style,
                    color: Color[isStatusMsg ? statusMsgLinkColor : linkColor]()
                  }}
                  to={replacedLink}
                >
                  {children?.length ? children : 'Link'}
                </Link>
              );
            } else {
              return (
                <a
                  {...commonProps}
                  style={{
                    ...attribs.style,
                    color: Color[isStatusMsg ? statusMsgLinkColor : linkColor]()
                  }}
                  target="_blank"
                >
                  {children?.length ? children : 'Link'}
                </a>
              );
            }
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
                    color: ${Color[
                      isStatusMsg
                        ? statusMsgListItemMarkerColor
                        : listItemMarkerColor
                    ]()} !important;
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

    return escapedText.replace(/\n{1}/gi, () => {
      nbspCount++;
      if (nbspCount <= maxNbsp) {
        return '&nbsp;\n';
      } else {
        return '\n';
      }
    });
  }

  function reversePreprocessing(text?: string) {
    return (text || '')
      .replace(/&nbsp;/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }
}
