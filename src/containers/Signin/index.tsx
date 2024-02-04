import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import RestoreAccount from './RestoreAccount';
import Main from './Main';
import ErrorBoundary from '~/components/ErrorBoundary';

Signin.propTypes = {
  onHide: PropTypes.func.isRequired
};
export default function Signin({ onHide }: { onHide: () => void }) {
  const [username, setUsername] = useState('');
  const [currentPage, setCurrentPage] = useState('main');
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

  return (
    <ErrorBoundary componentPath="Signin/index">
      <Modal
        onHide={onHide}
        closeWhenClickedOutside={!username}
        modalStyle={{
          marginTop: currentPage !== 'signUp' ? 'CALC(50vh - 25rem)' : 0
        }}
      >
        {currentPage === 'main' && (
          <Main
            onShowLoginForm={() => setCurrentPage('login')}
            onShowSignUpForm={() => setCurrentPage('signUp')}
            onShowForgotPasswordForm={() => setCurrentPage('restore')}
          />
        )}
        {currentPage === 'login' && (
          <LoginForm
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
            onHide={onHide}
          />
        )}
      </Modal>
    </ErrorBoundary>
  );
}
