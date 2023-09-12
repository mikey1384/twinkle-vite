import React, { useMemo, useState } from 'react';
import Input from '~/components/Texts/Input';
import localize from '~/constants/localize';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

const passwordLabel = localize('password');
const passwordsNeedToBeAtLeastLabel = localize('passwordsNeedToBeAtLeast');
const usernameLabel = localize('username');
const enterTheUsernameYouWishToUseLabel = localize(
  'enterTheUsernameYouWishToUse'
);
const setUpPasswordLabel = localize('setUpPassword');

export default function UsernamePassword({
  errorMessage,
  username,
  onSetUsername,
  onSetErrorMessage,
  submitDisabled,
  onSubmit
}: {
  errorMessage: string;
  username: string;
  onSetUsername: (username: string) => void;
  onSetErrorMessage: (errorMessage: string) => void;
  submitDisabled: boolean;
  onSubmit: () => void;
}) {
  const [password, setPassword] = useState('');
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
      <section>
        <label>{usernameLabel}</label>
        <Input
          value={username}
          hasError={
            errorMessage === 'username' || errorMessage === 'alreadyExists'
          }
          placeholder={enterTheUsernameYouWishToUseLabel}
          onChange={(text) => {
            onSetErrorMessage('');
            onSetUsername(text.trim());
          }}
          onKeyPress={(event: any) => {
            if (event.key === 'Enter' && !submitDisabled) {
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
      </section>
      <section>
        <label>{passwordLabel}</label>
        <Input
          value={password}
          hasError={errorMessage === 'password'}
          placeholder={setUpPasswordLabel}
          onChange={(text) => {
            onSetErrorMessage('');
            setPassword(text.trim());
          }}
          onKeyPress={(event: any) => {
            if (event.key === 'Enter' && !submitDisabled) {
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
