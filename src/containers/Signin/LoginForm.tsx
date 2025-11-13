import React, { useState } from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Input from '~/components/Texts/Input';
import Banner from '~/components/Banner';
import { mobileMaxWidth } from '~/constants/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';
const enterYourUsernameLabel = 'Enter your username';
const enterYourPasswordLabel = 'Enter your password';
const iDontHaveAnAccountLabel = `I don't have an account`;
const iForgotMyPasswordLabel = 'I forgot my password';
const logMeInLabel = 'Log me in!';
const yourUsernameAndPasswordLabel = `What's your username and password?`;

export default function LoginForm({
  username,
  onSetUsername,
  onShowForgotPasswordForm,
  onShowSignupForm
}: {
  username: string;
  onSetUsername: (username: string) => void;
  onShowForgotPasswordForm: () => any;
  onShowSignupForm: () => void;
}) {
  const onLogin = useAppContext((v) => v.user.actions.onLogin);
  const login = useAppContext((v) => v.requestHelpers.login);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [loggingIn, setLoggingIn] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <ErrorBoundary componentPath="Signin/LoginForm">
      <header>{yourUsernameAndPasswordLabel}</header>
      {errorMessage && (
        <Banner>
          {typeof errorMessage === 'string'
            ? errorMessage
            : 'Server connection failed. Make sure your internet is connected'}
        </Banner>
      )}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '25vh'
        }}
      >
        <div style={{ width: '100%' }}>
          <div>
            <Input
              name="username"
              value={username}
              onChange={(text) => {
                setErrorMessage('');
                onSetUsername(text);
              }}
              placeholder={enterYourUsernameLabel}
              onKeyPress={(event: any) => {
                if (
                  !stringIsEmpty(username) &&
                  !stringIsEmpty(password) &&
                  event.key === 'Enter'
                ) {
                  onSubmit();
                }
              }}
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Input
              name="password"
              value={password}
              onChange={(text) => {
                setErrorMessage('');
                setPassword(text);
              }}
              placeholder={enterYourPasswordLabel}
              type="password"
              onKeyPress={(event: any) => {
                if (
                  !stringIsEmpty(username) &&
                  !stringIsEmpty(password) &&
                  event.key === 'Enter'
                ) {
                  onSubmit();
                }
              }}
            />
          </div>
        </div>
      </main>
      <footer>
        <Button
          className={css`
            margin-right: 1.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              max-width: 30%;
              margin-right: 0;
            }
          `}
          color="blue"
          variant="ghost"
          onClick={onShowForgotPasswordForm}
        >
          {iForgotMyPasswordLabel}
        </Button>
        <Button
          className={css`
            margin-right: 1.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              margin-right: 1rem;
              max-width: 30%;
            }
          `}
          color="orange"
          variant="ghost"
          onClick={onShowSignupForm}
        >
          {iDontHaveAnAccountLabel}
        </Button>
        <Button
          color="blue"
          style={{ fontSize: '2rem' }}
          loading={loggingIn}
          disabled={stringIsEmpty(username) || stringIsEmpty(password)}
          onClick={onSubmit}
        >
          {logMeInLabel}
        </Button>
      </footer>
    </ErrorBoundary>
  );

  async function onSubmit() {
    try {
      setLoggingIn(true);
      const data = await login({ username, password });
      onLogin(data);
      onSetUserState({ userId: data.id, newState: data });
    } catch (error: any) {
      setErrorMessage(error);
    } finally {
      setLoggingIn(false);
    }
  }
}
