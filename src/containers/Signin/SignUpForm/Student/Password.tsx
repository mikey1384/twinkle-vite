import React, { useEffect, useState } from 'react';
import Input from '~/components/Texts/Input';
import { isValidPassword, stringIsEmpty } from '~/helpers/stringHelpers';

export default function Password() {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!stringIsEmpty(password)) {
        if (!isValidPassword(password)) {
          setErrorMessage('Passwords need to be at least 5 characters long');
        } else {
          setErrorMessage('');
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [password]);

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
              setPassword(text.trim());
            }}
            type="password"
          />
          {!errorMessage && (
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
