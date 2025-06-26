import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';

export default function AccountConfirm({
  notExist,
  searching,
  matchingAccount,
  onNextClick,
  style
}: {
  notExist: boolean;
  searching: boolean;
  matchingAccount: any;
  onNextClick: () => void;
  style?: React.CSSProperties;
}) {
  if (searching) {
    return (
      <ErrorBoundary
        componentPath="Signin/RestoreAccount/UsernameSection/AccountConfirm"
        style={{ fontSize: '2rem', ...style }}
      >
        <Loading />
      </ErrorBoundary>
    );
  }

  if (notExist) {
    return (
      <ErrorBoundary
        componentPath="Signin/RestoreAccount/UsernameSection/AccountConfirm"
        style={{ fontSize: '2rem', ...style }}
      >
        <div style={{ padding: '1rem', fontWeight: 'bold' }}>
          That user account does not exist
        </div>
      </ErrorBoundary>
    );
  }

  if (matchingAccount) {
    return (
      <ErrorBoundary
        componentPath="Signin/RestoreAccount/UsernameSection/AccountConfirm"
        style={{ fontSize: '2rem', ...style }}
      >
        <div
          style={{
            padding: '1rem',
            fontWeight: 'bold',
            color: Color.darkerGray()
          }}
        >
          Hello {matchingAccount.username}! Press{' '}
          <span
            style={{ color: Color.blue(), cursor: 'pointer' }}
            onClick={onNextClick}
          >
            Next
          </span>{' '}
          to continue
        </div>
      </ErrorBoundary>
    );
  }

  return null;
}
