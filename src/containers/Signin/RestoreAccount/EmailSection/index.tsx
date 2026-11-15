import React from 'react';
import EmailExists from './EmailExists';
import AskForHelp from '~/components/AskForHelp';
import ClassResetWithCode from '~/containers/Classrooms/ResetWithCode';

export default function EmailSection({
  account
}: {
  account: {
    emailHint?: string;
    verifiedEmailHint?: string;
    id: number;
    username?: string;
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
        <>
          <AskForHelp />
          {/* a class account with no email: its teacher's one-time code */}
          <ClassResetWithCode username={account?.username || ''} />
        </>
      )}
    </div>
  );
}
