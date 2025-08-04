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
  };
}) {
  return (
    <div>
      {account?.email || account?.verifiedEmail ? (
        <EmailExists
          email={account.email}
          verifiedEmail={account.verifiedEmail}
          userId={account.id}
        />
      ) : (
        <AskForHelp />
      )}
    </div>
  );
}
