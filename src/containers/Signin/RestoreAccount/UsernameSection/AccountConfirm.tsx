import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';

export default function AccountConfirm({
  notExist,
  searching,
  matchingAccount,
  onNextClick,
  style,
  isBanned
}: {
  notExist: boolean;
  searching: boolean;
  matchingAccount: any;
  onNextClick: () => void;
  style?: React.CSSProperties;
  isBanned: boolean;
}) {
  let content = null;

  if (isBanned) {
    content = (
      <div style={{ padding: '2rem', fontWeight: 'bold' }}>
        That user is banned
      </div>
    );
  } else if (searching) {
    content = <Loading />;
  } else if (notExist) {
    content = (
      <div style={{ padding: '1rem', fontWeight: 'bold' }}>
        That user account does not exist
      </div>
    );
  } else if (matchingAccount) {
    content = (
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
    );
  }

  return (
    <ErrorBoundary
      componentPath="Signin/RestoreAccount/UsernameSection/AccountConfirm"
      style={{ fontSize: '2rem', ...style }}
    >
      {content}
    </ErrorBoundary>
  );
}
