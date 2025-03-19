import React from 'react';
import EmailExists from './EmailExists';
import AskForHelp from '~/components/AskForHelp';

export default function EmailSection({
  account
}: {
  account: {
    email: string;
    verifiedEmail: string;
    id: number;
    username: string;
  };
}) {
  return (
    <div>
      {account?.email || account?.verifiedEmail ? (
        <EmailExists
          email={account.email}
          verifiedEmail={account.verifiedEmail}
          userId={account.id}
          username={account.username}
        />
      ) : (
        <AskForHelp />
      )}
    </div>
  );
}
