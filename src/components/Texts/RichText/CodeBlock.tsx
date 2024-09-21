import React, { useState } from 'react';
import { Highlight, PrismTheme } from 'prism-react-renderer';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

interface CodeBlockProps {
  language: string;
  value: string;
}

// Custom GitHub Dark-inspired theme
const githubDark: PrismTheme = {
  plain: {
    color: '#c9d1d9',
    backgroundColor: '#0d1117'
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {
        color: '#8b949e'
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
        color: '#a5d6ff'
      }
    },
    {
      types: ['punctuation', 'operator'],
      style: {
        color: '#c9d1d9'
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
        color: '#79c0ff'
      }
    },
    {
      types: ['atrule', 'keyword', 'attr-name', 'selector'],
      style: {
        color: '#ff7b72'
      }
    },
    {
      types: ['function', 'deleted', 'tag'],
      style: {
        color: '#ffa198'
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
        color: '#7ee787'
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

  return (
    <div
      className={css`
        position: relative;
        margin: 1em 0;
      `}
    >
      <Highlight theme={githubDark} code={value} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={className}
            style={{
              ...style,
              padding: '1em',
              overflowX: 'auto',
              border: '1px solid #30363d',
              borderRadius: '6px',
              fontFamily:
                '"Fira Code", "Source Code Pro", Menlo, Monaco, Consolas, "Courier New", monospace',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
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
      <button
        onClick={handleCopy}
        className={css`
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(110, 118, 129, 0.4);
          border: none;
          color: #c9d1d9;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica,
            Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
          font-size: 12px;
          &:hover {
            background: rgba(110, 118, 129, 0.6);
          }
        `}
      >
        {isCopied ? <Icon icon="check" /> : <Icon icon="copy" />}
        <span style={{ marginLeft: '5px' }}>
          {isCopied ? 'Copied!' : 'Copy'}
        </span>
      </button>
    </div>
  );
}

export default React.memo(CodeBlock);
