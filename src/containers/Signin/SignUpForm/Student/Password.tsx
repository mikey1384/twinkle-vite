import React, { useState } from 'react';
import Input from '~/components/Texts/Input';

export default function Password({ onSubmit }: { onSubmit: () => void }) {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
            hasError={errorMessage === 'password'}
            placeholder="Password..."
            onChange={(text) => {
              setErrorMessage('');
              setPassword(text.trim());
            }}
            onKeyPress={(event: any) => {
              if (event.key === 'Enter') {
                onSubmit();
              }
            }}
            type="password"
          />
          <p style={{ marginTop: '1rem', fontSize: '1.3rem' }}>
            You MUST remember your password. Write it down somewhere!
          </p>
          {errorMessage === 'password' && (
            <p style={{ color: 'red' }}>
              Passwords need to be at least 5 characters long
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
