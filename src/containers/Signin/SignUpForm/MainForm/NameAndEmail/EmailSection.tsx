import React, { useEffect, useRef, useState } from 'react';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import localize from '~/constants/localize';
import { isValidEmailAddress } from '~/helpers/stringHelpers';
import { useAppContext } from '~/contexts';

const emailIsNeededInCaseLabel = localize('emailIsNeededInCase');
const emailYoursOrYourParentsLabel = localize('emailYoursOrYourParents');

export default function EmailSection({
  email,
  onSetEmail,
  onSetHasEmailError,
  onSetEmailSent,
  userType
}: {
  email: string;
  onSetEmail: (value: string) => void;
  onSetHasEmailError: (value: boolean) => void;
  onSetEmailSent: (value: boolean) => void;
  userType: string;
}) {
  const sendingEmailRef = useRef(false);
  const sendVerificationOTPEmailForSignup = useAppContext(
    (v) => v.requestHelpers.sendVerificationOTPEmailForSignup
  );
  const [emailErrorMsg, setEmailErrorMsg] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendVerificationButtonShown, setSendVerificationButtonShown] =
    useState(false);

  useEffect(() => {
    setSendVerificationButtonShown(false);
    const timer = setTimeout(() => {
      if (email) {
        if (!isValidEmailAddress(email)) {
          setEmailErrorMsg('Invalid email address');
          onSetHasEmailError(true);
        } else {
          setSendVerificationButtonShown(true);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email, onSetHasEmailError]);

  return (
    <section style={{ marginTop: '2rem' }}>
      <label>
        {userType === 'student' ? emailYoursOrYourParentsLabel : 'Email'}
      </label>
      <Input
        value={email}
        hasError={!!emailErrorMsg}
        placeholder={
          userType === 'student'
            ? emailIsNeededInCaseLabel
            : 'Your Twinkle email address'
        }
        onChange={(text) => {
          setEmailErrorMsg('');
          onSetEmail(text.trim());
        }}
        type="email"
      />
      {sendVerificationButtonShown && (
        <div
          style={{ display: 'flex', width: '100%', justifyContent: 'center' }}
        >
          <Button
            style={{ marginTop: '1.5rem' }}
            filled
            color="logoBlue"
            loading={sendingEmail}
            onClick={handleConfirmEmail}
          >
            Send verification email
          </Button>
        </div>
      )}
      <p style={{ color: 'red' }}>{emailErrorMsg}</p>
    </section>
  );

  async function handleConfirmEmail(email: string) {
    if (sendingEmailRef.current) return;
    try {
      sendingEmailRef.current = true;
      setSendingEmail(true);
      const success = await sendVerificationOTPEmailForSignup(email);
      sendingEmailRef.current = false;
      setSendingEmail(false);
      if (success) {
        onSetEmailSent(true);
      } else {
        sendingEmailRef.current = false;
        setSendingEmail(false);
        setEmailErrorMsg(
          'An error occurred while sending a verification email'
        );
      }
    } catch (error) {
      console.error(error);
      setEmailErrorMsg('An error occurred while sending a verification email');
    } finally {
      sendingEmailRef.current = false;
      setSendingEmail(false);
    }
  }
}
