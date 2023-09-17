import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Banner from '~/components/Banner';
import Student from './Student';
import Teacher from './Teacher';
import StudentOrTeacher from './StudentOrTeacher';
import { css } from '@emotion/css';
import { isValidUsername } from '~/helpers/stringHelpers';
import { useAppContext } from '~/contexts';
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
  const onSignup = useAppContext((v) => v.user.actions.onSignup);
  const signup = useAppContext((v) => v.requestHelpers.signup);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [signingUp, setSigningUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [displayedPage, setDisplayedPage] = useState('userType');
  const [isStudentFormComplete, setIsStudentFormComplete] = useState(false);
  const [isTeacherFormComplete, setIsTeacherFormComplete] = useState(false);
  const submitDisabled = useMemo(
    () =>
      !!signingUp ||
      displayedPage === 'userType' ||
      (displayedPage === 'student' && !isStudentFormComplete) ||
      (displayedPage === 'teacher' && !isTeacherFormComplete) ||
      !!errorMessage,
    [
      displayedPage,
      errorMessage,
      isStudentFormComplete,
      isTeacherFormComplete,
      signingUp
    ]
  );

  const isOtherErrorMessage = useMemo(() => {
    const validTypes = [
      'alreadyExists',
      'username',
      'firstname',
      'password',
      'lastname',
      'email',
      'keyphrase'
    ];
    return errorMessage && !validTypes.includes(errorMessage);
  }, [errorMessage]);

  return (
    <ErrorBoundary componentPath="Signin/SignupForm">
      <header>{letsSetUpYourAccountLabel}</header>
      {isOtherErrorMessage && <Banner>{errorMessage}</Banner>}
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
              onSetIsFormComplete={setIsStudentFormComplete}
            />
          )}
          {displayedPage === 'teacher' && (
            <Teacher
              onSetUsername={onSetUsername}
              onSetIsTeacherFormComplete={setIsTeacherFormComplete}
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
