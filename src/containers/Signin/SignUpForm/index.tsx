import React, { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import MainForm from './MainForm';
import StudentOrTeacher from './StudentOrTeacher';
import SecretPassPhrase from './SecretPassPhrase';
import InvitePass from './InvitePass';
import AgeCheck from './AgeCheck';
import GuardianConsent from './GuardianConsent';
import { useAppContext } from '~/contexts';
import {
  clearSignupInvite,
  getGuardianConsent,
  getSignupInvite,
  needsGuardianConsent,
  type SignupInvite
} from '~/helpers/signupPasses';
import { css } from '@emotion/css';
import { SITE_NAME } from '~/constants/siteBrand';
const iAlreadyHaveAnAccountLabel = 'I already have an account';
const letsSetUpYourAccountLabel = `Welcome to ${SITE_NAME}! Let's set up your account`;

export default function SignUpForm({
  branchName,
  classLabel,
  firstname,
  lastname,
  username,
  password,
  email,
  verifiedEmail,
  isPassphraseValid,
  isUsernameAvailable,
  hasNameError,
  hasEmailError,
  reenteredPassword,
  onSetFirstname,
  onSetLastname,
  onSetEmail,
  onSetVerifiedEmail,
  onSetBranchName,
  onSetClassLabel,
  onSetIsPassphraseValid,
  onSetIsUsernameAvailable,
  onSetHasNameError,
  onSetHasEmailError,
  onSetPassword,
  onSetReenteredPassword,
  onSetUsername,
  onShowLoginForm
}: {
  branchName: string;
  classLabel: string;
  firstname: string;
  lastname: string;
  username: string;
  password: string;
  email: string;
  verifiedEmail: string;
  isPassphraseValid: boolean;
  isUsernameAvailable: boolean;
  hasNameError: boolean;
  hasEmailError: boolean;
  reenteredPassword: string;
  onSetBranchName: (branchName: string) => void;
  onSetClassLabel: (classLabel: string) => void;
  onSetFirstname: (firstname: string) => void;
  onSetLastname: (lastname: string) => void;
  onSetEmail: (email: string) => void;
  onSetVerifiedEmail: (email: string) => void;
  onSetIsPassphraseValid: (isValid: boolean) => void;
  onSetIsUsernameAvailable: (isAvailable: boolean) => void;
  onSetHasNameError: (hasError: boolean) => void;
  onSetHasEmailError: (hasError: boolean) => void;
  onSetPassword: (password: string) => void;
  onSetReenteredPassword: (password: string) => void;
  onSetUsername: (username: string) => void;
  onShowLoginForm: () => void;
}) {
  const [userType, setUsertype] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const getInviteView = useAppContext((v) => v.requestHelpers.getSignupInvite);
  // an invite pass in this browser stands in for the sign-up question
  const [invite, setInvite] = useState<SignupInvite | null>(null);
  const [inviteAccepted, setInviteAccepted] = useState(false);
  // invited sign-ups: when you were born, and under 14 a parent's or
  // guardian's approval (Mikey, 2026-09-27)
  const [birth, setBirth] = useState<{
    birthYear: number;
    birthMonth: number;
  } | null>(null);
  const [guardianConsent, setGuardianConsent] = useState<{
    consentId: number;
    secret: string;
  } | null>(null);
  const needsConsent =
    !!birth && needsGuardianConsent(birth.birthYear, birth.birthMonth);

  useEffect(() => {
    const stored = getSignupInvite();
    if (!stored) return;
    let cancelled = false;
    (async () => {
      try {
        const { invite: view, unavailable } = await getInviteView(stored.token);
        if (cancelled) return;
        if (view) {
          setInvite({ ...stored, ...view });
          // a guardian was already asked: back to the waiting screen
          const consent = getGuardianConsent(stored.token);
          if (consent) {
            setBirth({
              birthYear: consent.birthYear,
              birthMonth: consent.birthMonth
            });
            setInviteAccepted(true);
          }
        } else if (!unavailable) clearSignupInvite(); // used or expired
      } catch {
        // the question still works
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // The server needs the passphrase with the sign-up itself. If the form
    // came back without it (remounted), ask the question again.
    if (isPassphraseValid && !passphrase) {
      onSetIsPassphraseValid(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPassphraseValid, passphrase]);

  return (
    <ErrorBoundary componentPath="Signin/SignupForm">
      <header>{letsSetUpYourAccountLabel}</header>
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '25vh'
        }}
      >
        <div
          className={css`
            width: 100%;
            padding: 2.5rem 1.5rem 1.5rem 1.5rem;
            section:first-of-type {
              margin-top: 0;
            }
            input {
              margin-top: 0.5rem;
            }
            label {
              font-weight: bold;
            }
          `}
        >
          {userType ? (
            <MainForm
              branchName={branchName}
              classLabel={classLabel}
              firstname={firstname}
              lastname={lastname}
              username={username}
              password={password}
              email={email}
              verifiedEmail={verifiedEmail}
              reenteredPassword={reenteredPassword}
              isUsernameAvailable={isUsernameAvailable}
              hasEmailError={hasEmailError}
              hasNameError={hasNameError}
              onSetBranchName={onSetBranchName}
              onSetClassLabel={onSetClassLabel}
              onSetFirstname={onSetFirstname}
              onSetLastname={onSetLastname}
              onSetEmail={onSetEmail}
              onSetVerifiedEmail={onSetVerifiedEmail}
              onSetPassword={onSetPassword}
              onSetReenteredPassword={onSetReenteredPassword}
              onSetHasNameError={onSetHasNameError}
              onSetHasEmailError={onSetHasEmailError}
              onSetIsUsernameAvailable={onSetIsUsernameAvailable}
              onSetUsername={onSetUsername}
              onBackToSelection={() => setUsertype('')}
              passphrase={passphrase}
              invite={inviteAccepted ? invite?.token : undefined}
              birthYear={birth?.birthYear}
              birthMonth={birth?.birthMonth}
              guardianConsent={guardianConsent || undefined}
              userType={userType}
            />
          ) : isPassphraseValid ? (
            <StudentOrTeacher onSelect={setUsertype} />
          ) : inviteAccepted && invite && !birth ? (
            <AgeCheck
              onBack={() => setInviteAccepted(false)}
              onContinue={setBirth}
            />
          ) : inviteAccepted && invite && birth && needsConsent && !guardianConsent ? (
            <GuardianConsent
              inviteToken={invite.token}
              birthYear={birth.birthYear}
              birthMonth={birth.birthMonth}
              initialFirstName={firstname}
              onChangeBirth={() => setBirth(null)}
              onApproved={({ consentId, secret, childFirstName }) => {
                if (!firstname.trim()) onSetFirstname(childFirstName);
                setGuardianConsent({ consentId, secret });
              }}
            />
          ) : inviteAccepted ? (
            <StudentOrTeacher onSelect={setUsertype} />
          ) : invite ? (
            <InvitePass
              inviterName={invite.inviterName || ''}
              source={invite.source || 'guest'}
              minecraftName={invite.minecraftName}
              onContinue={() => setInviteAccepted(true)}
              onUseQuestion={() => setInvite(null)}
              onLogIn={onShowLoginForm}
            />
          ) : (
            <SecretPassPhrase
              onSetPassphrase={setPassphrase}
              onSetIsPassphraseValid={onSetIsPassphraseValid}
              passphrase={passphrase}
            />
          )}
        </div>
      </main>
      <footer>
        <Button
          variant="ghost"
          color="orange"
          style={{
            fontSize: '1.5rem',
            marginRight: '1rem'
          }}
          onClick={onShowLoginForm}
        >
          {iAlreadyHaveAnAccountLabel}
        </Button>
      </footer>
    </ErrorBoundary>
  );
}
