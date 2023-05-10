import React, { useEffect, Fragment } from 'react';
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { Link } from 'react-router-dom';
import parse from 'html-react-parser';

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
            .process(text);
          const result = convertStringToJSX(markupString.value as string);
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
        if (domNode.type === 'tag' && domNode.name === 'a') {
          const node = domNode.children?.[0];
          const href = domNode.attribs?.href || '';
          const { isInternalLink, replacedLink } = processInternalLink(href);
          if (isInternalLink || domNode.attribs?.class === 'mention') {
            return <Link to={replacedLink}>{node?.data}</Link>;
          }
        }
      }
    });
    return result;
  }

  function processInternalLink(url = '') {
    const regex =
      /^(https?:\/\/(?:www\.)?|www\.)(twin-kle\.com|twinkle\.network|localhost:3000)/;
    const isInternalLink = regex.test(url);
    const replacedLink = url.replace(regex, '');
    return { isInternalLink, replacedLink };
  }
}

/*
 function applyTextEffects({
    string,
    isFinalProcessing,
    hasMention = true
  }: {
    string: string;
    isFinalProcessing?: boolean;
    hasMention?: boolean;
  }) {
    const italicRegex =
      /(((?![0-9.])\*\*[^\s*]+\*\*(?![0-9]))|(((\*\*[^\s]){1}((?!(\*\*))[^\n])+([^\s]\*\*){1})(?![0-9.])))/gi;
    const boldRegex =
      /(((?![0-9.])\*[^\s*]+\*(?![0-9]))|(((\*[^\s]){1}((?!(\*))[^\n])+([^\s]\*){1})(?![0-9.])))/gi;
    const underlineRegex =
      /(((?![0-9.])__([^\s][^_\n ]+)__(?![0-9]))|(((__[^_ ]){1}((?!(__))[^\n])+([^_ ]__){1})(?![0-9.])))/gi;
    const lineThroughRegex =
      /(((?![0-9.])--([^\s][^\n- ]+)--(?![0-9]))|(((--[^- ]){1}((?!(--))[^\n])+([^-\- ]--){1})(?![0-9.])))/gi;
    const blueRegex =
      /(((?![0-9.])b\|[^\s]+\|b(?![0-9]))|(((b\|[^\s]){1}((?!(b\||\|b))[^\n])+([^\s]\|b){1})(?![0-9.])))/gi;
    const grayRegex =
      /(((?![0-9.])gr\|[^\s]+\|gr(?![0-9]))|(((gr\|[^\s]){1}((?!(gr\||\|gr))[^\n])+([^\s]\|gr){1})(?![0-9.])))/gi;
    const greenRegex =
      /(((?![0-9.])g\|[^\s]+\|g(?![0-9]))|(((g\|[^\s]){1}((?!(g\||\|g))[^\n])+([^\s]\|g){1})(?![0-9.])))/gi;
    const limeRegex =
      /(((?![0-9.])l\|[^\s]+\|l(?![0-9]))|(((l\|[^\s]){1}((?!(l\||\|l))[^\n])+([^\s]\|l){1})(?![0-9.])))/gi;
    const logoBlueRegex =
      /(((?![0-9.])lb\|[^\s]+\|lb(?![0-9]))|(((lb\|[^\s]){1}((?!(lb\||\|lb))[^\n])+([^\s]\|lb){1})(?![0-9.])))/gi;
    const orangeRegex =
      /(((?![0-9.])o\|[^\s]+\|o(?![0-9]))|(((o\|[^\s]){1}((?!(o\||\|o))[^\n])+([^\s]\|o){1})(?![0-9.])))/gi;
    const passionFruitRegex =
      /(((?![0-9.])pf\|[^\s]+\|pf(?![0-9]))|(((pf\|[^\s]){1}((?!(pf\||\|pf))[^\n])+([^\s]\|pf){1})(?![0-9.])))/gi;
    const pinkRegex =
      /(((?![0-9.])p\|[^\s]+\|p(?![0-9]))|(((p\|[^\s]){1}((?!(p\||\|p))[^\n])+([^\s]\|p){1})(?![0-9.])))/gi;
    const purpleRegex =
      /(((?![0-9.])pu\|[^\s]+\|pu(?![0-9]))|(((pu\|[^\s]){1}((?!(pu\||\|pu))[^\n])+([^\s]\|pu){1})(?![0-9.])))/gi;
    const redRegex =
      /(((?![0-9.])r\|[^\s]+\|r(?![0-9]))|(((r\|[^\s]){1}((?!(r\||\|r))[^\n])+([^\s]\|r){1})(?![0-9.])))/gi;
    const yellowRegex =
      /(((?![0-9.])y\|[^\s]+\|y(?![0-9]))|(((y\|[^\s]){1}((?!(y\||\|y))[^\n])+([^\s]\|y){1})(?![0-9.])))/gi;
    const fakeAtSymbolRegex = /＠/gi;
    const mentionRegex = /((?!([a-zA-Z1-9])).|^|\n)@[a-zA-Z0-9_]{3,}/gi;

    let result = string
      .replace(/(<br>)/gi, '\n')
      .replace(
        blueRegex,
        (string) =>
          `<span style="color: rgb(5,110,178);">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        greenRegex,
        (string) =>
          `<span style="color: rgb(40,182,44);">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        limeRegex,
        (string) =>
          `<span style="color: lawngreen;">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        logoBlueRegex,
        (string) =>
          `<span style="color: rgb(65, 140, 235);">${string.substring(
            3,
            string.length - 3
          )}</span>`
      )
      .replace(
        orangeRegex,
        (string) =>
          `<span style="color: orange;">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        passionFruitRegex,
        (string) =>
          `<span style="color: rgb(243,103,123);">${string.substring(
            3,
            string.length - 3
          )}</span>`
      )
      .replace(
        pinkRegex,
        (string) =>
          `<span style="color: rgb(255,105,180);">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        purpleRegex,
        (string) =>
          `<span style="color: rgb(152,28,235);">${string.substring(
            3,
            string.length - 3
          )}</span>`
      )
      .replace(
        grayRegex,
        (string) =>
          `<span style="color: gray;">${string.substring(
            3,
            string.length - 3
          )}</span>`
      )
      .replace(
        redRegex,
        (string) =>
          `<span style="color: red;">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        yellowRegex,
        (string) =>
          `<span style="color: rgb(255,210,0);">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        italicRegex,
        (string) => `<i>${string.substring(2, string.length - 2)}</i>`
      )
      .replace(
        boldRegex,
        (string) => `<b>${string.substring(1, string.length - 1)}</b>`
      )
      .replace(
        underlineRegex,
        (string) => `<u>${string.substring(2, string.length - 2)}</u>`
      )
      .replace(
        lineThroughRegex,
        (string) => `<s>${string.substring(2, string.length - 2)}</s>`
      );

    if (hasMention) {
      result = (result || '').replace(mentionRegex, (string) => {
        const path = string.split('@')?.[1];
        const firstChar = string.split('@')?.[0];
        return `${firstChar}<a class="mention" href="/users/${path}">@${path}</a>`;
      });
    }
    result = (result || '').replace(/\n/g, '<br>');
    return isFinalProcessing ? result.replace(fakeAtSymbolRegex, '@') : result;
  }


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

*/
