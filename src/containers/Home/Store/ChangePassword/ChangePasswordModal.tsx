import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import localize from '~/constants/localize';
import VerificationEmailSendModal from './VerificationEmailSendModal';
import { css } from '@emotion/css';
import { isValidPassword, stringIsEmpty } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';

const currentPasswordLabel = localize('currentPassword');
const enterCurrentPasswordLabel = localize('enterCurrentPassword');
const enterNewPasswordLabel = localize('enterNewPassword');
const iForgotMyPasswordLabel = localize('iForgotMyPassword');
const newPasswordLabel = localize('newPassword');
const passwordsNeedToBeAtLeastLabel = localize('passwordsNeedToBeAtLeast');
const incorrectPasswordLabel = localize('incorrectPassword');
const retypeNewPasswordLabel = localize('retypeNewPassword');
const retypePasswordDoesNotMatchLabel = localize('retypePasswordDoesNotMatch');

export default function ChangePasswordModal({
  onHide
}: {
  onHide: () => void;
}) {
  const {
    done: { color: doneColor },
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
  const changePasswordFromStore = useAppContext(
    (v) => v.requestHelpers.changePasswordFromStore
  );
  const checkIfPasswordMatches = useAppContext(
    (v) => v.requestHelpers.checkIfPasswordMatches
  );
  const [success, setSuccess] = useState(false);
  const [changing, setChanging] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [retypeNewPassword, setRetypeNewPassword] = useState('');
  const [verificationEmailSendModalShown, setVerificationEmailSendModalShown] =
    useState(false);
  const [errorMsgObj, setErrorMsgObj] = useState<{
    currentPassword?: string;
    newPassword?: string;
    retypeNewPassword?: string;
  }>({
    currentPassword: '',
    newPassword: ''
  });
  const newPasswordTimerRef: React.MutableRefObject<any> = useRef(null);
  const retypeNewPasswordTimerRef: React.MutableRefObject<any> = useRef(null);
  const passwordIsValid = useMemo(() => {
    return isValidPassword(newPassword);
  }, [newPassword]);
  const newPasswordIsTheSameAsTheCurrentOne = useMemo(() => {
    if (stringIsEmpty(newPassword) || stringIsEmpty(currentPassword)) {
      return false;
    }
    return newPassword === currentPassword;
  }, [currentPassword, newPassword]);
  const retypePasswordMatches = useMemo(() => {
    if (stringIsEmpty(newPassword) || stringIsEmpty(retypeNewPassword)) {
      return false;
    }
    return newPassword === retypeNewPassword;
  }, [newPassword, retypeNewPassword]);

  const submitDisabled = useMemo(() => {
    if (!currentPasswordVerified) {
      return stringIsEmpty(currentPassword);
    }
    return (
      !retypePasswordMatches || newPasswordIsTheSameAsTheCurrentOne || changing
    );
  }, [
    currentPassword,
    currentPasswordVerified,
    newPasswordIsTheSameAsTheCurrentOne,
    retypePasswordMatches,
    changing
  ]);

  useEffect(() => {
    clearTimeout(newPasswordTimerRef.current);
    newPasswordTimerRef.current = setTimeout(() => {
      if (!stringIsEmpty(newPassword) && !passwordIsValid) {
        setErrorMsgObj((obj) => ({
          ...obj,
          newPassword: passwordsNeedToBeAtLeastLabel
        }));
      }
    }, 500);
  }, [newPassword, passwordIsValid]);

  useEffect(() => {
    if (newPasswordIsTheSameAsTheCurrentOne) {
      setErrorMsgObj((obj) => ({
        ...obj,
        newPassword: 'Your new password is the same as your current one'
      }));
    }
  }, [newPasswordIsTheSameAsTheCurrentOne]);

  useEffect(() => {
    clearTimeout(retypeNewPasswordTimerRef.current);
    retypeNewPasswordTimerRef.current = setTimeout(() => {
      if (!stringIsEmpty(retypeNewPassword) && !retypePasswordMatches) {
        setErrorMsgObj((obj) => ({
          ...obj,
          retypeNewPassword: retypePasswordDoesNotMatchLabel
        }));
      }
    }, 500);
  }, [retypeNewPassword, retypePasswordMatches]);

  return (
    <Modal closeWhenClickedOutside={false} small onHide={onHide}>
      <header>Change Your Password</header>
      <main>
        <div
          className={css`
            label {
              font-weight: bold;
            }
            span {
              font-size: 1.3rem;
            }
          `}
          style={{ width: '100%' }}
        >
          <div>
            <label>{currentPasswordLabel}</label>
            <Input
              name="current-password"
              value={currentPassword}
              style={{ marginTop: '0.5rem' }}
              onChange={(text) => {
                setErrorMsgObj((obj) => ({
                  ...obj,
                  currentPassword: ''
                }));
                setCurrentPassword(text);
              }}
              placeholder={enterCurrentPasswordLabel}
              type="password"
              hasError={!!errorMsgObj.currentPassword}
              onKeyPress={async (event: any) => {
                if (event.key === 'Enter' && !stringIsEmpty(currentPassword)) {
                  await handleVerifyCurrentPassword();
                }
              }}
            />
            {errorMsgObj.currentPassword ? (
              <span style={{ color: 'red', marginTop: '0.5rem' }}>
                {errorMsgObj.currentPassword}
              </span>
            ) : null}
            <div
              style={{
                marginTop: '0.5rem',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <span
                style={{
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: Color[linkColor]()
                }}
                className={css`
                  &:hover {
                    text-decoration: underline;
                  }
                `}
                onClick={() => setVerificationEmailSendModalShown(true)}
              >
                {iForgotMyPasswordLabel}...
              </span>
            </div>
          </div>
          {currentPasswordVerified && (
            <>
              <div style={{ marginTop: '2rem' }}>
                <label>{newPasswordLabel}</label>
                <Input
                  name="new-password"
                  value={newPassword}
                  style={{ marginTop: '0.5rem' }}
                  onChange={(text) => {
                    setErrorMsgObj((obj) => ({
                      ...obj,
                      newPassword: ''
                    }));
                    setNewPassword(text);
                  }}
                  placeholder={enterNewPasswordLabel}
                  type="password"
                  hasError={!!errorMsgObj.newPassword}
                />
                {errorMsgObj.newPassword ? (
                  <span style={{ color: 'red', marginTop: '0.5rem' }}>
                    {errorMsgObj.newPassword}
                  </span>
                ) : null}
              </div>
              {passwordIsValid && (
                <div style={{ marginTop: '1.5rem' }}>
                  <label>{retypeNewPasswordLabel}</label>
                  <Input
                    name="retype-new-password"
                    value={retypeNewPassword}
                    style={{ marginTop: '0.5rem' }}
                    onChange={(text) => {
                      setErrorMsgObj((obj) => ({
                        ...obj,
                        retypeNewPassword: ''
                      }));
                      setRetypeNewPassword(text);
                    }}
                    placeholder={retypeNewPasswordLabel}
                    type="password"
                    hasError={!!errorMsgObj.retypeNewPassword}
                  />
                  {errorMsgObj.retypeNewPassword ? (
                    <span style={{ color: 'red', marginTop: '0.5rem' }}>
                      {errorMsgObj.retypeNewPassword}
                    </span>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <footer>
        <Button onClick={onHide} transparent>
          Close
        </Button>
        <Button
          style={{ marginLeft: '1rem' }}
          color={success ? 'green' : doneColor}
          onClick={
            currentPasswordVerified ? handleSubmit : handleVerifyCurrentPassword
          }
          disabled={submitDisabled}
        >
          {success ? 'Success!' : currentPasswordVerified ? 'Change' : 'Verify'}
        </Button>
      </footer>
      {verificationEmailSendModalShown && (
        <VerificationEmailSendModal
          onHide={() => setVerificationEmailSendModalShown(false)}
        />
      )}
    </Modal>
  );

  async function handleVerifyCurrentPassword() {
    try {
      const passwordMatches = await checkIfPasswordMatches(currentPassword);
      if (passwordMatches) {
        setCurrentPasswordVerified(true);
      } else {
        setErrorMsgObj((obj) => ({
          ...obj,
          currentPassword: incorrectPasswordLabel
        }));
      }
    } catch (error) {
      console.error(error);
      setErrorMsgObj((obj) => ({
        ...obj,
        currentPassword:
          'An error occurred while verifying your password. Please try again.'
      }));
    }
  }

  async function handleSubmit() {
    setChanging(true);
    try {
      const { isSuccess } = await changePasswordFromStore({
        currentPassword,
        newPassword
      });
      if (isSuccess) {
        setSuccess(true);
        setTimeout(() => {
          onHide();
        }, 1300);
      } else {
        setErrorMsgObj((obj) => ({
          ...obj,
          currentPassword: incorrectPasswordLabel
        }));
        setChanging(false);
      }
    } catch (error) {
      console.error(error);
    }
  }
}
