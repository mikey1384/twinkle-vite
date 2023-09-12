import React, { useState } from 'react';
import UsernamePassword from './UsernamePassword';
import Button from '~/components/Button';

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
      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <Button filled color="logoBlue" onClick={handleSetDisplayedPage}>
          Next
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
