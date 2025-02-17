import React, { useMemo } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Color } from '~/constants/css';

export default function Code({
  children,
  className,
  language = 'jsx',
  style,
  theme,
  codeRef
}: {
  children: any;
  className: string;
  language: any;
  style?: React.CSSProperties;
  theme?: any;
  codeRef: React.RefObject<any>;
}) {
  const selectedTheme = useMemo(
    () => (themes as { [key: string]: any })?.[theme] || themes.okaidia,
    [theme]
  );

  return (
    <Highlight theme={selectedTheme} code={children} language={language}>
      {({
        className: defaultClassName,
        style: defaultStyle,
        tokens,
        getLineProps,
        getTokenProps
      }) => {
        return (
          <pre
            className={`${defaultClassName} ${className}`}
            style={{
              ...defaultStyle,
              marginTop: 0,
              border: `1px solid ${Color.borderGray()}`,
              ...style
            }}
            ref={codeRef}
          >
            {tokens.map((line, i) => {
              const tokenProps = getLineProps({ line, key: i });
              delete tokenProps.key;
              return (
                <div key={i} {...tokenProps}>
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token, key });
                    delete tokenProps.key;
                    return <span key={key} {...tokenProps} />;
                  })}
                </div>
              );
            })}
          </pre>
        );
      }}
    </Highlight>
  );
}
