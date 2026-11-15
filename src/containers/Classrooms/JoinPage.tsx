import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams
} from 'react-router-dom';
import Button from '~/components/Button';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import ProfilePic from '~/components/ProfilePic';
import Input from '~/components/Texts/Input';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { SITE_NAME } from '~/constants/siteBrand';
import { setAnalyticsUser, trackEvent } from '~/helpers/analytics';
import { getErrorMessage } from '~/helpers/errorMessageHelpers';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { QuestNote } from '~/containers/BridgeBuilderQuest/StepCard';
import Username from '~/containers/Signin/SignUpForm/MainForm/Username';
import Password from '~/containers/Signin/SignUpForm/MainForm/Password';
import {
  classLine,
  clearClassAsk,
  isAskPass,
  leadClass,
  looksLikeBoardCode,
  pageTitleClass,
  type ClassJoinView
} from './shared';

type Step = 'username' | 'password' | 'name';
const STEPS: Step[] = ['username', 'password', 'name'];
const STEP_TITLES: Record<Step, string> = {
  username: 'What is your username going to be?',
  password: 'Set a password',
  name: 'What is your first name?'
};

// A class code's own page (/join/<link token or board code>): a phone camera
// that scanned the class QR code opens it, and so does a typed board code.
// Signed out, it is the whole sign-up: the teacher and class are already
// filled in, and a username, a password and a first name make the account.
// No sign-up question and no email (it can be added later in Settings).
export default function ClassJoinPage() {
  const { token = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const myUsername = useKeyContext((v) => v.myState.username);
  const sessionLoaded = useAppContext((v) => v.user.state.loaded);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const onSignup = useAppContext((v) => v.user.actions.onSignup);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const peekClassJoin = useAppContext((v) => v.requestHelpers.peekClassJoin);
  const signupWithClassCode = useAppContext(
    (v) => v.requestHelpers.signupWithClassCode
  );
  const recordClassroomEvent = useAppContext(
    (v) => v.requestHelpers.recordClassroomEvent
  );
  // how the code got here: a teacher's one-account pass ("Ask my teacher"),
  // its QR (the link carries ?s=qr), a typed board code, or the plain link
  const method = isAskPass(token)
    ? 'ask'
    : looksLikeBoardCode(token)
      ? 'code'
      : searchParams.get('s') === 'qr'
        ? 'qr'
        : 'link';
  const [join, setJoin] = useState<ClassJoinView | null | undefined>(undefined);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [password, setPassword] = useState('');
  const [reenteredPassword, setReenteredPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const [error, setError] = useState('');
  // the page was opened signed out: after the sign-up it must not flip to
  // the "already signed in" screen
  const joinedRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!sessionLoaded) return;
    let cancelled = false;
    peekClassJoin({ joinKey: token, method })
      .then((data: any) => {
        if (!cancelled) setJoin(data?.join || null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setJoin(null);
        setLoadError(getErrorMessage(err, ''));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sessionLoaded]);

  useEffect(() => {
    if (!username || startedRef.current) return;
    startedRef.current = true;
    recordClassroomEvent({
      kind: 'signup_started',
      detail: method,
      joinKey: token
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const nextDisabled =
    (step === 'username' && !isUsernameAvailable) ||
    (step === 'password' &&
      (stringIsEmpty(password) || password !== reenteredPassword)) ||
    (step === 'name' && stringIsEmpty(firstname));
  const isLastStep = step === 'name';

  return (
    <ErrorBoundary componentPath="Classrooms/JoinPage">
      <main className={mainClass}>
        {join === undefined ? (
          <Loading />
        ) : !join ? (
          <>
            <QuestNote tone="warning">
              {loadError ||
                'That class code isn’t right. Check it with your teacher and try again.'}
            </QuestNote>
            <Link to="/" className={homeLinkClass}>
              Go to {SITE_NAME}
            </Link>
          </>
        ) : join.state === 'closed' ? (
          // a link or QR code that has ended: nothing about the class is sent
          <>
            <QuestNote tone="info">
              This class code has ended. Ask your teacher for a new one.
            </QuestNote>
            <Link to="/" className={homeLinkClass}>
              Go to {SITE_NAME}
            </Link>
          </>
        ) : (
          <>
            {join.teacherName && (
              <ProfilePic
                userId={0}
                profilePicUrl={join.teacherPicUrl || ''}
                size="7rem"
              />
            )}
            <h1 className={pageTitleClass}>Join {join.teacherName}’s class</h1>
            <p className={classLineClass}>
              {classLine(join.branchName, join.className)}
            </p>
            {userId && !joinedRef.current ? (
              <>
                <p className={leadClass}>
                  You’re logged in as <b>{myUsername}</b>. A class code makes a
                  new account, so there’s nothing to do here.
                </p>
                <Link to="/" className={homeLinkClass}>
                  Go to {SITE_NAME}
                </Link>
              </>
            ) : join.state !== 'open' ? (
              <QuestNote tone="info">
                {join.state === 'full'
                  ? 'This class is full. Ask your teacher for help.'
                  : 'This class code has ended. Ask your teacher to show a new one.'}
              </QuestNote>
            ) : (
              <div className={formClass}>
                <div className={stepTitleClass}>{STEP_TITLES[step]}</div>
                {step === 'username' && (
                  <Username
                    username={username}
                    isUsernameAvailable={isUsernameAvailable}
                    onSetIsUsernameAvailable={setIsUsernameAvailable}
                    onSetUsername={setUsername}
                  />
                )}
                {step === 'password' && (
                  <Password
                    password={password}
                    reenteredPassword={reenteredPassword}
                    onSetPassword={setPassword}
                    onSetReenteredPassword={setReenteredPassword}
                  />
                )}
                {step === 'name' && (
                  <Input
                    autoFocus
                    className={nameInputClass}
                    value={firstname}
                    maxLength={40}
                    placeholder="First name"
                    onChange={(text: string) => {
                      setError('');
                      setFirstname(text);
                    }}
                    onKeyDown={(event: React.KeyboardEvent) => {
                      if (event.key === 'Enter' && !nextDisabled) handleNext();
                    }}
                  />
                )}
                {error && <QuestNote tone="warning">{error}</QuestNote>}
                <div className={navRowClass}>
                  {step !== 'username' ? (
                    <Button
                      variant="ghost"
                      color="darkerGray"
                      disabled={signingUp}
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                  ) : (
                    <span />
                  )}
                  <GameCTAButton
                    variant={isLastStep ? 'success' : 'logoBlue'}
                    size="lg"
                    loading={signingUp}
                    disabled={nextDisabled}
                    onClick={handleNext}
                  >
                    {isLastStep ? 'Join class' : 'Next'}
                  </GameCTAButton>
                </div>
                <Button
                  variant="ghost"
                  color="darkGray"
                  onClick={() => onOpenSigninModal()}
                >
                  I already have an account
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </ErrorBoundary>
  );

  function handleBack() {
    setError('');
    setStep(STEPS[Math.max(0, STEPS.indexOf(step) - 1)]);
  }

  function handleNext() {
    setError('');
    if (isLastStep) return handleSignup();
    const next = STEPS[STEPS.indexOf(step) + 1];
    setStep(next);
    recordClassroomEvent({ kind: 'signup_step', detail: next, joinKey: token });
  }

  async function handleSignup() {
    if (signingUp) return;
    setSigningUp(true);
    try {
      const data = await signupWithClassCode({
        joinKey: token,
        method,
        username,
        firstname: firstname.trim(),
        password
      });
      joinedRef.current = true;
      // a teacher's pass is spent with this account
      if (method === 'ask') clearClassAsk();
      onSignup(data);
      onSetUserState({ userId: data.id, newState: data });
      setAnalyticsUser(data);
      trackEvent('sign_up', { method: 'class_code', user_type: 'student' });
      navigate('/');
    } catch (err) {
      const message = getErrorMessage(
        err,
        'That didn’t work. Please try again.'
      );
      setError(message);
      // a taken username sends them back to pick another
      if (/username/i.test(message)) {
        setIsUsernameAvailable(false);
        setStep('username');
      }
    } finally {
      setSigningUp(false);
    }
  }
}

const mainClass = css`
  max-width: 46rem;
  margin: 3rem auto;
  padding: 0 1.6rem 12rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  text-align: center;
  @media (max-width: ${mobileMaxWidth}) {
    margin-top: 2rem;
  }
`;
const classLineClass = css`
  margin: 0;
  font-size: 1.7rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
`;
const formClass = css`
  width: 100%;
  margin-top: 1rem;
  padding: 2rem 1.6rem;
  border: 1px solid var(--ui-border);
  border-radius: 1.4rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4rem;
  label {
    font-weight: bold;
  }
  input {
    margin-top: 0.5rem;
  }
`;
const stepTitleClass = css`
  font-size: 2rem;
  font-weight: 500;
  color: #333333;
`;
const nameInputClass = css`
  max-width: 28rem;
  text-align: center;
`;
const navRowClass = css`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;
const homeLinkClass = css`
  font-size: 1.5rem;
  font-weight: 700;
`;
