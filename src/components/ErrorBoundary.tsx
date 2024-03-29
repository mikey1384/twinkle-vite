import React, { Component } from 'react';
import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import { clientVersion } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import URL from '~/constants/URL';
import request from 'axios';
import { getStoredItem } from '~/helpers/userDataHelpers';
import { Color, borderRadius } from '~/constants/css';
import { install } from 'source-map-support';

install();

const token = () => getStoredItem('token');

interface State {
  hasError: boolean;
}
export default class ErrorBoundary extends Component<
  {
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
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    innerRef: PropTypes.any,
    userId: PropTypes.number,
    username: PropTypes.string,
    componentPath: PropTypes.string.isRequired,
    style: PropTypes.object
  };

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  async componentDidCatch(error: Error) {
    this.setState({ hasError: true });
    reportError({
      componentPath: this.props.componentPath,
      message: error.stack || '',
      info: ''
    });
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

async function reportError({
  componentPath,
  info,
  message
}: {
  componentPath: string;
  info: string;
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
