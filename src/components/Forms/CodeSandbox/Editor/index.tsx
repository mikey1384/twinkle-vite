import React, { useMemo, createElement, useEffect, useState } from 'react';
import SimpleEditor from 'react-simple-code-editor';
import Preview from './Preview';
import { Highlight, themes } from 'prism-react-renderer';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';

export default function Editor({
  ast,
  value = '',
  valueOnTextEditor,
  onChange,
  onSetAst,
  onParse,
  onSetErrorMsg,
  style
}: {
  ast: any;
  value: string;
  valueOnTextEditor: string;
  onChange: (v: string) => void;
  onSetAst: (v: any) => void;
  onParse: (v: string) => any;
  onSetErrorMsg: (v: string) => void;
  style?: React.CSSProperties;
}) {
  const lintCode = useAppContext((v) => v.requestHelpers.lintCode);
  const processAst = useAppContext((v) => v.requestHelpers.processAst);
  const [error, setError] = useState('');
  const [errorLineNumber, setErrorLineNumber] = useState(0);
  const [elementObj, setElementObj] = useState(null);
  const [evaling, setEvaling] = useState(false);

  useEffect(() => {
    setError('');
    setErrorLineNumber(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueOnTextEditor]);

  useEffect(() => {
    setError('');
    setErrorLineNumber(0);
    handleTranspile(value);

    async function handleTranspile(code: string) {
      try {
        const results = await lintCode(code);
        if (results[0]) {
          return handleSetError({
            error: results[0].message.split('\n')[0],
            lineNumber: results[0].line
          });
        }
        const ast = onParse(code);
        onSetAst(ast);
      } catch (error: any) {
        const errorString = error.toString();
        handleSetError({
          error: errorString,
          lineNumber: getErrorLineNumber(errorString)
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    handleCompiledComponent();
    async function handleCompiledComponent() {
      if (ast) {
        setEvaling(true);
        const result = await handleEvalCode(
          handleTransformBeforeCompilation(ast)
        );
        setEvaling(false);
        setElementObj(result);
      }

      async function handleEvalCode(ast: string) {
        try {
          const resultCode = await processAst(ast);
          const cleansedCode = resultCode.replace(/export\s+default\s+/g, '');
          const wrappedCode = `
            try {
              return (${cleansedCode})(React);
            } catch (error) {
              throw new Error('Runtime Error: ' + error.message);
            }
          `;
          const res = new Function('React', wrappedCode);
          return Promise.resolve(res(React));
        } catch (error: any) {
          setError(error.toString());
          return null;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ast]);

  const CompiledComponent = useMemo(() => {
    const component = handleGenerateComponent(elementObj, (error: any) => {
      const errorString = error.toString();
      handleSetError({
        error: errorString,
        lineNumber: getErrorLineNumber(errorString)
      });
    });
    return createElement(component, null);

    function handleGenerateComponent(code: any, errorCallback: any) {
      return errorBoundary(code, errorCallback);
      function errorBoundary(Element: any, errorCallback: any) {
        class ErrorBoundary extends React.Component {
          state = { hasError: false };
          componentDidCatch(error: any) {
            return errorCallback(error);
          }
          render() {
            return typeof Element === 'function'
              ? createElement(Element, null)
              : Element;
          }
        }
        return ErrorBoundary;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementObj]);

  return (
    <div style={{ width: '100%', ...style }}>
      {elementObj ? (
        <Preview
          onError={(error: any) => handleSetError({ error, lineNumber: 0 })}
          evaling={evaling}
          style={{ marginBottom: '5rem' }}
        >
          {CompiledComponent}
        </Preview>
      ) : ast ? (
        <Loading />
      ) : null}
      <style
        dangerouslySetInnerHTML={{
          __html: `.npm__react-simple-code-editor__textarea { outline: none !important; }`
        }}
      />
      <SimpleEditor
        value={valueOnTextEditor}
        onValueChange={onChange}
        style={{
          fontSize: '1.3rem',
          color: '#fff',
          backgroundColor: 'rgb(39, 40, 34)',
          fontFamily: `Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace`,
          margin: 0
        }}
        highlight={(code) =>
          handleHighlightCode({
            code,
            theme: themes.okaidia
          })
        }
        padding={8}
      />
      {error && (
        <p
          style={{
            color: Color.rose(),
            marginTop: '0.5rem',
            fontSize: '1.5rem'
          }}
        >
          {error}
        </p>
      )}
      {elementObj ? (
        <Preview
          onError={(error: any) => handleSetError({ error, lineNumber: 0 })}
          evaling={evaling}
          style={{ marginTop: '5rem' }}
        >
          {CompiledComponent}
        </Preview>
      ) : ast ? (
        <Loading />
      ) : null}
      <style
        dangerouslySetInnerHTML={{
          __html: `.npm__react-simple-code-editor__textarea { outline: none !important; }`
        }}
      />
    </div>
  );

  function getErrorLineNumber(errorString: string) {
    const firstCut = errorString?.split('(')?.[1];
    const secondCut = firstCut?.split(':')?.[0];
    const errorLineNumber = Number(secondCut);
    return isNaN(errorLineNumber) || !errorLineNumber ? 0 : errorLineNumber;
  }

  function handleHighlightCode({ code, theme }: { code: string; theme: any }) {
    return (
      <Highlight code={code} theme={theme} language="jsx">
        {({ tokens, getLineProps, getTokenProps }) => (
          <>
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line, key: i });
              const lineStyle = lineProps.style || {};
              delete lineProps.key;
              return (
                <div
                  key={i}
                  {...{
                    ...lineProps,
                    style: {
                      ...lineStyle,
                      backgroundColor:
                        errorLineNumber === i + 1
                          ? Color.red(0.3)
                          : ((lineStyle?.backgroundColor || '') as string)
                    }
                  }}
                >
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token, key });
                    delete tokenProps.key;
                    return <span key={key} {...tokenProps} />;
                  })}
                </div>
              );
            })}
          </>
        )}
      </Highlight>
    );
  }

  function handleSetError({
    error,
    lineNumber
  }: {
    error: string;
    lineNumber: number;
  }) {
    setError(error);
    setErrorLineNumber(lineNumber);
    if (error) {
      onSetErrorMsg?.(`There's a bug in your code. Please fix it first`);
    }
  }

  function handleTransformBeforeCompilation(ast: any) {
    try {
      traverse(ast, {
        VariableDeclaration(path: any) {
          if (path.parent.type === 'Program') {
            path.replaceWith(path.node.declarations[0].init);
          }
        },
        ImportDeclaration(path: { remove: any }) {
          path.remove();
        },
        ExportDefaultDeclaration(path: any) {
          if (
            path.node.declaration.type === 'ArrowFunctionExpression' ||
            path.node.declaration.type === 'FunctionDeclaration'
          ) {
            path.replaceWith(path.node.declaration);
          } else {
            path.remove();
          }
        }
      });
    } catch (error: any) {
      setError(error);
    }
    return ast;
  }

  function traverse(ast: any, visitor: any) {
    function visit(node: any, parentNode: any) {
      if (!node) return;
      const visitorFunc = visitor[node.type];
      if (visitorFunc) {
        visitorFunc({ node, parent: parentNode });
      }

      if (node.type === 'Program' || node.type === 'BlockStatement') {
        node.body.forEach((childNode: any) => visit(childNode, node));
      }
    }

    visit(ast, null);
  }
}
