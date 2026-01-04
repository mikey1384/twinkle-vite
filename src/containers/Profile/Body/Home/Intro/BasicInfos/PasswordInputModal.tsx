import React, { useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import { useAppContext, useKeyContext } from '~/contexts';
import { stringIsEmpty } from '~/helpers/stringHelpers';

export default function PasswordInputModal({
  onHide,
  onConfirm
}: {
  onHide: () => any;
  onConfirm: () => any;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const confirmPassword = useAppContext(
    (v) => v.requestHelpers.confirmPassword
  );

  return (
    <Modal isOpen size="sm" onClose={onHide} hasHeader={false} bodyPadding={0}>
      <LegacyModalLayout>
        <header>Enter Your Password</header>
        <main>
          <Input
            value={password}
            onChange={(text) => {
              setErrorMsg('');
              setPassword(text);
            }}
            placeholder="Enter your password"
            type="password"
            hasError={!!errorMsg}
            onKeyPress={(event: any) => {
              if (
                !stringIsEmpty(password) &&
                event.key === 'Enter' &&
                !errorMsg
              ) {
                handleConfirmPassword();
              }
            }}
          />
          {errorMsg ? (
            <span style={{ color: 'red', marginTop: '0.5rem' }}>
              {errorMsg}
            </span>
          ) : null}
        </main>
        <footer>
          <Button onClick={onHide} variant="ghost">
            Cancel
          </Button>
          <Button
            style={{ marginLeft: '1rem' }}
            color={doneColor}
            onClick={handleConfirmPassword}
          >
            Done
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );

  async function handleConfirmPassword() {
    const success = await confirmPassword(password);
    if (success) {
      onConfirm();
      onHide();
    } else {
      setErrorMsg('wrong password');
    }
  }
}
