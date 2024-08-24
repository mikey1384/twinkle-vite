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
  branchName,
  classLabel,
  firstname,
  lastname,
  username,
  password,
  email,
  verifiedEmail,
  isPassphraseValid,
  isUsernameAvailable,
  hasNameError,
  hasEmailError,
  reenteredPassword,
  onSetFirstname,
  onSetLastname,
  onSetEmail,
  onSetVerifiedEmail,
  onSetBranchName,
  onSetClassLabel,
  onSetIsPassphraseValid,
  onSetIsUsernameAvailable,
  onSetHasNameError,
  onSetHasEmailError,
  onSetPassword,
  onSetReenteredPassword,
  onSetUsername,
  onShowLoginForm
}: {
  branchName: string;
  classLabel: string;
  firstname: string;
  lastname: string;
  username: string;
  password: string;
  email: string;
  verifiedEmail: string;
  isPassphraseValid: boolean;
  isUsernameAvailable: boolean;
  hasNameError: boolean;
  hasEmailError: boolean;
  reenteredPassword: string;
  onSetBranchName: (branchName: string) => void;
  onSetClassLabel: (classLabel: string) => void;
  onSetFirstname: (firstname: string) => void;
  onSetLastname: (lastname: string) => void;
  onSetEmail: (email: string) => void;
  onSetVerifiedEmail: (email: string) => void;
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
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '25vh'
        }}
      >
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
              branchName={branchName}
              classLabel={classLabel}
              firstname={firstname}
              lastname={lastname}
              username={username}
              password={password}
              email={email}
              verifiedEmail={verifiedEmail}
              reenteredPassword={reenteredPassword}
              isUsernameAvailable={isUsernameAvailable}
              hasEmailError={hasEmailError}
              hasNameError={hasNameError}
              onSetBranchName={onSetBranchName}
              onSetClassLabel={onSetClassLabel}
              onSetFirstname={onSetFirstname}
              onSetLastname={onSetLastname}
              onSetEmail={onSetEmail}
              onSetVerifiedEmail={onSetVerifiedEmail}
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
