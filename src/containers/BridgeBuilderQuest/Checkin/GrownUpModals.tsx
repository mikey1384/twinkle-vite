import React, { useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import {
  questHelpClass,
  questInputClass,
  questLabelClass,
  QuestNote
} from '../StepCard';
import LiveCode from './LiveCode';

// A Twinkle teacher is the grown-up: their screen shows a code the kids scan.
// It stays open for 3 hours (or until "End"); the list shows who scanned in.
export function TeacherWitnessModal({ onHide }: { onHide: () => void }) {
  const startMeetupWitness = useAppContext(
    (v) => v.requestHelpers.startMeetupWitness
  );
  const endMeetupWitness = useAppContext(
    (v) => v.requestHelpers.endMeetupWitness
  );
  const [kids, setKids] = useState<{ userId: number; username: string }[]>([]);
  const [ending, setEnding] = useState(false);
  return (
    <Modal
      modalKey="BridgeBuilderTeacherWitnessModal"
      isOpen
      onClose={onHide}
      hasHeader
      title="Be the grown-up"
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onHide}
            style={{ marginRight: '0.7rem' }}
          >
            Close
          </Button>
          <Button
            color="darkGray"
            variant="soft"
            loading={ending}
            onClick={handleEnd}
          >
            End the meetup
          </Button>
        </>
      }
    >
      <div className={columnClass}>
        <p className={leadClass}>
          Each kid at the meetup scans this code with their own phone. With two
          or more, everyone who scanned can qualify for Bridge Builder after
          Mikey reviews the meetup.
        </p>
        <p className={leadClass}>
          Using this academy’s Wi-Fi or your phone’s hotspot helps confirm that
          everyone is together.
        </p>
        {/* no sound check: for a grown-up's meetup only the network counts */}
        <LiveCode
          chirp={false}
          load={startMeetupWitness}
          onLoaded={(data) =>
            setKids(Array.isArray(data?.kids) ? data.kids : [])
          }
        />
        <div
          className={css`
            font-size: 1.6rem;
            font-weight: bold;
            color: ${Color.black()};
          `}
        >
          {kids.length} {kids.length === 1 ? 'kid' : 'kids'} checked in
        </div>
        {kids.length > 0 && (
          <div
            className={css`
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 0.5rem;
            `}
          >
            {kids.map((kid) => (
              <span
                key={kid.userId}
                className={css`
                  padding: 0.3rem 0.9rem;
                  border-radius: 1rem;
                  font-size: 1.3rem;
                  background: ${Color.green(0.12)};
                  color: ${Color.darkerGray()};
                `}
              >
                {kid.username}
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );

  async function handleEnd() {
    setEnding(true);
    try {
      await endMeetupWitness();
    } finally {
      setEnding(false);
      onHide();
    }
  }
}

// A kid asks a parent to be the grown-up: an email with a link the parent
// opens at the meetup. The address on file (from sign-up) is used when there
// is one; Twinkle reads every parent email before it goes out.
export function ParentInviteModal({
  onHide,
  hasInvitation = false
}: {
  onHide: () => void;
  hasInvitation?: boolean;
}) {
  const inviteParentToWitness = useAppContext(
    (v) => v.requestHelpers.inviteParentToWitness
  );
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<{ toMasked: string; held: boolean } | null>(
    null
  );
  return (
    <Modal
      modalKey="BridgeBuilderParentInviteModal"
      isOpen
      onClose={onHide}
      hasHeader
      title="Invite my parent"
      size="sm"
      footer={
        sent ? (
          <Button color="logoBlue" onClick={onHide}>
            OK
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={onHide}
              style={{ marginRight: '0.7rem' }}
            >
              Cancel
            </Button>
            <Button color="logoBlue" loading={busy} onClick={handleSend}>
              Send
            </Button>
          </>
        )
      }
    >
      <div
        className={columnClass}
        style={{ alignItems: 'stretch', textAlign: 'left' }}
      >
        {sent ? (
          <QuestNote tone="success">
            {sent.held
              ? `Waiting for Mikey to review the email to ${sent.toMasked} before it is sent.`
              : `Sent to ${sent.toMasked}.`}{' '}
            You can follow its status on your Bridge Builder page. When you
            meet, your parent opens the email and presses “We’re together” /
            “함께 있어요”. Each child scans the code from their own account.
            Mikey then reviews the meetup.
          </QuestNote>
        ) : (
          <>
            <p className={leadClass} style={{ textAlign: 'left' }}>
              Your parent gets a link. When you meet your friends, they open it
              and press “We’re together”. Everyone scans their code, then Mikey
              reviews the meetup for Bridge Builder.
            </p>
            {hasInvitation && (
              <QuestNote tone="info">
                A new invitation replaces your previous parent link. You don’t
                need another request if you’re waiting for review.
              </QuestNote>
            )}
            <div>
              <label className={questLabelClass} htmlFor="bridge-parent-email">
                Your parent’s email
              </label>
              <input
                id="bridge-parent-email"
                type="email"
                className={questInputClass}
                value={email}
                placeholder="parent@example.com"
                onChange={(event) => setEmail(event.target.value)}
              />
              <div className={questHelpClass}>
                If your parent approved your sign-up, leave it empty: we use
                that address.
              </div>
            </div>
            <div
              className={css`
                display: flex;
                gap: 0.6rem;
              `}
            >
              {(['ko', 'en'] as const).map((lang) => (
                <Button
                  key={lang}
                  size="sm"
                  variant={language === lang ? 'solid' : 'soft'}
                  color="logoBlue"
                  onClick={() => setLanguage(lang)}
                >
                  {lang === 'ko' ? '한국어 email' : 'English email'}
                </Button>
              ))}
            </div>
            {error && <QuestNote tone="warning">{error}</QuestNote>}
          </>
        )}
      </div>
    </Modal>
  );

  async function handleSend() {
    setBusy(true);
    setError('');
    try {
      const result = await inviteParentToWitness({
        email: email.trim() || undefined,
        language
      });
      setSent({ toMasked: result.toMasked, held: !!result.held });
    } catch (err: any) {
      setError(err?.message || 'Could not send it. Please try again.');
    } finally {
      setBusy(false);
    }
  }
}

const columnClass = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4rem;
  text-align: center;
`;

const leadClass = css`
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
`;
