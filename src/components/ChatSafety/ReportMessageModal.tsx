import React, { useEffect, useId, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import useBlockedUsers, { canBlockUser } from '~/helpers/hooks/useBlockedUsers';
import BlockUserModal from './BlockUserModal';
import {
  safetyFieldsetClass,
  safetyHintClass,
  safetyNoteClass,
  safetyOptionClass,
  safetyTextClass
} from './styles';

// Kept in sync with CHAT_REPORT_REASONS in twinkle-api
// controllers/chat/model/messageReports.ts.
export const CHAT_REPORT_REASON_OPTIONS = [
  {
    value: 'harassment',
    label: 'Bullying or harassment',
    hint: 'Mean, threatening or hurtful messages'
  },
  {
    value: 'sexual',
    label: 'Sexual content',
    hint: 'Sexual words, pictures or requests'
  },
  {
    value: 'personal_info',
    label: 'Asking for personal info',
    hint: 'Your address, school, phone number, photos or passwords'
  },
  {
    value: 'spam',
    label: 'Spam or scam',
    hint: 'Tricks, fake offers or the same message over and over'
  },
  { value: 'other', label: 'Something else', hint: 'Tell us in the note' }
] as const;

const NOTE_MAX_LENGTH = 500;
const RECEIVED_MESSAGE = 'Thanks. Our team will look at this.';

export default function ReportMessageModal({
  messageId,
  reportedUser,
  onHide
}: {
  messageId: number;
  reportedUser: { id: number; username: string };
  onHide: () => void;
}) {
  const reportChatMessage = useAppContext(
    (v) => v.requestHelpers.reportChatMessage
  );
  const myId = Number(useKeyContext((v) => v.myState.userId) || 0);
  const blockList = useBlockedUsers();
  const groupName = useId();
  const noteId = useId();
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [blockModalShown, setBlockModalShown] = useState(false);
  const canOfferBlock =
    canBlockUser(blockList, reportedUser.id, myId) &&
    blockList.status === 'loaded' &&
    !blockList.blockedIds.has(reportedUser.id);

  useEffect(() => {
    if (sent) doneButtonRef.current?.focus({ preventScroll: true });
  }, [sent]);

  return (
    <>
      <Modal
        modalKey="ReportMessageModal"
        isOpen={!blockModalShown}
        onClose={onHide}
        hasHeader
        title={sent ? 'Report sent' : 'Report this message'}
        size="sm"
        closeOnBackdropClick={!submitting}
        footer={
          sent ? (
            <>
              {canOfferBlock && (
                <Button
                  variant="ghost"
                  color="darkRed"
                  style={{ marginRight: '0.7rem' }}
                  onClick={() => setBlockModalShown(true)}
                >
                  <Icon icon="ban" />
                  <span style={{ marginLeft: '0.7rem' }}>
                    Block {reportedUser.username}
                  </span>
                </Button>
              )}
              <Button buttonRef={doneButtonRef} color="blue" onClick={onHide}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                style={{ marginRight: '0.7rem' }}
                onClick={onHide}
              >
                Cancel
              </Button>
              <Button
                color="darkRed"
                disabled={!reason || submitting}
                loading={submitting}
                onClick={handleSubmit}
              >
                Send report
              </Button>
            </>
          )
        }
      >
        {sent ? (
          <div role="status" className={safetyTextClass}>
            <p style={{ margin: 0, fontWeight: 700 }}>{RECEIVED_MESSAGE}</p>
            <p className={safetyHintClass} style={{ marginTop: '0.8rem' }}>
              {reportedUser.username} won’t be told who reported them.
            </p>
          </div>
        ) : (
          <form
            className={safetyTextClass}
            onSubmit={(event) => {
              event.preventDefault();
              if (reason && !submitting) handleSubmit();
            }}
          >
            <fieldset className={safetyFieldsetClass}>
              <legend>What’s wrong with this message?</legend>
              {CHAT_REPORT_REASON_OPTIONS.map((option) => (
                <label key={option.value} className={safetyOptionClass}>
                  <input
                    type="radio"
                    name={groupName}
                    value={option.value}
                    checked={reason === option.value}
                    onChange={() => {
                      setReason(option.value);
                      setError('');
                    }}
                  />
                  <span>
                    <span className="label">{option.label}</span>
                    <span className="hint">{option.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <label htmlFor={noteId} className={safetyNoteClass}>
              Add a note (optional)
            </label>
            <textarea
              id={noteId}
              className={textareaClass}
              value={note}
              maxLength={NOTE_MAX_LENGTH}
              rows={3}
              placeholder="Anything else we should know?"
              onChange={(event) => setNote(event.target.value)}
            />
            <p className={safetyHintClass}>
              {reportedUser.username} won’t be told who reported them.
            </p>
            {error && (
              <p role="alert" className={errorClass}>
                {error}
              </p>
            )}
          </form>
        )}
      </Modal>
      {blockModalShown && (
        <BlockUserModal
          user={reportedUser}
          mode="block"
          onHide={() => setBlockModalShown(false)}
          onDone={onHide}
        />
      )}
    </>
  );

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    setError('');
    try {
      await reportChatMessage({
        messageId,
        reason,
        note: note.trim() || undefined
      });
      setSent(true);
    } catch (submitError: any) {
      setError(
        submitError?.message && submitError.status !== 500
          ? submitError.message
          : 'The report couldn’t be sent. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }
}

const textareaClass = css`
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-top: 0.6rem;
  padding: 1rem 1.2rem;
  border: 1px solid var(--ui-border, #cbd5e1);
  border-radius: 8px;
  font: inherit;
  font-size: 1.5rem;
  line-height: 1.45;
  resize: vertical;
  &:focus-visible {
    outline: 2px solid #334155;
    outline-offset: 1px;
  }
`;

const errorClass = css`
  margin: 1rem 0 0;
  color: #b42318;
  font-size: 1.4rem;
  font-weight: 700;
`;
