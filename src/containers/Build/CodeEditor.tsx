import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Highlight, themes } from 'prism-react-renderer';
import { mobileMaxWidth } from '~/constants/css';

const CodeEditor: React.FC = () => {
  const [code, setCode] = useState(
    '// Welcome to the Code Editor\n\nfunction helloWorld() {\n  console.log("Hello, World!");\n}\n\nhelloWorld();'
  );

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

  return (
    <div
      className={css`
        position: absolute;
        top: 15rem; // Increased top padding
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        background-color: #1e1e1e;
        color: #d4d4d4;
        overflow: hidden;

        @media (max-width: ${mobileMaxWidth}) {
          top: 0;
          bottom: 7rem;
        }
      `}
    >
      <textarea
        value={code}
        onChange={handleCodeChange}
        className={css`
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: transparent;
          color: transparent;
          caret-color: white;
          border: none;
          resize: none;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.4; // Adjusted line height
          outline: none;
          padding: 1rem;
          margin: 0;
          box-sizing: border-box;
          white-space: pre;
          overflow-wrap: normal;
          overflow-x: auto;
          z-index: 2;
        `}
        spellCheck={false}
      />
      <Highlight theme={themes.vsDark} code={code} language="javascript">
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={className}
            style={{
              ...style,
              margin: 0,
              padding: '1rem',
              background: 'transparent',
              fontSize: '14px',
              lineHeight: 1.4, // Adjusted line height
              height: '100%',
              width: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              zIndex: 1,
              overflow: 'hidden',
              boxSizing: 'border-box',
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              overflowX: 'auto'
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
};

export default CodeEditor;
