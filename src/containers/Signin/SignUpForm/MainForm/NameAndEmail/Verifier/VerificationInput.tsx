import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Input from '~/components/Texts/Input';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';

export default function VerificationInput({
  onRetry,
  email,
  onSetVerifiedEmail
}: {
  email: string;
  onRetry: () => void;
  onSetVerifiedEmail: (value: string) => void;
}) {
  const {
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const verifyEmailViaOTP = useAppContext(
    (v) => v.requestHelpers.verifyEmailViaOTP
  );

  return (
    <ErrorBoundary
      componentPath="Signin/SignUpForm/MainForm/NameAndEmail/Verifier/VerificationInput"
      style={{
        marginTop: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
      }}
    >
      <Input
        className={css`
          width: 50%;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
          }
        `}
        disabled={verifying}
        type="text"
        maxLength={6}
        placeholder="Enter the 6-digit number"
        onChange={handleCodeInput}
        value={verificationCode}
      />
      {errorMsg && (
        <p
          style={{
            color: Color.red(),
            fontWeight: 'bold',
            fontSize: '1.3rem',
            marginTop: '0.5rem',
            marginBottom: '0.5rem'
          }}
        >
          {errorMsg}
        </p>
      )}
      <p
        onClick={onRetry}
        style={{
          marginTop: '0.5rem',
          cursor: 'pointer',
          color: Color[linkColor]()
        }}
        className={css`
          font-size: 1.3rem;
          &:hover {
            text-decoration: underline;
          }
        `}
      >{`Didn't receive an email? Tap here to retry`}</p>
    </ErrorBoundary>
  );

  async function handleCodeInput(text: string) {
    setErrorMsg('');
    setVerificationCode(text);
    if (text.length === 6) {
      setVerifying(true);
      const success = await verifyEmailViaOTP({ otp: text, email });
      if (success) {
        setVerifying(false);
        onSetVerifiedEmail(email);
      } else {
        setErrorMsg(`That is not the number we sent you. Please try again`);
        setVerifying(false);
      }
    }
  }
}
