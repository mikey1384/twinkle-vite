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

  // Determine which state we're in for keyed rendering
  // Using a key forces React to remount instead of patch, avoiding DOM mismatch
  // errors caused by browser translation extensions modifying text nodes
  let stateKey = 'empty';
  if (isBanned) {
    stateKey = 'banned';
    content = (
      <div style={{ padding: '2rem', fontWeight: 'bold' }} translate="no">
        That user is banned
      </div>
    );
  } else if (searching) {
    stateKey = 'searching';
    content = <Loading />;
  } else if (notExist) {
    stateKey = 'notExist';
    content = (
      <div style={{ padding: '1rem', fontWeight: 'bold' }} translate="no">
        That user account does not exist
      </div>
    );
  } else if (matchingAccount) {
    stateKey = `found-${matchingAccount.id}`;
    content = (
      <div
        style={{
          padding: '1rem',
          fontWeight: 'bold',
          color: Color.darkerGray()
        }}
        translate="no"
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
      <div key={stateKey}>{content}</div>
    </ErrorBoundary>
  );
}
