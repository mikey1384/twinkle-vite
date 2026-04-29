import React, { Component } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import { clientVersion } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import URL from '~/constants/URL';
import request from 'axios';
import { getStoredItem } from '~/helpers/userDataHelpers';
import { Color } from '~/constants/css';

if (import.meta.env.SSR) {
  import('source-map-support').then(({ install }) => install()).catch(() => {});
}

const token = () => getStoredItem('token');

interface State {
  hasError: boolean;
  recoveryKey: number;
  recoverableErrorCount: number;
}
export default class ErrorBoundary extends Component<
  {
    autoRecoverDomMutationError?: boolean;
    children?: React.ReactNode;
    className?: string;
    innerRef?: React.RefObject<any> | ((instance: any) => void);
    onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
    userId?: number;
    username?: string;
    componentPath: string;
    style?: React.CSSProperties;
  },
  State
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      recoveryKey: 0,
      recoverableErrorCount: 0
    };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const shouldAutoRecover =
      this.props.autoRecoverDomMutationError &&
      isRecoverableDomMutationError(error) &&
      this.state.recoverableErrorCount < 1;

    reportError({
      componentPath: this.props.componentPath,
      message: error.stack || error.message || String(error),
      info: buildErrorInfo(errorInfo)
    });

    if (shouldAutoRecover) {
      this.setState((state) => ({
        hasError: false,
        recoveryKey: state.recoveryKey + 1,
        recoverableErrorCount: state.recoverableErrorCount + 1
      }));
      return;
    }

    this.setState({ hasError: true });
  }

  render() {
    const { children, innerRef, componentPath, ...props } = this.props;
    delete (props as any).autoRecoverDomMutationError;
    const { hasError, recoveryKey } = this.state;
    if (hasError) {
      return (
        <div
          style={{
            width: '100%',
            minHeight: '30%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '3rem 1.5rem',
            ...props.style
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '44rem',
              padding: '2.4rem 2.8rem',
              borderRadius: '16px',
              border: '1px solid var(--ui-border-strong)',
              background: '#fff',
              boxShadow: '0 20px 40px -28px rgba(15, 23, 42, 0.2)',
              color: Color.darkerGray(),
              textAlign: 'center'
            }}
          >
            <p
              style={{
                fontSize: '1.9rem',
                fontWeight: 700,
                marginBottom: '1rem'
              }}
            >
              Uh oh, something went wrong
            </p>
            <div style={{ fontSize: '1.5rem', lineHeight: 1.6 }}>
              Screenshot this page and show it to{' '}
              <UsernameText
                color={Color.logoBlue()}
                user={{
                  username: 'Mikey',
                  id: 5
                }}
              />{' '}
              for a big <b style={{ color: Color.gold() }}>XP</b> bonus!
            </div>
            <div style={{ marginTop: '1.8rem', fontSize: '1.35rem' }}>
              Tap the button below once you’ve captured the screenshot.
            </div>
          </div>
          {componentPath ? (
            <div style={{ marginTop: '0.5rem', fontSize: '1.3rem' }}>
              {componentPath}
            </div>
          ) : null}
          <button
            className={css`
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 1rem 2.4rem;
              border-radius: 999px;
              border: 1px solid ${Color.logoBlue()};
              font-size: 1.45rem;
              font-weight: 600;
              margin-top: 2.4rem;
              background: #fff;
              color: ${Color.logoBlue()};
              cursor: pointer;
              transition:
                transform 0.2s ease,
                box-shadow 0.2s ease;

              @media (hover: hover) and (pointer: fine) {
                &:hover {
                  transform: translateY(-1px);
                  box-shadow: 0 14px 28px -22px rgba(15, 23, 42, 0.25);
                }
              }
              -webkit-tap-highlight-color: transparent;
              touch-action: manipulation;
            `}
            onClick={() => window.location.reload()}
          >
            Reload the page
          </button>
        </div>
      );
    }
    return Object.keys(props).length > 0 ? (
      <div key={recoveryKey} ref={innerRef} style={props.style} {...props}>
        {children}
      </div>
    ) : (
      <React.Fragment key={recoveryKey}>{children}</React.Fragment>
    );
  }
}

function isRecoverableDomMutationError(error: Error) {
  const message = String(error?.message || '');
  return (
    message.includes(`Failed to execute 'removeChild' on 'Node'`) ||
    message.includes(`Failed to execute 'insertBefore' on 'Node'`) ||
    message.includes('The node to be removed is not a child of this node') ||
    message.includes(
      'The node before which the new node is to be inserted is not a child of this node'
    )
  );
}

function buildErrorInfo(errorInfo: React.ErrorInfo) {
  const info = [
    getCurrentLocation(),
    getCurrentUserAgent(),
    errorInfo.componentStack
      ? `Component stack:\n${errorInfo.componentStack}`
      : ''
  ].filter(Boolean);

  return info.join('\n\n');
}

function getCurrentLocation() {
  if (typeof window === 'undefined') {
    return '';
  }
  return `URL: ${window.location.href}`;
}

function getCurrentUserAgent() {
  if (typeof navigator === 'undefined') {
    return '';
  }
  return `User agent: ${navigator.userAgent}`;
}

async function reportError({
  componentPath,
  info,
  message
}: {
  componentPath: string;
  info?: string;
  message: string;
}) {
  try {
    const {
      data: { success }
    } = await request.post(
      `${URL}/user/error`,
      { componentPath, info, message, clientVersion },
      {
        headers: {
          authorization: token()
        }
      }
    );
    return Promise.resolve(success);
  } catch (error) {
    return console.error(error);
  }
}
