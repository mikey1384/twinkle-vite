import React, { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import MainForm from './MainForm';
import StudentOrTeacher from './StudentOrTeacher';
import SecretPassPhrase from './SecretPassPhrase';
import InvitePass from './InvitePass';
import AgeCheck from './AgeCheck';
import GuardianConsent from './GuardianConsent';
import ClassCodeEntry from '~/containers/Classrooms/ClassCodeEntry';
import AskTeacher from '~/containers/Classrooms/AskTeacher';
import { getClassAsk } from '~/containers/Classrooms/shared';
import Icon from '~/components/Icon';
import ModalFooter from '~/components/Modal/Footer';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import {
  clearSignupInvite,
  getGuardianConsent,
  getSignupInvite,
  needsGuardianConsent,
  type SignupInvite
} from '~/helpers/signupPasses';
import { css } from '@emotion/css';
const iAlreadyHaveAnAccountLabel = 'I already have an account';
// The sign-up page of the sign-in window, in the standard Modal layout: the
// window's title bar and footer belong to the Modal (Signin/index.tsx gives
// the title; footer buttons arrive through ModalFooter), and this renders
// the body. Every step and its rules are as before.

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

  // the two other ways in (a teacher's class code, asking a teacher); a
  // request already sent from this browser reopens on its waiting screen
  const [otherWay, setOtherWay] = useState<'' | 'code' | 'ask'>(() =>
    getClassAsk() ? 'ask' : ''
  );
  const onEntryScreen =
    !otherWay && !userType && !isPassphraseValid && !inviteAccepted && !invite;

  return (
    <ErrorBoundary componentPath="Signin/SignupForm">
      <div className={bodyClass}>
        {otherWay === 'code' ? (
          <ClassCodeEntry onBack={() => setOtherWay('')} />
        ) : otherWay === 'ask' ? (
          <AskTeacher
            onBack={() => setOtherWay('')}
            onUseClassCode={() => setOtherWay('code')}
          />
        ) : userType ? (
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
            onShowLoginForm={onShowLoginForm}
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
        ) : inviteAccepted &&
          invite &&
          birth &&
          needsConsent &&
          !guardianConsent ? (
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
        {onEntryScreen && (
          <section className={otherWaysClass}>
            <div className={otherWaysLabelClass}>Other ways to join</div>
            <div className={otherWaysRowClass}>
              <Button
                variant="soft"
                color="logoBlue"
                uppercase={false}
                stretch
                onClick={() => setOtherWay('code')}
              >
                <Icon icon="qrcode" />
                <span className={otherWayTextClass}>
                  <b>I have a class code</b>
                  <small>From your teacher’s screen or board</small>
                </span>
              </Button>
              <Button
                variant="soft"
                color="logoBlue"
                uppercase={false}
                stretch
                onClick={() => setOtherWay('ask')}
              >
                <Icon icon="chalkboard-teacher" />
                <span className={otherWayTextClass}>
                  <b>Ask my teacher</b>
                  <small>Find your teacher and ask for an account</small>
                </span>
              </Button>
            </div>
          </section>
        )}
      </div>
      {/* MainForm, the class-code screen and Ask my teacher bring their own
          footer buttons (ModalFooter) */}
      {!otherWay && !userType && (
        <ModalFooter>
          <Button variant="ghost" color="orange" onClick={onShowLoginForm}>
            {iAlreadyHaveAnAccountLabel}
          </Button>
        </ModalFooter>
      )}
    </ErrorBoundary>
  );
}

// the steps' own spacing rules, as before the layout change
const bodyClass = css`
  width: 100%;
  min-height: 22vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1.5rem 0.5rem 0.5rem;
  section:first-of-type {
    margin-top: 0;
  }
  input {
    margin-top: 0.5rem;
  }
  label {
    font-weight: bold;
  }
`;
const otherWaysClass = css`
  width: 100%;
  max-width: 52rem;
  margin: 3rem auto 0 !important;
  padding-top: 1.6rem;
  border-top: 1px solid var(--ui-border);
`;
const otherWaysLabelClass = css`
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.3rem;
  font-weight: 700;
  color: ${Color.darkGray()};
`;
const otherWaysRowClass = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;
const otherWayTextClass = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 1rem;
  text-align: left;
  line-height: 1.3;
  b {
    font-size: 1.5rem;
  }
  small {
    font-size: 1.2rem;
    font-weight: 400;
    opacity: 0.85;
  }
`;
