import React from 'react';
import CheckYourEmail from '~/components/CheckYourEmail';
import SelectEmail from '~/components/SelectEmail';

// Account recovery is signed out, so the page never has the addresses: the
// server sends masked hints (emailHint, verifiedEmailHint) and, on Send, looks
// the chosen address up itself (Mikey 2026-10-04: a hidden email is shown to
// nobody but its owner).
export default function EmailExists({
  emailHint,
  verifiedEmailHint,
  userId
}: {
  emailHint?: string;
  verifiedEmailHint?: string;
  userId: number;
}) {
  if (emailHint && verifiedEmailHint) {
    return (
      <div>
        <SelectEmail
          email=""
          hiddenEmail={emailHint}
          verifiedEmail=""
          hiddenVerifiedEmail={verifiedEmailHint}
          userId={userId}
        />
      </div>
    );
  }
  return (
    <div>
      <CheckYourEmail
        email=""
        hiddenEmail={emailHint || verifiedEmailHint}
        which={emailHint ? 'email' : 'verifiedEmail'}
        userId={userId}
      />
    </div>
  );
}
