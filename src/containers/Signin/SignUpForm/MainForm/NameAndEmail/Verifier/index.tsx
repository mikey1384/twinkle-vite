import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';
import ErrorBoundary from '~/components/ErrorBoundary';
import VerificationInput from './VerificationInput';

export default function Verifier({
  email,
  onSetEmailSent,
  onSetVerifiedEmail
}: {
  email: string;
  onSetEmailSent: (value: boolean) => void;
  onSetVerifiedEmail: (value: string) => void;
}) {
  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const linkColor = linkRole.getColor() || Color.logoBlue();

  return (
    <ErrorBoundary componentPath="Signin/SignUpForm/MainForm/NameAndEmail/Verifier">
      <div
        className={css`
          width: 100%;
          text-align: center;
          font-size: 1.7rem;
          font-weight: bold;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.5rem;
          }
        `}
      >
        <div style={{ marginTop: '3.5rem' }}>
          <p>
            An email with a 6-digit number was sent to{' '}
            <span
              onClick={handleEmailClick}
              style={{ color: linkColor, cursor: 'pointer' }}
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
      <VerificationInput
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
