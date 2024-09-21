import React, { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

interface CodeBlockProps {
  language: string;
  value: string;
}

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
      <Highlight theme={themes.dracula} code={value} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={className}
            style={{
              ...style,
              padding: '1em',
              overflowX: 'auto',
              backgroundColor: '#282a36',
              border: '1px solid #44475a',
              borderRadius: '6px'
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
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #f8f8f2;
          padding: 5px 10px;
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          &:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `}
      >
        {isCopied ? <Icon icon="check" /> : <Icon icon="copy" />}
        <span style={{ marginLeft: '5px' }}>
          {isCopied ? 'Copied' : 'Copy'}
        </span>
      </button>
    </div>
  );
}

export default React.memo(CodeBlock);
