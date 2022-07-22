import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Highlight, { Prism } from 'prism-react-renderer';
import { Color } from '~/constants/css';
import dracula from 'prism-react-renderer/themes/dracula';
import github from 'prism-react-renderer/themes/github';
import okaidia from 'prism-react-renderer/themes/okaidia';
import vsDark from 'prism-react-renderer/themes/vsDark';

Code.propTypes = {
  children: PropTypes.string,
  className: PropTypes.string,
  language: PropTypes.string,
  style: PropTypes.object,
  theme: PropTypes.string,
  codeRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func])
};

const availableThemes = {
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
        transformToken,
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
                  if (transformToken) {
                    return transformToken(tokenProps);
                  }
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
