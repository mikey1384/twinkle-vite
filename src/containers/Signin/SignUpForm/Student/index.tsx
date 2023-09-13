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
          onSetUsername={onSetUsername}
          onSubmit={() => console.log('submitting')}
        />
      )}
      {displayedPage === 'password' && (
        <Password onSubmit={() => console.log('submitting')} />
      )}
      {displayedPage === 'email' && (
        <NameAndEmail onSubmit={() => console.log('submitting')} />
      )}
      {displayedPage === 'passphrase' && (
        <SecretPassPhrase onSubmit={() => console.log('submitting')} />
      )}
      <div
        style={{
          marginTop: '3rem',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <Button filled color="redOrange" onClick={handlePrevious}>
          <Icon icon="chevron-left" />
          <span style={{ marginLeft: '0.7rem' }}>Back</span>
        </Button>
        <Button filled color="logoBlue" onClick={handleNext}>
          <span style={{ marginRight: '0.7rem' }}>Next</span>
          <Icon icon="chevron-right" />
        </Button>
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
