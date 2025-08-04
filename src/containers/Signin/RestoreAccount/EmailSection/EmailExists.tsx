import React, { useMemo } from 'react';
import CheckYourEmail from '~/components/CheckYourEmail';
import SelectEmail from '~/components/SelectEmail';
import Loading from '~/components/Loading';

export default function EmailExists({
  email,
  userId,
  verifiedEmail
}: {
  email: string;
  userId: number;
  verifiedEmail: string;
}) {
  const hiddenEmail = useMemo(() => {
    return hideEmail(email) || '';
  }, [email]);
  const hiddenVerifiedEmail = useMemo(() => {
    return !email || email !== verifiedEmail ? hideEmail(verifiedEmail) : '';
  }, [email, verifiedEmail]);

  const viableEmail = email || verifiedEmail;
  const hiddenViableEmail = hiddenEmail || hiddenVerifiedEmail || '';

  return (
    <div>
      {(hiddenEmail && !hiddenVerifiedEmail) ||
      (!hiddenEmail && hiddenVerifiedEmail) ? (
        <CheckYourEmail
          email={viableEmail}
          hiddenEmail={hiddenViableEmail}
          userId={userId}
        />
      ) : hiddenVerifiedEmail ? (
        <SelectEmail
          email={email}
          hiddenEmail={hiddenEmail}
          verifiedEmail={verifiedEmail}
          hiddenVerifiedEmail={hiddenVerifiedEmail}
          userId={userId}
        />
      ) : (
        <Loading />
      )}
    </div>
  );

  function hideEmail(email: string) {
    if (!email) return null;
    let result = '';
    const emailAccountNamePart = email.split('@')[0];
    for (let i = 0; i < email.length; i++) {
      if (i !== 0 && i < emailAccountNamePart.length) {
        result += '*';
        continue;
      }
      result += email[i];
    }
    return result;
  }
}
