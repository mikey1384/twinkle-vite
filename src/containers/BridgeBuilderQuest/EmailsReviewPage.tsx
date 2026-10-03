import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { QuestNote } from './StepCard';
import { backLinkClass } from './pageStyles';

// /achievements/bridge-builder/emails (owner only): parent emails wait here
// until the owner has read them (and edited them if he wants). The review
// switch turns this off once the process is validated.
interface Draft {
  id: number;
  crewId: number;
  kind: string;
  to: string;
  subject: string;
  body: string;
  status: 'held' | 'sent' | 'discarded' | 'failed';
  createdAt: number;
  decidedAt: number;
}

export default function EmailsReviewPage() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadMeetupEmails = useAppContext((v) => v.requestHelpers.loadMeetupEmails);
  const sendMeetupEmail = useAppContext((v) => v.requestHelpers.sendMeetupEmail);
  const saveMeetupEmail = useAppContext((v) => v.requestHelpers.saveMeetupEmail);
  const discardMeetupEmail = useAppContext((v) => v.requestHelpers.discardMeetupEmail);
  const setMeetupEmailReview = useAppContext((v) => v.requestHelpers.setMeetupEmailReview);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [review, setReview] = useState(true);
  const [edits, setEdits] = useState<Record<number, { subject: string; body: string }>>({});
  const [busyId, setBusyId] = useState(0);
  const [error, setError] = useState('');

  function apply(data: { drafts: Draft[]; review: boolean }) {
    setDrafts(data.drafts);
    setReview(data.review);
  }

  useEffect(() => {
    if (!userId) return;
    loadMeetupEmails()
      .then(apply)
      .catch((err: any) => setError(err?.message || 'Could not load.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function run(id: number, work: () => Promise<any>) {
    setBusyId(id);
    setError('');
    try {
      apply(await work());
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setBusyId(0);
    }
  }

  if (!userId) return <HomeLoginPrompt />;
  const open = (drafts || []).filter((d) => d.status === 'held' || d.status === 'failed');
  const recent = (drafts || []).filter((d) => d.status === 'sent' || d.status === 'discarded');
  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest/EmailsReviewPage">
      <div
        className={css`
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          padding: 1.6rem 16px 12rem;
          font-size: 1.5rem;
          color: ${Color.darkerGray()};
        `}
      >
        <Link to="/achievements/bridge-builder" className={backLinkClass}>
          <Icon icon="arrow-left" /> Bridge Builder
        </Link>
        <h2 style={{ margin: '1.2rem 0 0.4rem', fontSize: '2.4rem', color: Color.black() }}>
          Parent emails to review
        </h2>
        <p style={{ margin: 0, color: Color.gray() }}>
          Nothing reaches a parent until you send it here. Edit the message if you want.
        </p>
        {drafts && (
          <label
            className={css`
              display: flex;
              gap: 0.8rem;
              align-items: center;
              margin-top: 1.2rem;
              font-weight: 700;
            `}
          >
            <input
              type="checkbox"
              checked={review}
              disabled={busyId === -1}
              onChange={(e) => {
                setBusyId(-1);
                setMeetupEmailReview(e.target.checked)
                  .then(apply)
                  .catch((err: any) => setError(err?.message || 'Could not change that.'))
                  .finally(() => setBusyId(0));
              }}
              style={{ width: '2rem', height: '2rem' }}
            />
            Review parent emails before they are sent
            {!review && (
              <span style={{ color: Color.orange() }}>(off: they go out right away)</span>
            )}
          </label>
        )}
        {error && (
          <div style={{ marginTop: '1.2rem' }}>
            <QuestNote tone="warning">{error}</QuestNote>
          </div>
        )}
        {!drafts && !error && <Loading />}
        {drafts && !open.length && (
          <p style={{ marginTop: '2rem', color: Color.gray() }}>Nothing is waiting.</p>
        )}
        {open.map((draft) => {
          const edit = edits[draft.id] || { subject: draft.subject, body: draft.body };
          const busy = busyId === draft.id;
          return (
            <section
              key={draft.id}
              className={css`
                margin-top: 1.6rem;
                padding: 1.4rem;
                border: 1px solid var(--ui-border);
                border-radius: 1.2rem;
                background: #fff;
              `}
            >
              <div style={{ fontSize: '1.3rem', color: Color.gray() }}>
                {draft.kind === 'brief' ? 'Meetup request' : 'Your reply to a parent'} · crew #
                {draft.crewId} ·{' '}
                <Link to={`/achievements/bridge-builder/crew/${draft.crewId}`}>open crew</Link>
                {draft.status === 'failed' && (
                  <b style={{ color: Color.red() }}> · last send failed</b>
                )}
              </div>
              <div style={{ margin: '0.6rem 0', fontWeight: 700 }}>To: {draft.to}</div>
              <input
                aria-label="Subject"
                value={edit.subject}
                maxLength={300}
                onChange={(e) =>
                  setEdits((v) => ({ ...v, [draft.id]: { ...edit, subject: e.target.value } }))
                }
                style={{ width: '100%', padding: '0.7rem 1rem', fontSize: '1.5rem' }}
              />
              <textarea
                aria-label="Message"
                value={edit.body}
                rows={14}
                onChange={(e) =>
                  setEdits((v) => ({ ...v, [draft.id]: { ...edit, body: e.target.value } }))
                }
                style={{
                  width: '100%',
                  marginTop: '0.8rem',
                  padding: '0.8rem 1rem',
                  fontSize: '1.4rem',
                  lineHeight: 1.5,
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
                <Button
                  color="logoBlue"
                  variant="solid"
                  loading={busy}
                  disabled={!!busyId}
                  onClick={() =>
                    run(draft.id, () => sendMeetupEmail({ id: draft.id, ...edit }))
                  }
                >
                  <Icon icon="paper-plane" />
                  <span style={{ marginLeft: '0.6rem' }}>Send to the parent</span>
                </Button>
                <Button
                  color="darkerGray"
                  disabled={!!busyId}
                  onClick={() => run(draft.id, () => saveMeetupEmail({ id: draft.id, ...edit }))}
                >
                  Save changes
                </Button>
                <Button
                  color="red"
                  variant="soft"
                  disabled={!!busyId}
                  onClick={() => run(draft.id, () => discardMeetupEmail(draft.id))}
                >
                  Discard
                </Button>
              </div>
              <p style={{ fontSize: '1.2rem', color: Color.gray(), marginBottom: 0 }}>
                {draft.body.includes('http')
                  ? 'Keep the link line: it is how the parent answers. '
                  : ''}
                An edited message is sent as plain paragraphs; an unedited one keeps its
                designed layout. Discarding a meetup request lets the student ask again.
              </p>
            </section>
          );
        })}
        {!!recent.length && (
          <div style={{ marginTop: '2.4rem' }}>
            <b>Recently handled</b>
            <ul style={{ margin: '0.6rem 0 0', paddingLeft: '1.8rem', fontSize: '1.3rem' }}>
              {recent.map((d) => (
                <li key={d.id}>
                  {d.status === 'sent' ? 'Sent' : 'Discarded'}: {d.subject} → {d.to}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
