import { Component } from 'react';
import PropTypes from 'prop-types';
import StackTrace from 'stacktrace-js';
import UsernameText from '~/components/Texts/UsernameText';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import { clientVersion } from '~/constants/defaultValues';
import { SourceMapConsumer } from 'source-map';
import URL from '~/constants/URL';

const token = () =>
  typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

const auth = () => ({
  headers: {
    authorization: token()
  }
});

export default class ErrorBoundary extends Component {
  static propTypes = {
    children: PropTypes.node,
    innerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    userId: PropTypes.number,
    username: PropTypes.string,
    componentPath: PropTypes.string.isRequired
  };

  state = { hasError: false };

  async componentDidCatch(error, info) {
    this.setState({ hasError: true });
    const errorStack = await StackTrace.fromError(error);
    const mappedErrorStack = await mapStackTrace(errorStack);
    await StackTrace.report(mappedErrorStack, `${URL}/user/error`, {
      clientVersion,
      message: error.message,
      componentPath: this.props.componentPath,
      info: info?.componentStack,
      token: auth()?.headers?.authorization
    });
    console.log(error);
  }

  render() {
    const { children, innerRef, componentPath, ...props } = this.props;
    const { hasError } = this.state;
    if (hasError) {
      return (
        <div
          style={{
            color: Color.darkerGray(),
            fontWeight: 'bold',
            width: '100%',
            height: '30%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            ...props.style
          }}
        >
          <div
            style={{
              fontSize: '1.7rem',
              padding: '2rem',
              border: `1px solid ${Color.borderGray()}`,
              borderRadius,
              background: Color.wellGray()
            }}
          >
            <p>Uh oh, something went wrong...</p>
            <p style={{ marginTop: '2rem' }}>
              Screenshot this <b style={{ color: Color.green() }}>whole page</b>
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              and show it to{' '}
              <UsernameText
                color={Color.logoBlue()}
                user={{
                  username: 'Mikey',
                  id: 5
                }}
              />{' '}
              for a lot of <b style={{ color: Color.orange() }}>XP</b>!
            </p>
          </div>
          {componentPath ? (
            <div style={{ marginTop: '0.5rem', fontSize: '1.3rem' }}>
              {componentPath}
            </div>
          ) : null}
          <div
            className={css`
              &:hover {
                text-decoration: underline;
              }
            `}
            style={{
              cursor: 'pointer',
              color: Color.logoBlue(),
              fontSize: '1.5rem',
              marginTop: '3rem'
            }}
            onClick={() => window.location.reload()}
          >
            Did you take the screenshot? Then tap here to reload the website
          </div>
        </div>
      );
    }
    return Object.keys(props).length > 0 ? (
      <div ref={innerRef} style={props.style} {...props}>
        {children}
      </div>
    ) : (
      <>{children}</>
    );
  }
}

async function mapStackTrace(stackTrace) {
  const mappedStackTrace = [];
  for (const callSite of stackTrace) {
    const { file } = callSite;
    // Only map the stack trace if the source map exists
    if (file && file.endsWith('.map')) {
      const sourceMap = await new SourceMapConsumer(file);
      const originalPosition = sourceMap.originalPositionFor(callSite);
      mappedStackTrace.push({
        ...callSite,
        file: originalPosition.source,
        lineNumber: originalPosition.line,
        columnNumber: originalPosition.column
      });
    } else {
      mappedStackTrace.push(callSite);
    }
  }
  return mappedStackTrace;
}
