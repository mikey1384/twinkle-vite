import React, { useState } from 'react';
import { Highlight, PrismTheme } from 'prism-react-renderer';
import { css } from '@emotion/css';
import CopyButton from './CopyButton';

const githubDark: PrismTheme = {
  plain: {
    color: '#e1e4e8',
    backgroundColor: '#24292e'
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {
        color: '#6a737d'
      }
    },
    {
      types: ['namespace'],
      style: {
        opacity: 0.7
      }
    },
    {
      types: ['string', 'attr-value'],
      style: {
        color: '#9ecbff'
      }
    },
    {
      types: ['punctuation', 'operator'],
      style: {
        color: '#e1e4e8'
      }
    },
    {
      types: [
        'entity',
        'url',
        'symbol',
        'number',
        'boolean',
        'variable',
        'constant',
        'property',
        'regex',
        'inserted'
      ],
      style: {
        color: '#79b8ff'
      }
    },
    {
      types: ['atrule', 'keyword', 'attr-name', 'selector'],
      style: {
        color: '#f97583'
      }
    },
    {
      types: ['function', 'deleted', 'tag'],
      style: {
        color: '#b392f0'
      }
    },
    {
      types: ['function-variable'],
      style: {
        color: '#d2a8ff'
      }
    },
    {
      types: ['tag', 'selector', 'keyword'],
      style: {
        color: '#85e89d'
      }
    }
  ]
};

function CodeBlock({
  language,
  value,
  stickyTopGap
}: {
  language: string;
  value: string;
  stickyTopGap?: number | string;
}) {
  const [isCopied, setIsCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy!', err);
      });
  }

  return (
    <div
      className={css`
        position: relative;
        font-family: 'Fira Code', 'Source Code Pro', Menlo, Monaco, Consolas,
          'Courier New', monospace;
        font-size: 14px;
        line-height: 1.5;
        border: 1px solid #444d56;
        border-radius: 6px;
        background-color: #24292e;
      `}
    >
      <div
        className={css`
          position: absolute;
          z-index: 0;
          display: flex;
          width: 100%;
          height: 44px;
          background-color: #36403f;
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
        `}
      >
        <span
          className={css`
            color: #e1e4e8;
            font-size: 12px;
            display: flex;
            align-items: center;
            margin-left: 10px;
            font-family: ui-sans-serif, -apple-system, system-ui, Segoe UI,
              Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji,
              Segoe UI Symbol;
          `}
        >
          {language}
        </span>
      </div>

      <div
        className={css`
          position: sticky;
          z-index: 1;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 10px;
          background-color: transparent;
        `}
        style={{ top: stickyTopGap ?? 0 }}
      >
        <CopyButton onCopy={handleCopy} isCopied={isCopied} />
      </div>

      <div>
        <Highlight theme={githubDark} code={value} language={language}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={`${className} ${css`
                padding: 1em;
                margin: 0;
                background-color: #24292e;
              `}`}
              style={style}
            >
              {tokens.map((line, i) => (
                <div {...getLineProps({ line, key: i })} key={i}>
                  {line.map((token, key) => (
                    <span {...getTokenProps({ token, key })} key={key} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}

export default React.memo(CodeBlock);
