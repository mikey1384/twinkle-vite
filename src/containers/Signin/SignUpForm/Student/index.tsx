import React, { useMemo, useState } from 'react';
import Username from './Username';
import Password from './Password';
import NameAndEmail from './NameAndEmail';
import SecretPassPhrase from './SecretPassPhrase';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

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
  onSetUsername
}: {
  username: string;
  onBackToSelection: () => void;
  onSetUsername: (username: string) => void;
}) {
  const [displayedPage, setDisplayedPage] = useState('username');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isPassPhraseValid, setIsPassPhraseValid] = useState(false);

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
          onSetIsUsernameAvailable={setIsUsernameAvailable}
          onSetUsername={(username) => {
            onSetUsername(username);
            setIsUsernameValid(true);
          }}
          onSubmit={() => console.log('submitting')}
        />
      )}
      {displayedPage === 'password' && (
        <Password
          onSubmit={() => {
            console.log('submitting');
            setIsPasswordValid(true);
          }}
        />
      )}
      {displayedPage === 'email' && (
        <NameAndEmail
          onSubmit={() => {
            console.log('submitting');
            setIsPasswordValid(true);
          }}
        />
      )}
      {displayedPage === 'passphrase' && (
        <SecretPassPhrase
          onSubmit={() => {
            console.log('submitting');
            setIsPassPhraseValid(true);
          }}
        />
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
              (!isUsernameValid && displayedPage === 'username') ||
              (!isPasswordValid && displayedPage === 'password') ||
              (!isPassPhraseValid && displayedPage === 'passphrase')
            }
            filled
            color="logoBlue"
            onClick={handleNext}
          >
            <span style={{ marginRight: '0.7rem' }}>Next</span>
            <Icon icon="chevron-right" />
          </Button>
        </div>
      </div>
    </div>
  );

  function handlePrevious() {
    const index = pages.indexOf(displayedPage);
    console.log(index);
    if (index > 0) {
      return setDisplayedPage(pages[index - 1]);
    }
    onBackToSelection();
  }

  function handleNext() {
    const index = pages.indexOf(displayedPage);
    if (index < pages.length - 1) {
      setDisplayedPage(pages[index + 1]);
    }
  }
}
