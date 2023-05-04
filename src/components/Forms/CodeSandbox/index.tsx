import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Editor from './Editor';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { scrollElementToCenter } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { parse } from '@babel/parser';

CodeSandbox.propTypes = {
  code: PropTypes.string,
  initialCode: PropTypes.string.isRequired,
  hasError: PropTypes.bool.isRequired,
  onSetCode: PropTypes.func.isRequired,
  onSetErrorMsg: PropTypes.func.isRequired,
  onRunCode: PropTypes.func,
  passed: PropTypes.bool,
  prevUserId: PropTypes.number.isRequired,
  runButtonLabel: PropTypes.string,
  style: PropTypes.object
};
export default function CodeSandbox({
  code: globalCode,
  initialCode,
  hasError,
  onSetCode,
  onSetErrorMsg,
  onRunCode,
  passed,
  prevUserId,
  runButtonLabel = 'Run',
  style
}: {
  code?: string;
  initialCode: string;
  hasError: boolean;
  onSetCode: (code: string) => void;
  onSetErrorMsg: (errorMsg: string) => void;
  onRunCode?: (arg: any) => void;
  passed?: boolean;
  prevUserId: number;
  runButtonLabel?: string;
  style?: React.CSSProperties;
}) {
  const formatCode = useAppContext((v) => v.requestHelpers.formatCode);
  const { userId } = useKeyContext((v) => v.myState);
  const timerRef: React.MutableRefObject<any> = useRef(null);
  const ComponentRef = useRef(null);
  const [runButtonDisabled, setRunButtonDisabled] = useState(false);
  const [code, setCode] = useState(globalCode || initialCode);
  const [ast, setAst] = useState(null);

  useEffect(() => {
    if (userId !== prevUserId) {
      window.location.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevUserId, userId]);

  return (
    <ErrorBoundary
      componentPath="Forms/CodeSandbox/index"
      innerRef={ComponentRef}
      style={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        ...style
      }}
    >
      <Editor
        value={globalCode || initialCode}
        valueOnTextEditor={code}
        onChange={handleSetCode}
        onSetAst={setAst}
        ast={ast}
        onParse={handleParse}
        onSetErrorMsg={onSetErrorMsg}
      />
      <div
        style={{
          marginTop: '5rem',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex' }}>
          <Button
            style={{ fontSize: '1.3rem' }}
            filled
            color="logoBlue"
            onClick={handleFormatCode}
          >
            <Icon icon="indent" />
            <span style={{ marginLeft: '0.7rem' }}>Format</span>
          </Button>
          <Button
            style={{ marginLeft: '1rem', fontSize: '1.3rem' }}
            filled
            color="orange"
            onClick={handleReset}
          >
            <Icon icon="undo" />
            <span style={{ marginLeft: '0.7rem' }}>Reset</span>
          </Button>
        </div>
        <div>
          {onRunCode && !passed && (
            <Button
              disabled={runButtonDisabled || hasError}
              filled
              color={hasError ? 'cranberry' : 'green'}
              onClick={handleRunCode}
            >
              {!hasError && <Icon icon="play" />}
              <span style={{ marginLeft: hasError ? 0 : '0.7rem' }}>
                {runButtonLabel}
              </span>
            </Button>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );

  async function handleFormatCode() {
    try {
      onSetErrorMsg?.('');
      const formattedCode = await formatCode(code);
      onSetCode(formattedCode);
      setCode(formattedCode);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleReset() {
    onSetErrorMsg?.('');
    setCode(initialCode);
    onSetCode(initialCode);
    scrollElementToCenter(ComponentRef.current, -250);
  }

  function handleParse(code: string) {
    return parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
  }

  function handleRunCode() {
    onRunCode?.({ ast, code });
  }

  function handleSetCode(text: string) {
    clearTimeout(timerRef.current);
    onSetErrorMsg?.('');
    setCode(text);
    setRunButtonDisabled(true);
    timerRef.current = setTimeout(() => {
      onSetErrorMsg?.('');
      onSetCode(text);
      setRunButtonDisabled(false);
    }, 500);
  }
}
