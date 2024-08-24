import React from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import localize from '~/constants/localize';

const iForgotMyPasswordLabel = localize('iForgotMyPassword');
const noIDontHaveAnAccountLabel = localize('noIDontHaveAnAccount');
const welcomeLabel = localize('welcomeToTwinkle');
const yesIHaveAnAccountLabel = localize('yesIHaveAnAccount');

export default function Main({
  onShowForgotPasswordForm,
  onShowLoginForm,
  onShowSignUpForm
}: {
  onShowForgotPasswordForm: () => void;
  onShowLoginForm: () => void;
  onShowSignUpForm: () => void;
}) {
  return (
    <ErrorBoundary componentPath="Signin/Main">
      <header>{welcomeLabel}</header>
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: '2rem',
          minHeight: '25vh'
        }}
      >
        <Button
          color="logoBlue"
          style={{ display: 'block', fontSize: '2.7rem', padding: '1rem' }}
          onClick={onShowLoginForm}
        >
          {yesIHaveAnAccountLabel}
        </Button>
        <Button
          color="pink"
          style={{ marginTop: '1rem', fontSize: '2.5rem', padding: '1rem' }}
          onClick={onShowSignUpForm}
        >
          {noIDontHaveAnAccountLabel}
        </Button>
        <Button
          color="purple"
          style={{
            marginTop: '1.5rem',
            fontSize: '2rem',
            padding: '1rem'
          }}
          onClick={onShowForgotPasswordForm}
        >
          {iForgotMyPasswordLabel}
        </Button>
      </main>
    </ErrorBoundary>
  );
}
