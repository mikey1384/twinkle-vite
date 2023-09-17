import React, { useEffect, useMemo, useState } from 'react';
import Username from './Username';
import Password from './Password';
import NameAndEmail from './NameAndEmail';
import SecretPassPhrase from './SecretPassPhrase';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const createMyAccountLabel = localize('createMyAccount');
const pages = ['username', 'password', 'email', 'passphrase'];
const titles: {
  [key: string]: string;
} = {
  username: 'What is your username going to be?',
  password: 'Set a password',
  email: 'What is your name and your email?',
  passphrase: `Answer this question to prove you're a Twinkle student`
};

export default function StudentForm({
  username,
  onBackToSelection,
  onSetUsername,
  onSetIsFormComplete
}: {
  username: string;
  onBackToSelection: () => void;
  onSetUsername: (username: string) => void;
  onSetIsFormComplete: (value: boolean) => void;
}) {
  const [displayedPage, setDisplayedPage] = useState('username');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [password, setPassword] = useState('');
  const [reenteredPassword, setReenteredPassword] = useState('');
  const [isPassphraseValid, setIsPassphraseValid] = useState(false);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [hasNameOrEmailError, setHasNameOrEmailError] = useState(false);
  const isOnFinalPage = useMemo(
    () => displayedPage === pages[pages.length - 1],
    [displayedPage]
  );

  const displayedTitle = useMemo(() => titles[displayedPage], [displayedPage]);

  const fullnameIsCompleteOrEmpty = useMemo(() => {
    return (
      (firstname && lastname) ||
      (stringIsEmpty(firstname) && stringIsEmpty(lastname))
    );
  }, [firstname, lastname]);

  useEffect(() => {
    const isFormComplete =
      isUsernameAvailable &&
      password &&
      password === reenteredPassword &&
      fullnameIsCompleteOrEmpty &&
      !hasNameOrEmailError &&
      isPassphraseValid &&
      email;

    onSetIsFormComplete(!!isFormComplete);
  }, [
    isUsernameAvailable,
    password,
    reenteredPassword,
    fullnameIsCompleteOrEmpty,
    hasNameOrEmailError,
    isPassphraseValid,
    email,
    onSetIsFormComplete
  ]);

  return (
    <div>
      <div
        className={css`
          text-align: center;
          font-family: 'Roboto', sans-serif;
          font-size: 2.5rem;
          margin-bottom: 20px;
          color: #333333;
          font-weight: 500;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 2rem;
          }
        `}
      >
        {displayedTitle}
      </div>
      {displayedPage === 'username' && (
        <Username
          username={username}
          isUsernameAvailable={isUsernameAvailable}
          onSetIsUsernameAvailable={setIsUsernameAvailable}
          onSetUsername={onSetUsername}
        />
      )}
      {displayedPage === 'password' && (
        <Password
          password={password}
          reenteredPassword={reenteredPassword}
          onSetPassword={setPassword}
          onSetReenteredPassword={setReenteredPassword}
        />
      )}
      {displayedPage === 'email' && (
        <NameAndEmail
          firstname={firstname}
          lastname={lastname}
          email={email}
          onSetFirstname={setFirstname}
          onSetLastname={setLastname}
          onSetEmail={setEmail}
          onSetHasNameOrEmailError={setHasNameOrEmailError}
        />
      )}
      {displayedPage === 'passphrase' && (
        <SecretPassPhrase onSetIsPassphraseValid={setIsPassphraseValid} />
      )}
      <div
        style={{
          marginTop: '3rem',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <Button filled color="redOrange" onClick={handlePrevious}>
            <Icon icon="chevron-left" />
            <span style={{ marginLeft: '0.7rem' }}>Back</span>
          </Button>
          {displayedPage !== pages[0] && (
            <a
              style={{
                display: 'inline-block',
                cursor: 'pointer',
                fontSize: '1.2rem',
                marginTop: '0.7rem',
                fontWeight: 'bold'
              }}
              onClick={onBackToSelection}
            >{`Actually, I'm not a student`}</a>
          )}
        </div>
        <div>
          <Button
            disabled={
              (!isUsernameAvailable && displayedPage === 'username') ||
              ((stringIsEmpty(password) || password !== reenteredPassword) &&
                displayedPage === 'password') ||
              ((hasNameOrEmailError || !fullnameIsCompleteOrEmpty) &&
                displayedPage === 'email') ||
              (!isPassphraseValid && displayedPage === 'passphrase')
            }
            filled
            color="logoBlue"
            onClick={handleNext}
          >
            <span style={{ marginRight: '0.7rem' }}>
              {isOnFinalPage ? createMyAccountLabel : 'Next'}
            </span>
            <Icon icon="chevron-right" />
          </Button>
        </div>
      </div>
    </div>
  );

  function handlePrevious() {
    const index = pages.indexOf(displayedPage);
    if (index > 0) {
      return setDisplayedPage(pages[index - 1]);
    }
    onBackToSelection();
  }

  function handleNext() {
    if (isOnFinalPage) {
      return onSubmit();
    }
    const index = pages.indexOf(displayedPage);
    if (index < pages.length - 1) {
      setDisplayedPage(pages[index + 1]);
    }
  }

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
