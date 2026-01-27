import React, { Component } from 'react';
import { Color } from '~/constants/css';
import Button from '~/components/Button';

interface State {
  hasError: boolean;
  errorMessage: string;
}
export default class PreviewErrorBoundary extends Component<
  {
    children: React.ReactNode;
    className: string;
    innerRef?: React.RefObject<any> | ((instance: any) => void);
    onError: () => void;
    style?: React.CSSProperties;
  },
  State
> {
  private onError: (arg: any) => void;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
    this.onError = this.props.onError;
  }

  componentDidCatch(error: any) {
    const errorMessage = error.toString();
    this.setState({ hasError: true, errorMessage });
    this.onError(errorMessage);
  }

  render() {
    const { children, innerRef, ...props } = this.props;
    const { hasError, errorMessage } = this.state;

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
              maxWidth: '42rem',
              padding: '2.2rem 2.4rem',
              borderRadius: '16px',
              border: '1px solid var(--ui-border-strong)',
              background: '#fff',
              boxShadow: '0 20px 40px -28px rgba(15, 23, 42, 0.2)',
              color: Color.darkerGray(),
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: 700,
                marginBottom: '1rem'
              }}
            >
              Uh oh, something went wrong
            </div>
            <div style={{ fontSize: '1.4rem', lineHeight: 1.6 }}>
              Please check your code for mistakes and fix them.
            </div>
            <div
              style={{
                marginTop: '1.6rem',
                fontSize: '1.3rem',
                fontFamily: 'monospace',
                background: Color.highlightGray(),
                padding: '1rem',
                borderRadius: '8px',
                textAlign: 'left',
                wordBreak: 'break-word'
              }}
            >
              {errorMessage}
            </div>
          </div>
          <Button
            style={{
              marginTop: '2.2rem',
              borderRadius: '999px',
              padding: '1rem 2.4rem',
              border: `1px solid ${Color.logoBlue()}`,
              background: '#fff',
              color: Color.logoBlue()
            }}
            onClick={() => window.location.reload()}
          >
            Reload Preview
          </Button>
        </div>
      );
    }
    return Object.keys(props).length > 0 ? (
      <div ref={innerRef} {...props}>
        {children}
      </div>
    ) : (
      <>{children}</>
    );
  }
}
