import React, { Component } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import { Color, borderRadius } from '~/constants/css';
import Button from '~/components/Button';

interface State {
  hasError: boolean;
}
export default class PreviewErrorBoundary extends Component<
  {
    className: string;
    onError: () => void;
    children: any;
    innerRef?: any;
    style: any;
  },
  State
> {
  private onError: (arg: any) => void;
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
    this.onError = this.props.onError;
  }

  componentDidCatch(error: any) {
    this.setState({ hasError: true });
    this.onError(error.toString());
  }

  render() {
    const { children, innerRef, ...props } = this.props;
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
              padding: '2rem',
              border: `1px solid ${Color.borderGray()}`,
              borderRadius,
              background: Color.wellGray()
            }}
          >
            <div>Uh oh, something went wrong...</div>
            <div style={{ marginTop: '2rem' }}>
              Screenshot this <b style={{ color: Color.green() }}>whole page</b>
            </div>
            <div>
              and show it to{' '}
              <UsernameText
                color={Color.logoBlue()}
                user={{
                  username: 'Mikey',
                  id: 5
                }}
              />{' '}
              for a lot of <b style={{ color: Color.orange() }}>XP</b>!
            </div>
          </div>
          <Button
            filled
            color="logoBlue"
            style={{ marginTop: '2rem' }}
            onClick={() => window.location.reload()}
          >
            Click here after taking the screenshot
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
