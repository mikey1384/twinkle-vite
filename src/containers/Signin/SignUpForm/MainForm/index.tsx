import React, { useMemo, useState } from 'react';
import Username from './Username';
import Password from './Password';
import NameAndEmail from './NameAndEmail';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const createMyAccountLabel = localize('createMyAccount');
const pages = ['username', 'password', 'name_and_email'];
const titles: {
  [key: string]: string;
} = {
  username: 'What is your username going to be?',
  password: 'Set a password',
  name_and_email: 'What is your name and your email?'
};

export default function MainForm({
  branchName,
  classLabel,
  firstname,
  lastname,
  username,
  password,
  email,
  verifiedEmail,
  reenteredPassword,
  isUsernameAvailable,
  hasEmailError,
  hasNameError,
  onBackToSelection,
  onSetBranchName,
  onSetClassLabel,
  onSetFirstname,
  onSetLastname,
  onSetHasEmailError,
  onSetHasNameError,
  onSetEmail,
  onSetVerifiedEmail,
  onSetIsUsernameAvailable,
  onSetPassword,
  onSetReenteredPassword,
  onSetUsername,
  userType
}: {
  branchName: string;
  classLabel: string;
  firstname: string;
  lastname: string;
  username: string;
  password: string;
  email: string;
  verifiedEmail: string;
  reenteredPassword: string;
  isUsernameAvailable: boolean;
  hasEmailError: boolean;
  hasNameError: boolean;
  onBackToSelection: () => void;
  onSetBranchName: (branchName: string) => void;
  onSetClassLabel: (classLabel: string) => void;
  onSetEmail: (email: string) => void;
  onSetVerifiedEmail: (email: string) => void;
  onSetFirstname: (firstname: string) => void;
  onSetLastname: (lastname: string) => void;
  onSetHasEmailError: (hasError: boolean) => void;
  onSetHasNameError: (hasError: boolean) => void;
  onSetIsUsernameAvailable: (isAvailable: boolean) => void;
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
  const [signingUp, setSigningUp] = useState(false);
  const isOnFinalPage = useMemo(
    () => displayedPage === pages[pages.length - 1],
    [displayedPage]
  );
  const displayedTitle = useMemo(() => {
    if (displayedPage === 'name_and_email' && userType === 'mentor') {
      return 'The following message will be sent to the admins for approval';
    }
    return titles[displayedPage];
  }, [displayedPage, userType]);

  const isEmailVerified = useMemo(() => {
    return email === verifiedEmail;
  }, [email, verifiedEmail]);

  const isEmailAndNamePageIncomplete = useMemo(() => {
    const isTeacherRequirementMet =
      !stringIsEmpty(branchName) &&
      !stringIsEmpty(classLabel) &&
      !stringIsEmpty(email) &&
      isEmailVerified;
    return (
      hasEmailError ||
      hasNameError ||
      stringIsEmpty(firstname) ||
      stringIsEmpty(lastname) ||
      (userType === 'mentor' && !isTeacherRequirementMet)
    );
  }, [
    branchName,
    classLabel,
    email,
    firstname,
    hasEmailError,
    hasNameError,
    isEmailVerified,
    lastname,
    userType
  ]);

  return (
    <div>
      <div
        className={css`
          text-align: center;
          font-family: 'Roboto', sans-serif;
          font-size: ${displayedPage === 'name_and_email' &&
          userType === 'mentor'
            ? '2.2rem'
            : '2.5rem'};
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
          branchName={branchName}
          classLabel={classLabel}
          firstname={firstname}
          lastname={lastname}
          email={email}
          verifiedEmail={verifiedEmail}
          onSetFirstname={onSetFirstname}
          onSetLastname={onSetLastname}
          onSetBranchName={onSetBranchName}
          onSetClassLabel={onSetClassLabel}
          onSetEmail={onSetEmail}
          onSetVerifiedEmail={onSetVerifiedEmail}
          onSetHasEmailError={onSetHasEmailError}
          onSetHasNameError={onSetHasNameError}
          userType={userType}
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
              (displayedPage === 'username' && !isUsernameAvailable) ||
              (displayedPage === 'password' &&
                (stringIsEmpty(password) || password !== reenteredPassword)) ||
              (displayedPage === 'name_and_email' &&
                isEmailAndNamePageIncomplete)
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
        branchName: (branchName || '').trim(),
        className: (classLabel || '').trim(),
        email,
        verifiedEmail,
        password,
        userType
      });
      onSignup(data);
      onSetUserState({ userId: data.id, newState: data });
    } catch (error: any) {
      const msg =
        typeof error === 'string'
          ? error
          : error?.message ||
            error?.response?.data ||
            'An unexpected error occurred';
      setErrorMessage(msg.trim());
    } finally {
      setSigningUp(false);
    }
  }
}
