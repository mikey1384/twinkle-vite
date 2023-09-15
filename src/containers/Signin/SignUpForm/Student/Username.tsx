import React, { useEffect, useRef, useState } from 'react';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import { isValidUsername, stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import localize from '~/constants/localize';

const usernameAlreadyTakenLabel = localize('usernameAlreadyTaken');
const isNotValidUsernameLabel = localize('isNotValidUsername');
const makeSure3CharLongLabel = localize('makeSure3CharLong');

export default function Username({
  username,
  isUsernameAvailable,
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
          {isUsernameAvailable && (
            <div style={{ display: 'inline-block' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon
                  style={{ marginLeft: '1rem', color: Color.green() }}
                  icon="check-circle"
                />
                <span style={{ marginLeft: '0.7rem' }}>available!</span>
              </div>
            </div>
          )}
          {loading && (
            <Icon
              style={{ marginLeft: '1rem', color: Color.logoBlue() }}
              icon="spinner"
              pulse
            />
          )}
          {errorMessage && (
            <p style={{ color: 'red', marginTop: '0.5rem' }}>{errorMessage}</p>
          )}
        </div>
      </section>
    </div>
  );
}
