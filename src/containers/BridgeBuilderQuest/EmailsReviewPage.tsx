import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoggedOutPrompt from '~/components/LoggedOutPrompt';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { QuestNote } from './StepCard';
import { backLinkClass } from './pageStyles';
import usePendingAction from '~/helpers/hooks/usePendingAction';

// /achievements/bridge-builder/emails (owner only): parent emails wait here
// until the owner has read them (and edited them if he wants). The review
// switch turns this off once the process is validated.
interface Draft {
  id: number;
  crewId: number;
  kind: string;
  childUserId?: number;
  childUsername?: string;
  addressSource?: string;
  to: string;
  subject: string;
  body: string;
  revision?: string;
  verificationChanged?: boolean;
  suggestedBody?: string;
  status: 'held' | 'sent' | 'discarded' | 'failed';
  createdAt: number;
  decidedAt: number;
}

export default function EmailsReviewPage() {
  const { pendingAction, runAction } = usePendingAction();
  const userId = useKeyContext((v) => v.myState.userId);
  const loadMeetupEmails = useAppContext(
    (v) => v.requestHelpers.loadMeetupEmails
  );
  const sendMeetupEmail = useAppContext(
    (v) => v.requestHelpers.sendMeetupEmail
  );
  const saveMeetupEmail = useAppContext(
    (v) => v.requestHelpers.saveMeetupEmail
  );
  const discardMeetupEmail = useAppContext(
    (v) => v.requestHelpers.discardMeetupEmail
  );
  const setMeetupEmailReview = useAppContext(
    (v) => v.requestHelpers.setMeetupEmailReview
  );
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [review, setReview] = useState(true);
  const [edits, setEdits] = useState<
    Record<number, { subject: string; body: string; revision?: string }>
  >({});
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

  function run(id: number, kind: string, work: () => Promise<any>) {
    return runAction(`${kind}:${id}`, () => runRequest(id, work));
  }

  async function runRequest(id: number, work: () => Promise<any>) {
    setBusyId(id);
    setError('');
    try {
      apply(await work());
      setEdits((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
      await loadMeetupEmails()
        .then(apply)
        .catch(() => {});
    } finally {
      setBusyId(0);
    }
  }

  if (!userId) return <LoggedOutPrompt />;
  const open = (drafts || []).filter(
    (d) => d.status === 'held' || d.status === 'failed'
  );
  const recent = (drafts || []).filter(
    (d) => d.status === 'sent' || d.status === 'discarded'
  );
  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest/EmailsReviewPage">
      <div
        className={css`
          width: 100%;
          max-width: calc(760 * var(--px));
          margin: 0 auto;
          padding: 1.6rem 16px 12rem;
          font-size: 1.5rem;
          color: ${Color.darkerGray()};
        `}
      >
        <Link to="/achievements/bridge-builder" className={backLinkClass}>
          <Icon icon="arrow-left" /> Bridge Builder
        </Link>
        <h2
          style={{
            margin: '1.2rem 0 0.4rem',
            fontSize: '2.4rem',
            color: Color.black()
          }}
        >
          Parent emails to review
        </h2>
        <p style={{ margin: 0, color: Color.gray() }}>
          Review and edit queued parent emails before sending them.
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
                  .catch((err: any) =>
                    setError(err?.message || 'Could not change that.')
                  )
                  .finally(() => setBusyId(0));
              }}
              style={{ width: '2rem', height: '2rem' }}
            />
            Review parent emails before they are sent
            {!review && (
              <span style={{ color: Color.orange() }}>
                (off: they go out right away, except requests to verify a new
                parent address or invite a new grown-up)
              </span>
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
          <p style={{ marginTop: '2rem', color: Color.gray() }}>
            Nothing is waiting.
          </p>
        )}
        {open.map((draft) => {
          const edit = edits[draft.id] || {
            subject: draft.subject,
            body: draft.body,
            revision: draft.revision
          };
          const staleEdits =
            !!edits[draft.id] && edit.revision !== draft.revision;
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
                {draft.kind === 'witness' || draft.kind === 'arena' ? (
                  <>
                    {draft.kind === 'arena'
                      ? 'Arena mock-exam result to a parent from'
                      : 'Grown-up request from'}{' '}
                    {draft.childUsername ? (
                      <Link to={`/users/${draft.childUsername}`}>
                        {draft.childUsername}
                      </Link>
                    ) : (
                      `member #${draft.childUserId}`
                    )}{' '}
                    ·{' '}
                    {draft.addressSource === 'added' ? (
                      <b style={{ color: Color.orange() }}>
                        the child typed this address
                      </b>
                    ) : draft.addressSource === 'guardian' ? (
                      'guardian from the sign-up consent'
                    ) : (
                      'a verified parent address'
                    )}
                  </>
                ) : (
                  <>
                    {draft.kind === 'brief'
                      ? 'Meetup request'
                      : 'Your reply to a parent'}{' '}
                    · crew #{draft.crewId} ·{' '}
                    <Link
                      to={`/achievements/bridge-builder/crew/${draft.crewId}`}
                    >
                      open crew
                    </Link>
                  </>
                )}
                {draft.status === 'failed' && (
                  <b style={{ color: Color.red() }}> · last send failed</b>
                )}
              </div>
              <div style={{ margin: '0.6rem 0', fontWeight: 700 }}>
                To: {draft.to}
              </div>
              {(draft.verificationChanged || staleEdits) && (
                <div style={{ margin: '1rem 0' }}>
                  <QuestNote tone="warning">
                    {staleEdits
                      ? 'This draft changed while you were editing. Your edits are still here. Review the latest message before sending.'
                      : 'This parent address is now verified. Your edits are preserved; check for any old request to verify the address before sending.'}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.8rem',
                        flexWrap: 'wrap',
                        marginTop: '0.8rem'
                      }}
                    >
                      <Button
                        color="logoBlue"
                        variant="soft"
                        disabled={!!busyId}
                        onClick={() =>
                          setEdits((current) => ({
                            ...current,
                            [draft.id]: {
                              subject: edit.subject,
                              body: draft.suggestedBody || draft.body,
                              revision: draft.revision
                            }
                          }))
                        }
                      >
                        Use updated message
                      </Button>
                      {staleEdits && (
                        <Button
                          color="darkerGray"
                          disabled={!!busyId}
                          onClick={() =>
                            setEdits((current) => ({
                              ...current,
                              [draft.id]: { ...edit, revision: draft.revision }
                            }))
                          }
                        >
                          Keep my edits
                        </Button>
                      )}
                    </div>
                  </QuestNote>
                </div>
              )}
              <input
                aria-label="Subject"
                value={edit.subject}
                maxLength={300}
                onChange={(e) =>
                  setEdits((v) => ({
                    ...v,
                    [draft.id]: { ...edit, subject: e.target.value }
                  }))
                }
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  fontSize: '1.5rem'
                }}
              />
              <textarea
                aria-label="Message"
                value={edit.body}
                rows={14}
                onChange={(e) =>
                  setEdits((v) => ({
                    ...v,
                    [draft.id]: { ...edit, body: e.target.value }
                  }))
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
              <div
                style={{
                  display: 'flex',
                  gap: '0.8rem',
                  flexWrap: 'wrap',
                  marginTop: '0.8rem'
                }}
              >
                <Button
                  color="logoBlue"
                  variant="solid"
                  loading={pendingAction === `send:${draft.id}`}
                  disabled={!!busyId || staleEdits}
                  onClick={() =>
                    run(draft.id, 'send', () =>
                      sendMeetupEmail({ id: draft.id, ...edit })
                    )
                  }
                >
                  <Icon icon="paper-plane" />
                  <span style={{ marginLeft: '0.6rem' }}>
                    Send to the parent
                  </span>
                </Button>
                <Button
                  color="darkerGray"
                  loading={pendingAction === `save:${draft.id}`}
                  disabled={!!busyId || staleEdits}
                  onClick={() =>
                    run(draft.id, 'save', () =>
                      saveMeetupEmail({ id: draft.id, ...edit })
                    )
                  }
                >
                  Save changes
                </Button>
                <Button
                  color="red"
                  variant="soft"
                  loading={pendingAction === `discard:${draft.id}`}
                  disabled={!!busyId}
                  onClick={() =>
                    run(draft.id, 'discard', () => discardMeetupEmail(draft.id))
                  }
                >
                  Discard
                </Button>
              </div>
              <p
                style={{
                  fontSize: '1.2rem',
                  color: Color.gray(),
                  marginBottom: 0
                }}
              >
                {draft.body.includes('http')
                  ? 'Keep the link line: it is how the parent answers. '
                  : ''}
                An edited message is sent as plain paragraphs; an unedited one
                keeps its designed layout. Discarding a meetup request lets the
                student ask again.
              </p>
            </section>
          );
        })}
        {!!recent.length && (
          <div style={{ marginTop: '2.4rem' }}>
            <b>Recently handled</b>
            <ul
              style={{
                margin: '0.6rem 0 0',
                paddingLeft: 0,
                fontSize: '1.3rem'
              }}
            >
              {recent.map((d) => (
                <li
                  key={d.id}
                  style={{ listStyle: 'none', marginTop: '0.8rem' }}
                >
                  <details
                    className={css`
                      border: 1px solid var(--ui-border);
                      border-radius: 0.8rem;
                      background: #fff;
                      overflow-wrap: anywhere;
                      summary {
                        cursor: pointer;
                        padding: 1.2rem;
                      }
                      summary:focus-visible {
                        outline: 2px solid ${Color.logoBlue()};
                        outline-offset: 2px;
                      }
                    `}
                  >
                    <summary>
                      <b>{d.status === 'sent' ? 'Sent' : 'Discarded'}</b>:{' '}
                      {d.subject}
                      <span
                        style={{
                          display: 'block',
                          marginTop: '0.4rem',
                          color: Color.gray()
                        }}
                      >
                        To: {d.to}
                      </span>
                    </summary>
                    <div style={{ padding: '0 1.2rem 1.2rem' }}>
                      <p style={{ color: Color.gray(), margin: '0 0 0.8rem' }}>
                        {d.status === 'sent'
                          ? 'Sent message (text version)'
                          : 'Discarded draft — this message was not sent'}
                        {d.decidedAt > 0 && (
                          <>
                            {' '}
                            · {new Date(d.decidedAt * 1000).toLocaleString()}
                          </>
                        )}
                      </p>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {d.body}
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
