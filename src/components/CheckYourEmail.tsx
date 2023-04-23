import React, { useEffect } from 'react';
import { useAppContext } from '~/contexts';

export default function CheckYourEmail({
  email,
  hiddenEmail,
  userId
}: {
  email: string;
  hiddenEmail: string;
  userId: number;
}) {
  const sendVerificationEmail = useAppContext(
    (v) => v.requestHelpers.sendVerificationEmail
  );
  useEffect(() => {
    sendVerificationEmail({
      email,
      userId,
      isPasswordReset: true
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ fontSize: '1.7rem' }}>
      <p>We have just sent a message to {hiddenEmail || email}</p>
      <p style={{ marginTop: '1rem' }}>
        Please check your inbox and follow the instructions in the email
      </p>
    </div>
  );
}
