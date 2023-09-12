import React, { useState } from 'react';
import UsernamePassword from './UsernamePassword';

export default function StudentForm({
  onSetUsername
}: {
  onSetUsername: (username: string) => void;
}) {
  const [displayedPage, setDisplayedPage] = useState('username');
  console.log(onSetUsername);
  return (
    <div>
      {displayedPage === 'username' && (
        <UsernamePassword
          onSetDisplayedPage={setDisplayedPage}
          onSubmit={() => console.log('submitting')}
        />
      )}
    </div>
  );
}
