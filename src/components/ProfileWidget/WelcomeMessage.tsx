import React from 'react';
import Button from '~/components/Button';
import localize from '~/constants/localize';

const logInLabel = localize('logIn2');
const tapHereLabel = localize('tapHere');
const toAccessAllFeaturesLabel = localize('toAccessAllFeatures');

export default function WelcomeMessage({
  userId,
  openSigninModal
}: {
  userId: number;
  openSigninModal: () => any;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}
    >
      {!userId ? (
        <div style={{ width: '100%' }}>
          <div className="login-message">{logInLabel}</div>
          <div className="login-message">{toAccessAllFeaturesLabel}</div>
        </div>
      ) : null}
      {!userId ? (
        <Button
          filled
          color="green"
          style={{ marginTop: '1rem' }}
          onClick={openSigninModal}
        >
          {tapHereLabel}!
        </Button>
      ) : null}
    </div>
  );
}
