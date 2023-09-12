import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Banner from '~/components/Banner';
import UsernamePassword from './UsernamePassword';
import NameAndEmail from './NameAndEmail';
import SecretPassPhrase from './SecretPassPhrase';
import StudentOrTeacher from './StudentOrTeacher';
import { css } from '@emotion/css';
import { isValidUsername, stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext } from '~/contexts';
import localize from '~/constants/localize';

const createMyAccountLabel = localize('createMyAccount');
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
  const [displayedPage] = useState('userType');
  const submitDisabled = useMemo(
    () => !!signingUp || !!stringIsEmpty(username) || !!errorMessage,
    [errorMessage, signingUp, username]
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
            padding: 3rem 1.5rem 1.5rem 1.5rem;
            section {
              margin-top: 1rem;
            }
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
          {displayedPage === 'userType' && <StudentOrTeacher />}
          {displayedPage === 'usernameAndPassword' && (
            <UsernamePassword
              errorMessage={errorMessage}
              username={username}
              onSetUsername={onSetUsername}
              onSetErrorMessage={setErrorMessage}
              submitDisabled={submitDisabled}
              onSubmit={onSubmit}
            />
          )}
          {displayedPage === 'nameAndEmail' && (
            <NameAndEmail
              errorMessage={errorMessage}
              onSetErrorMessage={setErrorMessage}
              submitDisabled={submitDisabled}
              onSubmit={onSubmit}
            />
          )}
          {displayedPage === 'passphrase' && (
            <SecretPassPhrase
              errorMessage={errorMessage}
              onSetErrorMessage={setErrorMessage}
              onSubmit={onSubmit}
              submitDisabled={submitDisabled}
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
        <Button
          color="blue"
          disabled={!!submitDisabled}
          onClick={onSubmit}
          style={{ fontSize: '2.5rem' }}
        >
          {createMyAccountLabel}
        </Button>
      </footer>
    </ErrorBoundary>
  );

  async function onSubmit() {
    if (!isValidUsername(username)) {
      return setErrorMessage('username');
    }

    try {
      setSigningUp(true);
      const data = await signup({
        username
      });
      onSignup(data);
      onSetUserState({ userId: data.id, newState: data });
    } catch (error: any) {
      setErrorMessage(error?.data);
    } finally {
      setSigningUp(false);
    }
  }
}
