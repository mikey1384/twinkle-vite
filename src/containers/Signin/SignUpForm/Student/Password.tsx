import React, { useState } from 'react';
import Input from '~/components/Texts/Input';
import localize from '~/constants/localize';

const passwordLabel = localize('password');
const passwordsNeedToBeAtLeastLabel = localize('passwordsNeedToBeAtLeast');
const setUpPasswordLabel = localize('setUpPassword');

export default function Password({
  onSubmit
}: {
  username: string;
  onSetUsername: (username: string) => void;
  onSubmit: () => void;
}) {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <div>
      <section>
        <label>{passwordLabel}</label>
        <Input
          value={password}
          hasError={errorMessage === 'password'}
          placeholder={setUpPasswordLabel}
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
        {errorMessage === 'password' && (
          <p style={{ color: 'red' }}>{passwordsNeedToBeAtLeastLabel}</p>
        )}
      </section>
    </div>
  );
}
