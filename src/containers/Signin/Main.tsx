import React from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
const iForgotMyPasswordLabel = 'I forgot my password';
const noIDontHaveAnAccountLabel = `No, I don't have an account`;
const welcomeLabel = 'Welcome to Twinkle. Do you have a Twinkle account?';
const yesIHaveAnAccountLabel = 'Yes, I have an account';

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
          variant="soft"
          tone="raised"
          style={{ display: 'block', fontSize: '2.7rem', padding: '1rem' }}
          onClick={onShowLoginForm}
        >
          {yesIHaveAnAccountLabel}
        </Button>
        <Button
          color="pink"
          variant="soft"
          tone="raised"
          style={{ marginTop: '1rem', fontSize: '2.5rem', padding: '1rem' }}
          onClick={onShowSignUpForm}
        >
          {noIDontHaveAnAccountLabel}
        </Button>
        <Button
          color="purple"
          variant="soft"
          tone="raised"
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
