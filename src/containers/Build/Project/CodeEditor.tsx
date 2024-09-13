import React, { useRef } from 'react';
import { css } from '@emotion/css';
import { Highlight, themes } from 'prism-react-renderer';

export default function CodeEditor({
  code,
  onCodeChange
}: {
  code: string;
  onCodeChange: (code: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    onCodeChange(newCode);
  };

  const handleScroll = () => {
    if (textareaRef.current && editorRef.current) {
      editorRef.current.scrollTop = textareaRef.current.scrollTop;
      editorRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div
      className={css`
        position: relative;
        height: 100%;
        overflow: hidden;
        background-color: #1e1e1e;
        color: #d4d4d4;
      `}
    >
      <div
        ref={editorRef}
        className={css`
          position: absolute;
          top: 0;
          left: 3rem;
          right: 0;
          bottom: 0;
          overflow: auto;
        `}
      >
        <div
          className={css`
            position: relative;
            min-height: 100%;
            padding: 1rem;
          `}
        >
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            onScroll={handleScroll}
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
              line-height: 1.4;
              outline: none;
              padding: 1rem;
              margin: 0;
              box-sizing: border-box;
              white-space: pre;
              overflow: auto;
              z-index: 2;
            `}
            spellCheck={false}
          />
          <Highlight theme={themes.vsDark} code={code} language="typescript">
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={className}
                style={{
                  ...style,
                  margin: 0,
                  padding: 0,
                  background: 'transparent',
                  fontSize: '14px',
                  lineHeight: 1.4,
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  pointerEvents: 'none',
                  zIndex: 1,
                  boxSizing: 'border-box',
                  whiteSpace: 'pre',
                  overflow: 'visible'
                }}
              >
                {tokens.map((line, i) => {
                  const { key: _, ...lineProps } = getLineProps({
                    line,
                    key: i
                  });
                  return (
                    <div key={i} {...lineProps}>
                      {line.map((token, key) => {
                        const { key: _, ...tokenProps } = getTokenProps({
                          token,
                          key
                        });
                        return <span key={key} {...tokenProps} />;
                      })}
                    </div>
                  );
                })}
              </pre>
            )}
          </Highlight>
        </div>
      </div>
    </div>
  );
}
