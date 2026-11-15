import React, { useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { getErrorMessage } from '~/helpers/errorMessageHelpers';
import Input from '~/components/Texts/Input';
import { quietLinkClass } from './shared';

// On "I forgot my password", for an account with no email that is in a
// class: the student's teacher can hand them a one-time reset code (My
// classes > Reset password). The student types it here and chooses their own
// new password. Shown on every no-email account's screen without asking the
// server whether it is a class account (that would tell anyone which
// usernames are): a code only ever works for the account it was made for.
export default function ClassResetWithCode({ username }: { username: string }) {
  const redeemClassReset = useAppContext(
    (v) => v.requestHelpers.redeemClassReset
  );
  const onLogin = useAppContext((v) => v.user.actions.onLogin);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onCloseSigninModal = useAppContext(
    (v) => v.user.actions.onCloseSigninModal
  );
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!username) return null;

  if (!open) {
    return (
      <div className={boxClass}>
        <p className={textClass}>
          In a class? Your class teacher can give you a reset code.
        </p>
        <button
          type="button"
          className={quietLinkClass}
          style={{ fontSize: '1.6rem' }}
          onClick={() => setOpen(true)}
        >
          I have a reset code from my teacher
        </button>
      </div>
    );
  }

  const ready =
    code.replace(/[^A-Za-z0-9]/g, '').length === 8 && password.length >= 5;

  return (
    <form className={boxClass} onSubmit={handleSubmit}>
      <label className={labelClass} htmlFor="class-reset-code">
        Reset code
      </label>
      <Input
        id="class-reset-code"
        autoFocus
        className={codeInputClass}
        value={code}
        maxLength={12}
        placeholder="XXXX-XXXX"
        autoCapitalize="characters"
        onChange={(text: string) => {
          setError('');
          setCode(text.toUpperCase());
        }}
      />
      <label className={labelClass} htmlFor="class-reset-password">
        Your new password (5 characters or longer)
      </label>
      <Input
        id="class-reset-password"
        type="password"
        value={password}
        autoComplete="new-password"
        onChange={(text: string) => {
          setError('');
          setPassword(text.trim());
        }}
      />
      {error && <p className={errorClass}>{error}</p>}
      <Button
        color="blue"
        loading={busy}
        disabled={!ready}
        style={{ fontSize: '1.7rem', marginTop: '0.6rem' }}
        onClick={handleSubmit}
      >
        Set my new password
      </Button>
    </form>
  );

  async function handleSubmit(event?: React.SyntheticEvent) {
    event?.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    try {
      const {
        profilePicUrl,
        userId,
        username: name
      } = await redeemClassReset({ username, code, password });
      onLogin({ userId, username: name });
      onSetUserState({
        userId,
        newState: { profilePicUrl, userId, username: name }
      });
      onCloseSigninModal();
    } catch (err) {
      setError(getErrorMessage(err, 'That didn’t work. Please try again.'));
    } finally {
      setBusy(false);
    }
  }
}

const boxClass = css`
  margin-top: 2rem;
  width: 100%;
  max-width: 34rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  margin-left: auto;
  margin-right: auto;
`;
const textClass = css`
  margin: 0;
  font-size: 1.6rem;
  color: ${Color.darkerGray()};
`;
const labelClass = css`
  align-self: flex-start;
  font-size: 1.3rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
`;
const codeInputClass = css`
  text-align: center;
  font-family: 'Roboto Mono', ui-monospace, Menlo, monospace;
  letter-spacing: 0.12em;
`;
const errorClass = css`
  margin: 0;
  font-size: 1.4rem;
  color: red;
`;
