import React, { useState, useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import { Highlight, themes } from 'prism-react-renderer';
import { useAppContext } from '~/contexts';

interface CodeEditorProps {
  onCodeChange: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ onCodeChange }) => {
  const [code, setCode] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fetchSampleCode = useAppContext(
    (v) => v.requestHelpers.fetchSampleCode
  );

  useEffect(() => {
    async function loadSampleCode() {
      try {
        const sampleCode = await fetchSampleCode();
        setCode(sampleCode);
        onCodeChange(sampleCode);
      } catch (error) {
        console.error('Error fetching sample code:', error);
        setCode('// Error loading sample code');
        onCodeChange('// Error loading sample code');
      }
    }

    loadSampleCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCodeChange]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
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
        flex: 1;
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
          left: 0;
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
              overflow: hidden;
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
      </div>
    </div>
  );
};

export default CodeEditor;
