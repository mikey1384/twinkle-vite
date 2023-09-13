import React, { useState } from 'react';
import UsernamePassword from './UsernamePassword';
import NameAndEmail from './NameAndEmail';
import SecretPassPhrase from './SecretPassPhrase';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

const pages = ['username', 'email', 'passphrase'];

export default function StudentForm({
  username,
  onSetUsername
}: {
  username: string;
  onSetUsername: (username: string) => void;
}) {
  const [displayedPage, setDisplayedPage] = useState('username');
  return (
    <div>
      {displayedPage === 'username' && (
        <UsernamePassword
          username={username}
          onSetUsername={onSetUsername}
          onSubmit={() => console.log('submitting')}
        />
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
        <Button filled color="redOrange" onClick={() => console.log('back')}>
          <Icon icon="chevron-left" />
          <span style={{ marginLeft: '0.7rem' }}>Back</span>
        </Button>
        <Button filled color="logoBlue" onClick={handleSetDisplayedPage}>
          <span style={{ marginRight: '0.7rem' }}>Next</span>
          <Icon icon="chevron-right" />
        </Button>
      </div>
    </div>
  );

  function handleSetDisplayedPage() {
    const index = pages.indexOf(displayedPage);
    if (index < pages.length - 1) {
      setDisplayedPage(pages[index + 1]);
    }
  }
}
