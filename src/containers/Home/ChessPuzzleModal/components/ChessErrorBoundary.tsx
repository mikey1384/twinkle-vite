import React, { Component, ReactNode } from 'react';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ChessErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chess puzzle error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={css`
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 400px;
            gap: 1rem;
            padding: 2rem;
            text-align: center;
          `}
        >
          <div
            className={css`
              font-size: 3rem;
              margin-bottom: 1rem;
            `}
          >
            ⚠️
          </div>
          <div
            className={css`
              font-size: 1.25rem;
              font-weight: 600;
              color: ${Color.darkerGray()};
              margin-bottom: 0.5rem;
            `}
          >
            Something went wrong with the chess puzzle
          </div>
          <div
            className={css`
              font-size: 1rem;
              color: ${Color.darkGray()};
              margin-bottom: 1.5rem;
              max-width: 400px;
            `}
          >
            {this.state.error?.message ||
              'An unexpected error occurred. Please try again.'}
          </div>
          <div
            className={css`
              display: flex;
              gap: 1rem;
            `}
          >
            <Button onClick={this.handleRetry} color="logoBlue">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} transparent>
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
