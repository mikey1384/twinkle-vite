import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Banner from '~/components/Banner';
import UsernamePassword from './UsernamePassword';
import NameAndEmail from './NameAndEmail';
import { css } from '@emotion/css';
import { isValidUsername, stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext } from '~/contexts';
import localize from '~/constants/localize';

const createMyAccountLabel = localize('createMyAccount');
const iAlreadyHaveAnAccountLabel = localize('iAlreadyHaveAnAccount');
const letsSetUpYourAccountLabel = localize('letsSetUpYourAccount');
const passphraseLabel = localize('passphrase');
const passphraseErrorMsgLabel = localize('passphraseErrorMsg');

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
  const [keyphrase, setKeyphrase] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const submitDisabled = useMemo(
    () =>
      !!signingUp ||
      !!stringIsEmpty(username) ||
      !!stringIsEmpty(keyphrase) ||
      !!errorMessage,
    [errorMessage, keyphrase, signingUp, username]
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
            padding: 1rem 1.5rem 1.5rem 1.5rem;
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
          <UsernamePassword
            errorMessage={errorMessage}
            username={username}
            onSetUsername={onSetUsername}
            onSetErrorMessage={setErrorMessage}
            submitDisabled={submitDisabled}
            onSubmit={onSubmit}
          />
          <NameAndEmail
            errorMessage={errorMessage}
            onSetErrorMessage={setErrorMessage}
            submitDisabled={submitDisabled}
            onSubmit={onSubmit}
          />
          <section>
            <label>{passphraseLabel}</label>
            <Input
              value={keyphrase}
              hasError={errorMessage === 'keyphrase'}
              placeholder={passphraseLabel}
              onChange={(text) => {
                setErrorMessage('');
                setKeyphrase(text);
              }}
              onKeyPress={(event: any) => {
                if (event.key === 'Enter' && !submitDisabled) {
                  onSubmit();
                }
              }}
            />
            {errorMessage === 'keyphrase' && (
              <p style={{ color: 'red' }}>{passphraseErrorMsgLabel}</p>
            )}
          </section>
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
        username,
        keyphrase
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
