import React from 'react';
import EmailExists from './EmailExists';
import AskForHelp from '~/components/AskForHelp';

export default function EmailSection({
  account
}: {
  account: {
    emailHint?: string;
    verifiedEmailHint?: string;
    id: number;
  };
}) {
  return (
    <div>
      {account?.emailHint || account?.verifiedEmailHint ? (
        <EmailExists
          emailHint={account.emailHint}
          verifiedEmailHint={account.verifiedEmailHint}
          userId={account.id}
        />
      ) : (
        <AskForHelp />
      )}
    </div>
  );
}
