import React, { createElement, useEffect, useState, Fragment } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { Link } from 'react-router-dom';
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeReact from 'rehype-react';

export default function Markdown({
  isStatusMsg,
  children,
  statusMsgLinkColor,
  linkColor
}: {
  isStatusMsg: boolean;
  children: string;
  statusMsgLinkColor: string;
  linkColor: string;
}) {
  function useProcessor(text: string) {
    const [Content, setContent] = useState<any>(Fragment);

    useEffect(() => {
      unified()
        .use(remarkParse)
        .use(remarkBreaks)
        .use(remarkGfm)
        .use(remarkRehype)
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
                    color: Color[isStatusMsg ? statusMsgLinkColor : linkColor]()
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
                            return /\n/gi.test(text) && index === 0 ? '' : text;
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
                    {props.children}
                  </table>
                </div>
              );
            }
          }
        })
        .process(text)
        .then((file) => {
          setContent(file.result);
        });
    }, [text]);

    return Content;
  }
  return useProcessor(children);

  function processInternalLink(url = '') {
    const regex =
      /^(https?:\/\/(?:www\.)?|www\.)(twin-kle\.com|twinkle\.network|localhost:3000)/;
    const isInternalLink = regex.test(url);
    const replacedLink = url.replace(regex, '');
    return { isInternalLink, replacedLink };
  }
}
