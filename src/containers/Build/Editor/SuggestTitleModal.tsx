import React, { useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Textarea from '~/components/Texts/Textarea';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';

const MAX_TITLE_LENGTH = 100;
const MAX_NOTE_LENGTH = 500;

// A teammate on their branch offers the owner a new name. Only the owner can
// rename the project, so this sends a card to their chat with a
// "Use this name" button; nothing changes until they press it.
export default function SuggestTitleModal({
  rootBuildId,
  branchBuildId,
  currentTitle,
  ownerUsername,
  onHide
}: {
  rootBuildId: number;
  branchBuildId: number;
  currentTitle: string;
  ownerUsername: string;
  onHide: () => void;
}) {
  const suggestBuildTitleToOwner = useAppContext(
    (v) => v.requestHelpers.suggestBuildTitleToOwner
  );
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const trimmedTitle = title.replace(/\s+/g, ' ').trim();
  const sameAsCurrent =
    trimmedTitle.length > 0 &&
    trimmedTitle === currentTitle.replace(/\s+/g, ' ').trim();
  const canSend =
    trimmedTitle.length > 0 &&
    trimmedTitle.length <= MAX_TITLE_LENGTH &&
    note.trim().length <= MAX_NOTE_LENGTH &&
    !sameAsCurrent;
  const owner = ownerUsername ? `@${ownerUsername}` : 'the owner';

  return (
    <Modal
      modalKey="SuggestTitleModal"
      isOpen
      onClose={onHide}
      title="Suggest a new name"
      size="md"
      footer={
        sent ? (
          <Button color="logoBlue" onClick={onHide}>
            Done
          </Button>
        ) : (
          <div>
            <Button
              variant="ghost"
              disabled={sending}
              onClick={onHide}
              style={{ marginRight: '0.7rem' }}
            >
              Cancel
            </Button>
            <Button
              color="logoBlue"
              loading={sending}
              disabled={!canSend}
              onClick={handleSend}
            >
              Send to {owner}
            </Button>
          </div>
        )
      }
    >
      {sent ? (
        <div className={sentClass}>
          <Icon icon="check" />
          <span>
            Sent! {owner} will see “{trimmedTitle}” in their chat and can use
            it with one tap.
          </span>
        </div>
      ) : (
        <div className={bodyClass}>
          <div className={introClass}>
            Only {owner} can rename this project. Your idea goes to their chat
            with a button to use it.
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Now</label>
            <div className={currentClass}>{currentTitle || 'Untitled'}</div>
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Your name idea</label>
            <Input
              autoFocus
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              onChange={setTitle}
              placeholder="A name that fits the app"
              style={{ width: '100%' }}
            />
            {sameAsCurrent ? (
              <div className={hintClass}>That's already the project name.</div>
            ) : null}
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Why this name? (optional)</label>
            <Textarea
              minRows={2}
              maxRows={5}
              value={note}
              maxLength={MAX_NOTE_LENGTH}
              placeholder="Tell them what you like about it"
              onChange={(event) => setNote(event.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          {error ? <div className={errorClass}>{error}</div> : null}
        </div>
      )}
    </Modal>
  );

  async function handleSend() {
    if (!canSend || sending) return;
    setSending(true);
    setError('');
    try {
      const result = await suggestBuildTitleToOwner({
        buildId: rootBuildId,
        contributionBuildId: branchBuildId,
        title: trimmedTitle,
        note: note.trim()
      });
      if (!result?.message) {
        throw new Error(result?.error || 'Could not send your name idea');
      }
      setSent(true);
    } catch (error: any) {
      setError(
        error?.response?.data?.error ||
          error?.message ||
          'Could not send your name idea'
      );
    } finally {
      setSending(false);
    }
  }
}

const bodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const introClass = css`
  font-size: 1.4rem;
  color: ${Color.darkGray()};
  line-height: 1.6;
`;

const fieldClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const labelClass = css`
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${Color.darkGray()};
`;

const currentClass = css`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
  overflow-wrap: anywhere;
`;

const hintClass = css`
  font-size: 1.2rem;
  color: ${Color.darkerGray()};
`;

const errorClass = css`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${Color.rose()};
`;

const sentClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${Color.green()};
  line-height: 1.5;
`;
