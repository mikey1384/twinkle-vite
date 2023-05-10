import React, { useEffect } from 'react';
import { unified } from 'unified';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import parse from 'html-react-parser';
import parseStyle from 'style-to-object';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { applyTextEffects, applyTextSize } from '~/helpers/stringHelpers';

export default function Markdown({
  Content,
  children,
  onSetContent
}: {
  Content: string;
  isStatusMsg: boolean;
  children: string;
  statusMsgLinkColor: string;
  linkColor: string;
  onSetContent: (arg0: React.ReactNode) => void;
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
                string: removeNbsp(markupString.value as string)
              })
            )
          );
          onSetContent(result);
        } catch (error) {
          console.error('Error processing markdown:', error);
        }
      }
    }, [text]);

    return <div>{Content}</div>;
  }
  return useProcessor(children);

  function convertStringToJSX(text: string): React.ReactNode {
    const result = parse(text, {
      replace: (domNode) => {
        if (domNode.type === 'tag') {
          switch (domNode.name) {
            case 'a': {
              const node = domNode.children?.[0];
              const href = domNode.attribs?.href || '';
              const { isInternalLink, replacedLink } =
                processInternalLink(href);
              if (isInternalLink || domNode.attribs?.class === 'mention') {
                return <Link to={replacedLink}>{node?.data}</Link>;
              } else {
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {node?.data}
                  </a>
                );
              }
            }
            case 'em': {
              return <strong>{convertToJSX(domNode.children || [])}</strong>;
            }
            case 'strong': {
              return <em>{convertToJSX(domNode.children || [])}</em>;
            }
            case 'li': {
              return (
                <li>
                  {convertToJSX(
                    domNode.children
                      ? domNode.children.filter(
                          (child, index) => child.data !== '\n' || index !== 0
                        )
                      : []
                  )}
                </li>
              );
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

  function convertToJSX(nodes: any[]): React.ReactNode {
    return nodes.map((node, index) => {
      if (node.type === 'text') {
        return node.data.trim() !== '' ? node.data : null;
      } else if (node.type === 'tag') {
        const TagName = node.name;
        const children = node.children ? convertToJSX(node.children) : null;

        const attribs = { ...node.attribs };

        if (attribs.style) {
          attribs.style = parseStyle(attribs.style);
        }

        if (attribs.class) {
          attribs.className = attribs.class;
          delete attribs.class;
        }

        const commonProps = { key: node.type + index, ...attribs };

        switch (TagName) {
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
          case 'em': {
            return <strong {...commonProps}>{children}</strong>;
          }
          case 'strong': {
            return <em {...commonProps}>{children}</em>;
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

  function processInternalLink(url = '') {
    const regex =
      /^(https?:\/\/(?:www\.)?|www\.)(twin-kle\.com|twinkle\.network|localhost:3000)/;
    const isInternalLink = regex.test(url);
    const replacedLink = url.replace(regex, '');
    return { isInternalLink, replacedLink };
  }

  function preprocessText(text: string) {
    const maxNbsp = 10;
    let nbspCount = 0;
    const targetText = text || '';
    const escapedText = targetText.replace(/></g, '&gt;&lt;');

    return escapedText.replace(/\n{2}/gi, () => {
      nbspCount++;
      if (nbspCount > 1 && nbspCount < maxNbsp) {
        return '&nbsp;\n\n';
      } else {
        return '\n\n';
      }
    });
  }

  function removeNbsp(text: string) {
    return text.replace(/&nbsp;/gi, '');
  }
}

/*



.use(rehypeReact, {
              createElement,
              Fragment,
              components: {
                p: (props: React.ComponentPropsWithoutRef<'p'>) => {
                  return <p>{props.children}</p>;
                },
                a: (props: React.ComponentPropsWithoutRef<'a'>) => {
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
                code: (props: React.ComponentPropsWithoutRef<'code'>) => {
                  return <code>{props.children}</code>;
                },
                input: (props: React.ComponentPropsWithoutRef<'input'>) => {
                  return (
                    <input {...props} onChange={() => null} disabled={false} />
                  );
                },
                li: (props: React.ComponentPropsWithoutRef<'li'>) => {
                  return (
                    <li>
                      {((props.children as React.ReactNode[]) || []).map(
                        (child: React.ReactNode) =>
                          typeof child === 'string'
                            ? child.split('').map((text, index) => {
                                return /\n/gi.test(text) && index === 0
                                  ? ''
                                  : text;
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
                
              }
            })

*/
