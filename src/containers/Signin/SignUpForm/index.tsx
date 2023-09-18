import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Student from './Student';
import Teacher from './Teacher';
import StudentOrTeacher from './StudentOrTeacher';
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
  hasNameOrEmailError,
  reenteredPassword,
  onSetFirstname,
  onSetLastname,
  onSetEmail,
  onSetIsPassphraseValid,
  onSetIsUsernameAvailable,
  onSetHasNameOrEmailError,
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
  hasNameOrEmailError: boolean;
  reenteredPassword: string;
  onSetFirstname: (firstname: string) => void;
  onSetLastname: (lastname: string) => void;
  onSetEmail: (email: string) => void;
  onSetIsPassphraseValid: (isValid: boolean) => void;
  onSetIsUsernameAvailable: (isAvailable: boolean) => void;
  onSetHasNameOrEmailError: (hasError: boolean) => void;
  onSetPassword: (password: string) => void;
  onSetReenteredPassword: (password: string) => void;
  onSetUsername: (username: string) => void;
  onShowLoginForm: () => void;
}) {
  const [displayedPage, setDisplayedPage] = useState('userType');

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
          {displayedPage === 'userType' && (
            <StudentOrTeacher onSelect={setDisplayedPage} />
          )}
          {displayedPage === 'student' && (
            <Student
              firstname={firstname}
              lastname={lastname}
              username={username}
              password={password}
              email={email}
              reenteredPassword={reenteredPassword}
              isUsernameAvailable={isUsernameAvailable}
              isPassphraseValid={isPassphraseValid}
              hasNameOrEmailError={hasNameOrEmailError}
              onSetFirstname={onSetFirstname}
              onSetLastname={onSetLastname}
              onSetEmail={onSetEmail}
              onSetPassword={onSetPassword}
              onSetReenteredPassword={onSetReenteredPassword}
              onSetHasNameOrEmailError={onSetHasNameOrEmailError}
              onSetIsUsernameAvailable={onSetIsUsernameAvailable}
              onSetIsPassphraseValid={onSetIsPassphraseValid}
              onSetUsername={onSetUsername}
              onBackToSelection={() => setDisplayedPage('userType')}
            />
          )}
          {displayedPage === 'teacher' && (
            <Teacher onSetUsername={onSetUsername} />
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
