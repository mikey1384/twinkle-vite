import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useToast } from '~/contexts/Toast';
import { useBlockActions } from '~/helpers/hooks/useBlockedUsers';
import { safetyHintClass, safetyTextClass } from './styles';

// Blocking and unblocking always go through this confirmation. Cancel has
// focus when it opens, so a stray Enter or tap never blocks anyone.
export default function BlockUserModal({
  user,
  mode,
  onHide,
  onDone
}: {
  user: { id: number; username: string };
  mode: 'block' | 'unblock';
  onHide: () => void;
  onDone?: () => void;
}) {
  const { blockUser, unblockUser } = useBlockActions();
  const showToast = useToast();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isBlock = mode === 'block';

  useEffect(() => {
    // After the modal mounts (its own focus pass runs at 50ms and keeps focus
    // already inside the dialog).
    const timer = setTimeout(
      () => cancelButtonRef.current?.focus({ preventScroll: true }),
      0
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <Modal
      modalKey="BlockUserModal"
      isOpen
      onClose={onHide}
      hasHeader
      title={isBlock ? `Block ${user.username}?` : `Unblock ${user.username}?`}
      size="sm"
      modalLevel={2}
      priority
      closeOnBackdropClick={!submitting}
      footer={
        <>
          <Button
            buttonRef={cancelButtonRef}
            variant="ghost"
            style={{ marginRight: '0.7rem' }}
            onClick={onHide}
          >
            Cancel
          </Button>
          <Button
            color={isBlock ? 'darkRed' : 'blue'}
            loading={submitting}
            disabled={submitting}
            onClick={handleConfirm}
          >
            {isBlock ? 'Block' : 'Unblock'}
          </Button>
        </>
      }
    >
      <div className={safetyTextClass}>
        {isBlock ? (
          <>
            <p style={{ margin: 0, fontWeight: 700 }}>
              They won’t be able to message you. You can unblock them any time.
            </p>
            <ul className={listClass}>
              <li>Your direct chat with them stops, both ways.</li>
              <li>Their messages in group chats are hidden for you.</li>
              <li>{user.username} isn’t told that you blocked them.</li>
            </ul>
          </>
        ) : (
          <p style={{ margin: 0, fontWeight: 700 }}>
            {user.username} will be able to message you again, and you’ll see
            their messages in group chats.
          </p>
        )}
        {error && (
          <p role="alert" className={safetyHintClass} style={{ color: '#b42318', fontWeight: 700 }}>
            {error}
          </p>
        )}
      </div>
    </Modal>
  );

  async function handleConfirm() {
    setSubmitting(true);
    setError('');
    try {
      if (isBlock) {
        await blockUser(user.id);
      } else {
        await unblockUser(user.id);
      }
      showToast({
        message: isBlock
          ? `You blocked ${user.username}.`
          : `You unblocked ${user.username}.`
      });
      onHide();
      onDone?.();
    } catch (confirmError: any) {
      setError(
        confirmError?.message && confirmError.status !== 500
          ? confirmError.message
          : 'That didn’t work. Please try again.'
      );
      setSubmitting(false);
    }
  }
}

const listClass = css`
  margin: 1.2rem 0 0;
  padding-left: 2rem;
  color: #52607a;
  font-size: 1.4rem;
  line-height: 1.5;
  li + li {
    margin-top: 0.4rem;
  }
`;
