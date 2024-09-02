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
  }, [fetchSampleCode, onCodeChange]);

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
            overflow: visible;
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
                lineHeight: 1.4,
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 1,
                boxSizing: 'border-box',
                whiteSpace: 'pre',
                overflow: 'visible'
              }}
            >
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i });
                delete lineProps.key;
                return (
                  <div key={i} {...lineProps}>
                    {line.map((token, key) => {
                      const tokenProps = getTokenProps({ token, key });
                      delete tokenProps.key;
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
  );
};

export default CodeEditor;
