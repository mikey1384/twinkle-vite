import React, { useState } from 'react';
import Button from '~/components/Button';
import Banner from '~/components/Banner';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
const createDevAccountLabel = 'Create dev account';
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
  const onSignup = useAppContext((v) => v.user.actions.onSignup);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const createDevAccount = useAppContext(
    (v) => v.requestHelpers.createDevAccount
  );
  const [creatingDevAccount, setCreatingDevAccount] = useState(false);
  const [devAccountError, setDevAccountError] = useState('');

  return (
    <ErrorBoundary componentPath="Signin/Main">
      <header>{welcomeLabel}</header>
      {devAccountError ? <Banner>{devAccountError}</Banner> : null}
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
        {import.meta.env.DEV ? (
          <Button
            color="green"
            variant="soft"
            tone="raised"
            loading={creatingDevAccount}
            style={{ marginTop: '1rem', fontSize: '2rem', padding: '1rem' }}
            onClick={handleCreateDevAccount}
          >
            <Icon icon="user-plus" />
            <span style={{ marginLeft: '0.7rem' }}>
              {createDevAccountLabel}
            </span>
          </Button>
        ) : null}
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

  async function handleCreateDevAccount() {
    try {
      setCreatingDevAccount(true);
      setDevAccountError('');
      const data = await createDevAccount();
      onSignup(data);
      onSetUserState({ userId: data.id, newState: data });
    } catch (error: any) {
      setDevAccountError(
        typeof error === 'string'
          ? error
          : error?.message || 'Failed to create dev account'
      );
    } finally {
      setCreatingDevAccount(false);
    }
  }
}
