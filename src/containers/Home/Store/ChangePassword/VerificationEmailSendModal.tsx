import React, { useMemo } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import CheckYourEmail from '~/components/CheckYourEmail';
import SelectEmail from '~/components/SelectEmail';
import AskForHelp from '~/components/AskForHelp';
import { useKeyContext } from '~/contexts';

export default function VerificationEmailSendModal({
  onHide
}: {
  onHide: () => void;
}) {
  const { email, verifiedEmail, userId, username } = useKeyContext(
    (v) => v.myState
  );
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const emailExists = useMemo(
    () => email || verifiedEmail,
    [email, verifiedEmail]
  );
  const headerTitle = useMemo(() => {
    if (emailExists) {
      return `Email confirmation`;
    } else {
      return `No email address found. Ask your Twinkle teacher for help.`;
    }
  }, [emailExists]);
  const viableEmail = email || verifiedEmail;

  return (
    <Modal modalOverModal onHide={onHide}>
      <header>{headerTitle}</header>
      <main>
        {emailExists ? (
          email && verifiedEmail && email !== verifiedEmail ? (
            <SelectEmail
              email={email}
              verifiedEmail={verifiedEmail}
              userId={userId}
              username={username}
            />
          ) : (
            <CheckYourEmail
              email={viableEmail}
              userId={userId}
              username={username}
            />
          )
        ) : (
          <AskForHelp />
        )}
      </main>
      <footer>
        <Button
          style={{ marginLeft: '1rem' }}
          color={doneColor}
          onClick={onHide}
        >
          OK
        </Button>
      </footer>
    </Modal>
  );
}
