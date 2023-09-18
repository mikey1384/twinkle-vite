import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Student from './Student';
import Teacher from './Teacher';
import StudentOrTeacher from './StudentOrTeacher';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const iAlreadyHaveAnAccountLabel = localize('iAlreadyHaveAnAccount');
const letsSetUpYourAccountLabel = localize('letsSetUpYourAccount');

SignUpForm.propTypes = {
  username: PropTypes.string,
  onSetUsername: PropTypes.func.isRequired,
  onShowLoginForm: PropTypes.func.isRequired
};

export default function SignUpForm({
  username,
  onSetUsername,
  onShowLoginForm
}: {
  username: string;
  onSetUsername: (username: string) => void;
  onShowLoginForm: () => void;
}) {
  const [displayedPage, setDisplayedPage] = useState('userType');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [password, setPassword] = useState('');
  const [reenteredPassword, setReenteredPassword] = useState('');
  const [isPassphraseValid, setIsPassphraseValid] = useState(false);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [hasNameOrEmailError, setHasNameOrEmailError] = useState(false);

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
              onSetFirstname={setFirstname}
              onSetLastname={setLastname}
              onSetEmail={setEmail}
              onSetPassword={setPassword}
              onSetReenteredPassword={setReenteredPassword}
              onSetHasNameOrEmailError={setHasNameOrEmailError}
              onSetIsUsernameAvailable={setIsUsernameAvailable}
              onSetIsPassphraseValid={setIsPassphraseValid}
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
