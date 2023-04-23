import React, { useMemo } from 'react';
import Highlight, { Prism } from 'prism-react-renderer';
import { Color } from '~/constants/css';
import dracula from 'prism-react-renderer/themes/dracula';
import github from 'prism-react-renderer/themes/github';
import okaidia from 'prism-react-renderer/themes/okaidia';
import vsDark from 'prism-react-renderer/themes/vsDark';

const availableThemes: {
  [key: string]: any;
} = {
  dracula,
  github,
  okaidia,
  vsDark
};

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
  style: React.CSSProperties;
  theme: any;
  codeRef: React.RefObject<any>;
}) {
  const selectedTheme = useMemo(
    () => availableThemes?.[theme] || okaidia,
    [theme]
  );

  return (
    <Highlight
      Prism={Prism}
      theme={selectedTheme}
      code={children}
      language={language}
    >
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
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line, key: i })}>
                {line.map((token, key) => {
                  const tokenProps = getTokenProps({ token, key });
                  return <span key={key} {...tokenProps} />;
                })}
              </div>
            ))}
          </pre>
        );
      }}
    </Highlight>
  );
}
