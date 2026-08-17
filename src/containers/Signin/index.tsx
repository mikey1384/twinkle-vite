import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import RestoreAccount from './RestoreAccount';
import Main from './Main';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext } from '~/contexts';
import {
  hasRejectedAuthSessionMarker,
  readAuthToken
} from '~/helpers/userDataHelpers';

export default function Signin({ onHide }: { onHide: () => void }) {
  const sessionInterruption = useAppContext(
    (v) => v.user.state.sessionInterruption
  );
  const onLogout = useAppContext((v) => v.user.actions.onLogout);
  const requiresCredentialReentry =
    sessionInterruption?.code === 'session_token_invalid';
  const [username, setUsername] = useState('');
  const [currentPage, setCurrentPage] = useState(() =>
    requiresCredentialReentry ? 'login' : 'main'
  );
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [password, setPassword] = useState('');
  const [reenteredPassword, setReenteredPassword] = useState('');
  const [isPassphraseValid, setIsPassphraseValid] = useState(false);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [classLabel, setClassLabel] = useState('');
  const [branchName, setBranchName] = useState('');
  const [hasNameError, setHasNameError] = useState(false);
  const [hasEmailError, setHasEmailError] = useState(false);

  useEffect(() => {
    if (requiresCredentialReentry) setCurrentPage('login');
  }, [requiresCredentialReentry]);

  return (
    <ErrorBoundary componentPath="Signin/index">
      <Modal
        modalKey="Signin"
        isOpen
        onClose={handleModalClose}
        closeOnBackdropClick={!username}
        hasHeader={false}
        bodyPadding={0}
      >
        <LegacyModalLayout>
          {currentPage === 'main' && (
            <Main
              onShowLoginForm={() => setCurrentPage('login')}
              onShowSignUpForm={() => setCurrentPage('signUp')}
              onShowForgotPasswordForm={() => setCurrentPage('restore')}
            />
          )}
          {currentPage === 'login' && (
            <LoginForm
              sessionInterruption={
                requiresCredentialReentry ? sessionInterruption : null
              }
              username={username}
              onSetUsername={setUsername}
              onShowSignupForm={() => setCurrentPage('signUp')}
              onShowForgotPasswordForm={() => setCurrentPage('restore')}
            />
          )}
          {currentPage === 'signUp' && (
            <SignUpForm
              branchName={branchName}
              classLabel={classLabel}
              firstname={firstname}
              lastname={lastname}
              username={username}
              password={password}
              email={email}
              verifiedEmail={verifiedEmail}
              isPassphraseValid={isPassphraseValid}
              isUsernameAvailable={isUsernameAvailable}
              hasEmailError={hasEmailError}
              hasNameError={hasNameError}
              reenteredPassword={reenteredPassword}
              onSetBranchName={setBranchName}
              onSetClassLabel={setClassLabel}
              onSetFirstname={setFirstname}
              onSetLastname={setLastname}
              onSetEmail={setEmail}
              onSetVerifiedEmail={setVerifiedEmail}
              onSetHasEmailError={setHasEmailError}
              onSetHasNameError={setHasNameError}
              onSetIsPassphraseValid={setIsPassphraseValid}
              onSetIsUsernameAvailable={setIsUsernameAvailable}
              onSetPassword={setPassword}
              onSetReenteredPassword={setReenteredPassword}
              onSetUsername={setUsername}
              onShowLoginForm={() => setCurrentPage('login')}
            />
          )}
          {currentPage === 'restore' && (
            <RestoreAccount
              username={username}
              onShowLoginForm={() => setCurrentPage('login')}
              onHide={handleRestoreClose}
            />
          )}
        </LegacyModalLayout>
      </Modal>
    </ErrorBoundary>
  );

  function handleModalClose() {
    if (!sessionInterruption) {
      onHide();
      return;
    }
    // Closing recovery means continuing as a clean guest. Never let a late
    // close erase a newer login that another tab has already stored.
    if (hasRejectedAuthSessionMarker() || !readAuthToken().token) {
      onLogout();
    }
  }

  function handleRestoreClose() {
    handleModalClose();
  }
}
