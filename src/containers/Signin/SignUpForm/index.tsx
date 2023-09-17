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
              username={username}
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
