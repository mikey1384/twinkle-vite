import React, { useMemo, useState } from 'react';
import Username from './Username';
import Password from './Password';
import NameAndEmail from './NameAndEmail';
import SecretPassPhrase from './SecretPassPhrase';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const createMyAccountLabel = localize('createMyAccount');
const pages = ['username', 'password', 'name_and_email', 'passphrase'];
const titles: {
  [key: string]: string;
} = {
  username: 'What is your username going to be?',
  password: 'Set a password',
  name_and_email: 'What is your name and your email?',
  passphrase: `Answer this question to prove you're a Twinkle student`
};

export default function MainForm({
  firstname,
  lastname,
  username,
  password,
  email,
  reenteredPassword,
  isUsernameAvailable,
  isPassphraseValid,
  hasEmailError,
  hasNameError,
  onBackToSelection,
  onSetFirstname,
  onSetLastname,
  onSetHasEmailError,
  onSetHasNameError,
  onSetEmail,
  onSetIsUsernameAvailable,
  onSetIsPassphraseValid,
  onSetPassword,
  onSetReenteredPassword,
  onSetUsername,
  userType
}: {
  firstname: string;
  lastname: string;
  username: string;
  password: string;
  email: string;
  reenteredPassword: string;
  isUsernameAvailable: boolean;
  isPassphraseValid: boolean;
  hasEmailError: boolean;
  hasNameError: boolean;
  onBackToSelection: () => void;
  onSetEmail: (email: string) => void;
  onSetFirstname: (firstname: string) => void;
  onSetLastname: (lastname: string) => void;
  onSetHasEmailError: (hasError: boolean) => void;
  onSetHasNameError: (hasError: boolean) => void;
  onSetIsUsernameAvailable: (isAvailable: boolean) => void;
  onSetIsPassphraseValid: (isValid: boolean) => void;
  onSetPassword: (password: string) => void;
  onSetReenteredPassword: (password: string) => void;
  onSetUsername: (username: string) => void;
  userType: string;
}) {
  const onSignup = useAppContext((v) => v.user.actions.onSignup);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const signup = useAppContext((v) => v.requestHelpers.signup);
  const [displayedPage, setDisplayedPage] = useState('username');
  const [errorMessage, setErrorMessage] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const isOnFinalPage = useMemo(
    () => displayedPage === pages[pages.length - 1],
    [displayedPage]
  );

  const displayedTitle = useMemo(() => titles[displayedPage], [displayedPage]);

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
          onSetIsUsernameAvailable={onSetIsUsernameAvailable}
          onSetUsername={onSetUsername}
        />
      )}
      {displayedPage === 'password' && (
        <Password
          password={password}
          reenteredPassword={reenteredPassword}
          onSetPassword={onSetPassword}
          onSetReenteredPassword={onSetReenteredPassword}
        />
      )}
      {displayedPage === 'name_and_email' && (
        <NameAndEmail
          firstname={firstname}
          lastname={lastname}
          email={email}
          onSetFirstname={onSetFirstname}
          onSetLastname={onSetLastname}
          onSetEmail={onSetEmail}
          onSetHasEmailError={onSetHasEmailError}
          onSetHasNameError={onSetHasNameError}
          userType={userType}
        />
      )}
      {displayedPage === 'passphrase' && (
        <SecretPassPhrase
          onSetPassphrase={setPassphrase}
          onSetIsPassphraseValid={onSetIsPassphraseValid}
          passphrase={passphrase}
        />
      )}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
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
            >{`Actually, I'm not a ${userType}`}</a>
          )}
        </div>
        <div>
          <Button
            filled
            disabled={
              (!isUsernameAvailable && displayedPage === 'username') ||
              ((stringIsEmpty(password) || password !== reenteredPassword) &&
                displayedPage === 'password') ||
              ((hasEmailError ||
                hasNameError ||
                stringIsEmpty(firstname) ||
                stringIsEmpty(lastname)) &&
                displayedPage === 'name_and_email') ||
              (!isPassphraseValid && displayedPage === 'passphrase')
            }
            loading={signingUp}
            color={isOnFinalPage ? 'green' : 'logoBlue'}
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
    try {
      setSigningUp(true);
      const data = await signup({
        firstname: firstname.trim(),
        lastname,
        username,
        email,
        password,
        passphrase
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
