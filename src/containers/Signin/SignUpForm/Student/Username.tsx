import React, { useEffect, useMemo, useRef, useState } from 'react';
import Input from '~/components/Texts/Input';
import { isValidUsername, stringIsEmpty } from '~/helpers/stringHelpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useAppContext } from '~/contexts';
import localize from '~/constants/localize';

const usernameAlreadyTakenLabel = localize('usernameAlreadyTaken');
const isNotValidUsernameLabel = localize('isNotValidUsername');
const makeSure3CharLongLabel = localize('makeSure3CharLong');

export default function Username({
  isUsernameAvailable,
  username,
  onSetUsername,
  onSetIsUsernameAvailable,
  onSubmit
}: {
  isUsernameAvailable: boolean;
  username: string;
  onSetUsername: (username: string) => void;
  onSetIsUsernameAvailable: (value: boolean) => void;
  onSubmit: () => void;
}) {
  const checkIfUsernameExists = useAppContext(
    (v) => v.requestHelpers.checkIfUsernameExists
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef: React.MutableRefObject<any> = useRef(null);

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

  useEffect(() => {
    setLoading(false);
    onSetIsUsernameAvailable(false);
    setErrorMessage('');
    clearTimeout(timerRef.current);
    if (!stringIsEmpty(username)) {
      setLoading(true);
      timerRef.current = setTimeout(() => {
        handleUsernameInput(username);
      }, 1000);
    }
    async function handleUsernameInput(username: string) {
      if (!isValidUsername(username)) {
        setErrorMessage(
          `${username}${isNotValidUsernameLabel}.${
            username.length < 3 ? ` ${makeSure3CharLongLabel}.` : ''
          }`
        );
        setLoading(false);
      } else {
        const exists = await checkIfUsernameExists(username);
        if (exists) {
          setErrorMessage(usernameAlreadyTakenLabel);
        } else {
          setErrorMessage('');
          onSetIsUsernameAvailable(true);
        }
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
