import React, { useMemo, useState } from 'react';
import Input from '~/components/Texts/Input';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

export default function Username({
  username,
  onSetUsername,
  onSubmit
}: {
  username: string;
  onSetUsername: (username: string) => void;
  onSubmit: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState('');
  const usernameAlreadyExistsLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return '이미 사용중인 아이디입니다.';
    }
    return 'This username is already taken.';
  }, []);
  const usernameErrorMsgLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `"${username}" - 유효하지 않은 아이디입니다.${
        username.length < 3 ? ' 아이디는 3글자 이상이어야 합니다.' : ''
      }`;
    }
    return `${username} is not a valid username.${
      username.length < 3 ? ' Make sure it is at least 3 characters long.' : ''
    }`;
  }, [username]);

  return (
    <div>
      <section style={{ display: 'flex', justifyContent: 'center' }}>
        <div>
          <div>
            <label>Enter your username</label>
          </div>
          <Input
            value={username}
            style={{ width: 'auto' }}
            autoFocus
            hasError={
              errorMessage === 'username' || errorMessage === 'alreadyExists'
            }
            placeholder="Username..."
            onChange={(text) => {
              setErrorMessage('');
              onSetUsername(text.trim());
            }}
            onKeyPress={(event: any) => {
              if (event.key === 'Enter') {
                onSubmit();
              }
            }}
          />
          {errorMessage === 'alreadyExists' && (
            <p style={{ color: 'red' }}>{usernameAlreadyExistsLabel}</p>
          )}
          {errorMessage === 'username' && (
            <p style={{ color: 'red' }}>{usernameErrorMsgLabel}</p>
          )}
        </div>
      </section>
    </div>
  );
}
