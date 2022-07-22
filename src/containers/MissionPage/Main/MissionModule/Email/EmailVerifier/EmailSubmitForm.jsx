import React, { useState, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import Input from '~/components/Texts/Input';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isValidEmail } from '~/helpers/stringHelpers';
import { useAppContext } from '~/contexts';

EmailSubmitForm.propTypes = {
  email: PropTypes.string,
  onSetEmailSent: PropTypes.func.isRequired,
  onSetEmail: PropTypes.func.isRequired,
  submitButtonColor: PropTypes.string
};

export default function EmailSubmitForm({
  email,
  onSetEmail,
  onSetEmailSent,
  submitButtonColor
}) {
  const sendVerificationOTPEmail = useAppContext(
    (v) => v.requestHelpers.sendVerificationOTPEmail
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const sendingEmailRef = useRef(false);
  const [errorMsg, setErrorMsg] = useState('');
  const emailIsValid = useMemo(() => isValidEmail(email), [email]);

  return (
    <div
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
        type="email"
        maxLength={100}
        placeholder="somebody@something.com"
        onChange={onSetEmail}
        value={email}
      />
      <div style={{ marginTop: '1.5rem' }}>
        {errorMsg && <p style={{ color: Color.red() }}>{errorMsg}</p>}
        <Button
          disabled={!emailIsValid || sendingEmail}
          style={{ fontSize: '1.7rem' }}
          filled
          color={submitButtonColor}
          onClick={() => handleConfirmEmail(email)}
        >
          {sendingEmail ? (
            <>
              <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
              <span style={{ marginLeft: '0.7rem' }}>One moment...</span>
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </div>
    </div>
  );

  async function handleConfirmEmail(email) {
    if (sendingEmailRef.current) return;
    try {
      sendingEmailRef.current = true;
      setSendingEmail(true);
      const success = await sendVerificationOTPEmail(email);
      sendingEmailRef.current = false;
      setSendingEmail(false);
      if (success) {
        onSetEmailSent(true);
      } else {
        setErrorMsg('An error occurred while sending a verification email');
      }
    } catch (error) {
      sendingEmailRef.current = false;
      setSendingEmail(false);
      console.error(error);
    }
  }
}
