import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import ErrorBoundary from '~/components/ErrorBoundary';
import VerificationCodeInput from './VerificationCodeInput';

export default function Verifier({
  email,
  onSetEmailSent,
  onSetVerifiedEmail
}: {
  email: string;
  onSetEmailSent: (value: boolean) => void;
  onSetVerifiedEmail: (value: string) => void;
}) {
  const {
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);

  return (
    <ErrorBoundary componentPath="Signin/SignUpForm/MainForm/NameAndEmail/Verifier">
      <div
        className={css`
          width: 100%;
          text-align: center;
          font-size: 2rem;
          font-weight: bold;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.5rem;
          }
        `}
      >
        <div style={{ marginBottom: '2rem' }}>
          <p>
            An email with a 6-digit number was sent to{' '}
            <span
              onClick={handleEmailClick}
              style={{ color: Color[linkColor](), cursor: 'pointer' }}
              className={css`
                &:hover {
                  text-decoration: underline;
                }
              `}
            >
              {email}
            </span>
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            Enter the number in the field below
          </p>
        </div>
      </div>
      <VerificationCodeInput
        email={email}
        onRetry={() => onSetEmailSent(false)}
        onSetVerifiedEmail={onSetVerifiedEmail}
      />
    </ErrorBoundary>
  );

  function handleEmailClick() {
    const emailProvider = 'http://www.' + email.split('@')[1];
    window.open(emailProvider);
  }
}
