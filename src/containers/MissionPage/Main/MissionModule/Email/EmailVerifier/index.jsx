import { useState } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import ErrorBoundary from '~/components/ErrorBoundary';
import EmailSubmitForm from './EmailSubmitForm';
import VerificationCodeInput from './VerificationCodeInput';

export default function EmailVerifier() {
  const {
    link: { color: linkColor },
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  return (
    <ErrorBoundary>
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
        {emailSent ? (
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
        ) : (
          <>
            Enter your email address below and tap{' '}
            <b style={{ color: Color[successColor]() }}>submit</b>
          </>
        )}
      </div>
      {!emailSent && (
        <EmailSubmitForm
          email={email}
          onSetEmail={setEmail}
          onSetEmailSent={setEmailSent}
          submitButtonColor={successColor}
        />
      )}
      {emailSent && (
        <VerificationCodeInput
          email={email}
          onRetry={() => setEmailSent(false)}
        />
      )}
    </ErrorBoundary>
  );

  function handleEmailClick() {
    const emailProvider = 'http://www.' + email.split('@')[1];
    window.open(emailProvider);
  }
}
