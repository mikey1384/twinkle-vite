import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Input from '~/components/Texts/Input';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useNavigate } from 'react-router-dom';

PasswordForm.propTypes = {
  profilePicUrl: PropTypes.number,
  userId: PropTypes.number.isRequired,
  username: PropTypes.string.isRequired
};

export default function PasswordForm({ profilePicUrl, userId, username }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const onLogin = useAppContext((v) => v.user.actions.onLogin);
  const changePassword = useAppContext((v) => v.requestHelpers.changePassword);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  return (
    <div>
      <p>Please enter your new password</p>
      <div style={{ marginTop: '1rem' }}>
        <Input
          autoFocus
          value={password}
          placeholder="Enter your new Password"
          onChange={(text) => {
            setErrorMsg('');
            setPassword(text.trim());
          }}
          type="password"
        />
        {errorMsg && (
          <p
            style={{
              marginTop: '1rem',
              fontSize: '1.5rem',
              fontWeight: 'normal',
              color: 'red'
            }}
          >
            {errorMsg}
          </p>
        )}
      </div>
      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        <Button
          style={{ fontSize: '2rem' }}
          disabled={errorMsg || stringIsEmpty(password)}
          filled
          color="blue"
          onClick={handleSubmit}
        >
          Confirm
        </Button>
      </div>
    </div>
  );

  async function handleSubmit() {
    if (!isValidPassword(password)) {
      return setErrorMsg('Passwords need to be at least 5 characters long');
    }
    await changePassword({ userId, password });
    onLogin({ userId, username });
    onSetUserState({ userId, newState: { profilePicUrl, userId, username } });
    navigate('/');
  }

  function isValidPassword(password) {
    return password.length > 4 && !stringIsEmpty(password);
  }
}
