import React, { useState } from 'react';
import { Highlight, PrismTheme } from 'prism-react-renderer';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

interface CodeBlockProps {
  language: string;
  value: string;
}

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

function CodeBlock({ language, value }: CodeBlockProps) {
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

  const CopyButton = ({ position }: { position: 'top' | 'bottom' }) => (
    <button
      onClick={handleCopy}
      className={css`
        position: absolute;
        ${position === 'top' ? 'top: 10px;' : 'bottom: 10px;'}
        right: 10px;
        background: rgba(149, 157, 165, 0.2);
        border: none;
        color: #e1e4e8;
        padding: 5px 10px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica,
          Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
        font-size: 12px;
        &:hover {
          background: rgba(149, 157, 165, 0.3);
        }
        @media (max-width: 600px) {
          font-size: 10px;
          padding: 3px 6px;
        }
      `}
    >
      {isCopied ? <Icon icon="check" /> : <Icon icon="copy" />}
      <span style={{ marginLeft: '5px' }}>{isCopied ? 'Copied!' : 'Copy'}</span>
    </button>
  );

  return (
    <div
      className={css`
        position: relative;
        font-family: 'Fira Code', 'Source Code Pro', Menlo, Monaco, Consolas,
          'Courier New', monospace;
        font-size: 14px;
        line-height: 1.5;
        @media (max-width: 600px) {
          font-size: 11px;
        }
      `}
    >
      <Highlight theme={githubDark} code={value} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} ${css`
              padding: 1em;
              overflow-x: auto;
              border: 1px solid #444d56;
              border-radius: 6px;
              @media (max-width: 600px) {
                padding: 0.75em;
              }
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
      <CopyButton position="top" />
      <CopyButton position="bottom" />
    </div>
  );
}

export default React.memo(CodeBlock);
