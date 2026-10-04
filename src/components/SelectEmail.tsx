import React, { useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';

export default function SelectEmail({
  email,
  hiddenEmail,
  verifiedEmail,
  hiddenVerifiedEmail,
  userId
}: {
  email: string;
  hiddenEmail?: string;
  verifiedEmail: string;
  hiddenVerifiedEmail?: string;
  userId: number;
}) {
  const sendVerificationEmail = useAppContext(
    (v) => v.requestHelpers.sendVerificationEmail
  );
  const [emailSent, setEmailSent] = useState<any>({});

  return (
    <div style={{ fontSize: '1.7rem' }}>
      <p>
        We will now send you an email which will lead you to a page where you
        could reset your password.
      </p>
      <div style={{ textAlign: 'center' }}>
        <p style={{ marginTop: '2rem', fontWeight: 'bold' }}>
          Select the email address you want us to send the email to
        </p>
      </div>
      <div
        style={{
          marginTop: '2.5rem',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <p>{hiddenEmail || email}</p>
          <Button
            style={{ marginLeft: '1rem' }}
            variant="soft"
            tone="raised"
            color="orange"
            onClick={() => handleSendEmail('email')}
            disabled={!!emailSent.email}
          >
            <Icon size="lg" icon="paper-plane" />
            <span style={{ marginLeft: '1rem' }}>
              {emailSent.email ? 'Sent' : 'Send'}
            </span>
          </Button>
        </div>
        <div
          style={{ marginTop: '1rem', display: 'flex', alignItems: 'center' }}
        >
          <p>{hiddenVerifiedEmail || verifiedEmail}</p>
          <Button
            style={{ marginLeft: '1rem' }}
            variant="soft"
            tone="raised"
            color="orange"
            onClick={() => handleSendEmail('verifiedEmail')}
            disabled={!!emailSent.verifiedEmail}
          >
            <Icon size="lg" icon="paper-plane" />
            <span style={{ marginLeft: '1rem' }}>
              {emailSent.verifiedEmail ? 'Sent' : 'Send'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );

  // the address when this page has it (your own account); otherwise which one,
  // and the server looks it up (account recovery only ever has masked hints)
  function handleSendEmail(which: 'email' | 'verifiedEmail') {
    const address = which === 'email' ? email : verifiedEmail;
    sendVerificationEmail({
      ...(address ? { email: address } : { which }),
      userId,
      isPasswordReset: true
    });
    setEmailSent((obj: any) => ({ ...obj, [which]: true }));
  }
}
