import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import MainForm from './MainForm';
import StudentOrTeacher from './StudentOrTeacher';
import SecretPassPhrase from './SecretPassPhrase';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const iAlreadyHaveAnAccountLabel = localize('iAlreadyHaveAnAccount');
const letsSetUpYourAccountLabel = localize('letsSetUpYourAccount');

export default function SignUpForm({
  firstname,
  lastname,
  username,
  password,
  email,
  isPassphraseValid,
  isUsernameAvailable,
  hasNameError,
  hasEmailError,
  reenteredPassword,
  onSetFirstname,
  onSetLastname,
  onSetEmail,
  onSetIsPassphraseValid,
  onSetIsUsernameAvailable,
  onSetHasNameError,
  onSetHasEmailError,
  onSetPassword,
  onSetReenteredPassword,
  onSetUsername,
  onShowLoginForm
}: {
  firstname: string;
  lastname: string;
  username: string;
  password: string;
  email: string;
  isPassphraseValid: boolean;
  isUsernameAvailable: boolean;
  hasNameError: boolean;
  hasEmailError: boolean;
  reenteredPassword: string;
  onSetFirstname: (firstname: string) => void;
  onSetLastname: (lastname: string) => void;
  onSetEmail: (email: string) => void;
  onSetIsPassphraseValid: (isValid: boolean) => void;
  onSetIsUsernameAvailable: (isAvailable: boolean) => void;
  onSetHasNameError: (hasError: boolean) => void;
  onSetHasEmailError: (hasError: boolean) => void;
  onSetPassword: (password: string) => void;
  onSetReenteredPassword: (password: string) => void;
  onSetUsername: (username: string) => void;
  onShowLoginForm: () => void;
}) {
  const [userType, setUsertype] = useState('');
  const [passphrase, setPassphrase] = useState('');

  return (
    <ErrorBoundary componentPath="Signin/SignupForm">
      <header>{letsSetUpYourAccountLabel}</header>
      <main>
        <div
          className={css`
            width: 100%;
            padding: 2.5rem 1.5rem 1.5rem 1.5rem;
            section:first-of-type {
              margin-top: 0;
            }
            input {
              margin-top: 0.5rem;
            }
            label {
              font-weight: bold;
            }
          `}
        >
          {userType ? (
            <MainForm
              firstname={firstname}
              lastname={lastname}
              username={username}
              password={password}
              passphrase={passphrase}
              email={email}
              reenteredPassword={reenteredPassword}
              isUsernameAvailable={isUsernameAvailable}
              hasEmailError={hasEmailError}
              hasNameError={hasNameError}
              onSetFirstname={onSetFirstname}
              onSetLastname={onSetLastname}
              onSetEmail={onSetEmail}
              onSetPassword={onSetPassword}
              onSetReenteredPassword={onSetReenteredPassword}
              onSetHasNameError={onSetHasNameError}
              onSetHasEmailError={onSetHasEmailError}
              onSetIsUsernameAvailable={onSetIsUsernameAvailable}
              onSetUsername={onSetUsername}
              onBackToSelection={() => setUsertype('')}
              userType={userType}
            />
          ) : isPassphraseValid ? (
            <StudentOrTeacher onSelect={setUsertype} />
          ) : (
            <SecretPassPhrase
              onSetPassphrase={setPassphrase}
              onSetIsPassphraseValid={onSetIsPassphraseValid}
              passphrase={passphrase}
            />
          )}
        </div>
      </main>
      <footer>
        <Button
          transparent
          color="orange"
          style={{
            fontSize: '1.5rem',
            marginRight: '1rem'
          }}
          onClick={onShowLoginForm}
        >
          {iAlreadyHaveAnAccountLabel}
        </Button>
      </footer>
    </ErrorBoundary>
  );
}
