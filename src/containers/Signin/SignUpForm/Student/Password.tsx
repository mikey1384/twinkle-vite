import React, { useEffect, useState } from 'react';
import Input from '~/components/Texts/Input';
import { isValidPassword, stringIsEmpty } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';

export default function Password({
  password,
  reenteredPassword,
  onSetPassword,
  onSetReenteredPassword
}: {
  password: string;
  reenteredPassword: string;
  onSetPassword: (password: string) => void;
  onSetReenteredPassword: (password: string) => void;
}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [isPasswordMatch, setIsPasswordMatch] = useState(false);
  const [showReenterField, setShowReenterField] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReenterField(false);
      if (!stringIsEmpty(password)) {
        if (!isValidPassword(password)) {
          setErrorMessage('Passwords need to be at least 5 characters long');
          setShowReenterField(false);
        } else {
          setErrorMessage('');
          setShowReenterField(true);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [password]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrorMessage('');
      if (showReenterField && !stringIsEmpty(reenteredPassword)) {
        if (password === reenteredPassword) {
          setErrorMessage('');
          setIsPasswordMatch(true);
        } else {
          setErrorMessage('Passwords do not match');
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [showReenterField, password, reenteredPassword]);

  return (
    <div>
      <section style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div>
            <label>Password (5 characters or longer)</label>
          </div>
          <Input
            autoFocus
            value={password}
            style={{ width: 'auto', marginTop: '0.5rem' }}
            hasError={!!errorMessage}
            placeholder="Password..."
            onChange={(text) => {
              setErrorMessage('');
              onSetPassword(text.trim());
            }}
            type="password"
          />
          {showReenterField && (
            <div style={{ marginTop: '1rem' }}>
              <div>
                <label>Re-enter Password</label>
              </div>
              <Input
                value={reenteredPassword}
                style={{ width: 'auto', marginTop: '0.5rem' }}
                hasError={!!errorMessage}
                placeholder="Reenter password..."
                onChange={(text) => onSetReenteredPassword(text.trim())}
                type="password"
              />
            </div>
          )}
          {isPasswordMatch && (
            <p
              style={{
                marginTop: '1rem',
                color: Color.green(),
                fontWeight: 'bold'
              }}
            >
              Passwords match! You can move on to the next step.
            </p>
          )}
          {!errorMessage && !isPasswordMatch && (
            <p style={{ marginTop: '1rem', fontSize: '1.3rem' }}>
              You MUST remember your password. Write it down somewhere!
            </p>
          )}
          {errorMessage && (
            <p style={{ marginTop: '1rem', color: 'red' }}>{errorMessage}</p>
          )}
        </div>
      </section>
    </div>
  );
}
