import React, { useEffect, useRef, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Input from '~/components/Texts/Input';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { socket } from '~/constants/sockets/api';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { priceTable } from '~/constants/defaultValues';
import { validateUsername, stringIsEmpty } from '~/helpers/stringHelpers';
import localize from '~/constants/localize';

const changeLabel = localize('change');
const notEnoughTwinkleCoinsLabel = localize('notEnoughTwinkleCoins');
const enterNewUsernameLabel = localize('enterNewUsername');
const usernameAvailableLabel = localize('usernameAvailable');
const usernameAlreadyTakenLabel = localize('usernameAlreadyTaken');

ChangeUsername.propTypes = {
  style: PropTypes.object
};

export default function ChangeUsername({
  style
}: {
  style?: React.CSSProperties;
}) {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const changeUsername = useAppContext((v) => v.requestHelpers.changeUsername);
  const checkIfUsernameExists = useAppContext(
    (v) => v.requestHelpers.checkIfUsernameExists
  );
  const { twinkleCoins, userId, banned } = useKeyContext((v) => v.myState);
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const timerRef: React.MutableRefObject<any> = useRef(null);
  const disabled = useMemo(() => {
    return !usernameAvailable || twinkleCoins < priceTable.username;
  }, [twinkleCoins, usernameAvailable]);

  useEffect(() => {
    setLoading(false);
    setUsernameAvailable(false);
    setErrorMessage('');
    clearTimeout(timerRef.current);
    if (!stringIsEmpty(newUsername)) {
      setLoading(true);
      timerRef.current = setTimeout(() => {
        handleUsernameInput(newUsername);
      }, 1000);
    }

    async function handleUsernameInput(username: string) {
      const { isValid, reason } = validateUsername(username);
      if (!isValid) {
        setErrorMessage(reason);
        setLoading(false);
      } else {
        const exists = await checkIfUsernameExists(username);
        if (exists) {
          setErrorMessage(usernameAlreadyTakenLabel);
        } else {
          if (twinkleCoins < priceTable.username) {
            setErrorMessage(notEnoughTwinkleCoinsLabel);
          } else {
            setErrorMessage('');
            setUsernameAvailable(true);
          }
        }
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newUsername]);

  return (
    <div style={style}>
      <div>
        <Input
          name="username-to-change-to"
          maxLength={20}
          placeholder={`${enterNewUsernameLabel}...`}
          onChange={setNewUsername}
          value={newUsername}
        />
      </div>
      <div
        style={{
          position: 'relative',
          marginTop: '0.5rem'
        }}
      >
        {loading && (
          <Loading style={{ position: 'absolute', height: 0, top: '2rem' }} />
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            color: usernameAvailable ? Color.green() : 'red',
            fontSize: '1.3rem',
            fontWeight: usernameAvailable ? 'bold' : 'normal'
          }}
        >
          {usernameAvailable ? usernameAvailableLabel : errorMessage}
        </div>
        <div
          style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}
        >
          <Button
            filled
            style={{ marginTop: '0.5rem' }}
            color="green"
            disabled={disabled || changing}
            onClick={handleChangeUsername}
          >
            {changeLabel}
            <div style={{ marginLeft: '0.7rem' }}>
              (<Icon icon={['far', 'badge-dollar']} />
              <span style={{ marginLeft: '0.3rem' }}>
                {priceTable.username}
              </span>
              )
            </div>
          </Button>
        </div>
      </div>
    </div>
  );

  async function handleChangeUsername() {
    if (banned?.posting) {
      return;
    }
    setChanging(true);
    const { coins, alreadyExists } = await changeUsername(newUsername);
    if (alreadyExists) {
      setUsernameAvailable(false);
      setErrorMessage(usernameAlreadyTakenLabel);
    } else {
      socket.emit('change_username', newUsername);
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      localStorage.setItem('username', newUsername);
      setNewUsername('');
    }
    setChanging(false);
  }
}
