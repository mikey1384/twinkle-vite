import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import Modal from '~/components/Modal';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import CrewCover from '../CrewCover';
import { QuestNote, questHelpClass, questInputClass, questLabelClass } from '../StepCard';
import { backLinkClass, pageWidthClass } from '../pageStyles';
import {
  ApplicationDetails,
  COORDINATOR_CHIPS,
  CoordinatorChip,
  StaffNav,
  VenueSummary,
  ViewAsBar,
  formatSlot,
  formatTime,
  staffCardClass,
  staffHeadingClass
} from './shared';
import type {
  CoordinatorData,
  CoordinatorStatus,
  StaffApplicationData,
  StaffEvent
} from '../types';

const FILTERS: (CoordinatorStatus | 'all')[] = ['all', 'needs_scheduling', 'scheduled', 'filmed', 'done', 'on_hold'];

// /achievements/bridge-builder/coordinator — the coordinator's desk: every
// approved application with a status chip, and the full application view
// (?crew=) with the timeline, slot setup and staff notes. Her briefing email
// links straight to the application here.
export default function CoordinatorDesk() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadCoordinatorApplications = useAppContext((v) => v.requestHelpers.loadCoordinatorApplications);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewAs = Number(searchParams.get('viewAs')) || 0;
  const crewId = Number(searchParams.get('crew')) || 0;
  const [data, setData] = useState<CoordinatorData | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<CoordinatorStatus | 'all'>('all');
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!userId) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, viewAs]);

  const shown = useMemo(
    () =>
      (data?.applications || []).filter(
        (application) => filter === 'all' || application.coordinatorStatus === filter
      ),
    [data, filter]
  );

  if (!userId) {
    return (
      <div className={css`padding: 2rem 1rem;`}>
        <HomeLoginPrompt />
      </div>
    );
  }

  const title = data?.achievementTitle || '';
  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest/CoordinatorDesk">
      <div className={css`width: 100%; display: flex; justify-content: center; padding-bottom: 20rem;`}>
        <main className={pageWidthClass} style={{ maxWidth: '980px' }}>
          {crewId ? (
            <button type="button" className={backButtonClass} onClick={() => setParams({ crew: 0 })}>
              <Icon icon="arrow-left" /> All applications
            </button>
          ) : (
            <Link to="/achievements/bridge-builder" className={backLinkClass}>
              <Icon icon="arrow-left" /> {title ? `${title} quest` : 'Meetup quest'}
            </Link>
          )}
          <div className={css`margin-top: 1.4rem; @media (max-width: ${mobileMaxWidth}) { margin: 1.4rem 1rem 0; }`}>
            <h1 className={css`margin: 0; font-size: 2.6rem; font-weight: bold; color: ${Color.black()};`}>
              Coordinator desk
            </h1>
            <p className={css`margin: 0.4rem 0 0.8rem; font-size: 1.4rem; color: ${Color.darkerGray()};`}>
              Approved meetup applications. Arrange each one, then record the
              final slot with &quot;Slot is set up&quot;.
            </p>
            {data && <StaffNav summary={data.summary} />}
          </div>
          {data && (
            <ViewAsBar
              viewer={data.viewer}
              options={data.viewAsOptions}
              viewAs={viewAs}
              onChange={(id) => setParams({ viewAs: id })}
            />
          )}
          {error && (
            <div style={{ marginTop: '2rem' }}>
              <QuestNote tone="warning">{error}</QuestNote>
            </div>
          )}
          {!data && !error && <Loading />}
          {data && crewId > 0 && (
            <ApplicationView
              crewId={crewId}
              viewAs={viewAs}
              achievementTitle={title}
              readOnly={data.viewer.preview}
              isAdmin={data.viewer.canAdminister && !data.viewer.preview}
              onChanged={reload}
            />
          )}
          {data && !crewId && (
            <>
              <div
                className={css`
                  display: flex;
                  gap: 0.5rem;
                  overflow-x: auto;
                  margin: 1.8rem 0 1.2rem;
                  padding-bottom: 0.3rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    margin: 1.6rem 1rem 1rem;
                  }
                `}
              >
                {FILTERS.map((key) => {
                  const active = filter === key;
                  const label = key === 'all' ? 'All' : COORDINATOR_CHIPS[key].label;
                  const count = key === 'all' ? data.applications.length : data.counts[key] || 0;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(key)}
                      className={css`
                        padding: 0.5rem 1.2rem;
                        border-radius: 999px;
                        border: 1px solid ${active ? Color.logoBlue() : 'var(--ui-border)'};
                        background: ${active ? Color.logoBlue() : '#fff'};
                        color: ${active ? '#fff' : Color.darkerGray()};
                        font-size: 1.25rem;
                        font-weight: bold;
                        white-space: nowrap;
                        cursor: pointer;
                      `}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
              {shown.length === 0 ? (
                <QuestNote tone="info">
                  {data.applications.length === 0
                    ? 'No approved applications yet. They appear here as soon as a headmaster approves a plan.'
                    : 'Nothing with this status.'}
                </QuestNote>
              ) : (
                <div className={css`display: flex; flex-direction: column; gap: 0.8rem;`}>
                  {shown.map((application) => (
                    <button
                      key={application.crewId}
                      type="button"
                      onClick={() => setParams({ crew: application.crewId })}
                      className={css`
                        ${staffCardClass};
                        display: grid;
                        grid-template-columns: 8rem minmax(0, 1fr) auto;
                        gap: 1.2rem;
                        align-items: center;
                        padding: 0.8rem;
                        text-align: left;
                        cursor: pointer;
                        @media (max-width: ${mobileMaxWidth}) {
                          grid-template-columns: 5rem minmax(0, 1fr);
                        }
                      `}
                    >
                      <CrewCover cover={application.cover} height="5.4rem" rounded="0.8rem" />
                      <span style={{ minWidth: 0 }}>
                        <b style={{ fontSize: '1.5rem', color: Color.black() }}>{application.displayName}</b>
                        <span style={{ display: 'block', fontSize: '1.25rem', color: Color.darkerGray() }}>
                          {application.branchNames.join(', ')} · proposed {application.plan.date}
                        </span>
                        <span style={{ display: 'block', fontSize: '1.25rem', color: Color.darkGray() }}>
                          <VenueSummary application={application} />
                        </span>
                      </span>
                      <span className={css`@media (max-width: ${mobileMaxWidth}) { grid-column: 2; }`}>
                        <CoordinatorChip status={application.coordinatorStatus} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );

  function setParams({ crew, viewAs: nextViewAs }: { crew?: number; viewAs?: number }) {
    const params: Record<string, string> = {};
    const v = nextViewAs === undefined ? viewAs : nextViewAs;
    const c = crew === undefined ? crewId : crew;
    if (v) params.viewAs = String(v);
    if (c) params.crew = String(c);
    setSearchParams(params);
  }

  async function reload() {
    const requestId = ++requestIdRef.current;
    try {
      const next = await loadCoordinatorApplications(viewAs || undefined);
      if (requestId !== requestIdRef.current) return;
      setData(next);
      setError('');
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setData(null);
      setError(err?.message || 'Could not load the coordinator desk.');
    }
  }
}

const backButtonClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.4rem;
  font-weight: bold;
  color: ${Color.logoBlue()};
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  @media (max-width: ${mobileMaxWidth}) {
    margin: 1rem 1rem 0;
  }
`;

const EVENT_LABELS: Record<string, string> = {
  crew_created: 'Crew created',
  plan_submitted: 'Plan sent for review',
  plan_approved: 'Plan approved',
  plan_sent_back: 'Plan sent back',
  plan_reset: 'Crew changed: plan must be sent again',
  venue_changed: 'Classroom/slots changed',
  email_sent: 'Email sent to the coordinator',
  email_resent: 'Email resent to the coordinator',
  email_failed: 'Coordinator email failed',
  slot_set: 'Slot set up',
  video_submitted: 'Video sent',
  video_sent_back: 'Video sent back',
  completed: 'Final review: approved',
  disbanded: 'Crew disbanded'
};

function eventText(event: StaffEvent) {
  const label = EVENT_LABELS[event.kind] || event.kind;
  const by = event.actorUsername ? ` by ${event.actorUsername}` : '';
  if (event.kind === 'slot_set' && event.detail?.slot) return `${label}${by}: ${formatSlot(event.detail.slot)}`;
  if (event.kind === 'email_failed') {
    return `${label}${event.detail?.reason === 'no_recipient' ? ': no coordinator email address is set' : ''}`;
  }
  if ((event.kind === 'email_sent' || event.kind === 'email_resent') && event.detail) {
    return `${label} (${event.detail.kind}${event.detail.mode === 'dev-skipped' ? ', not sent outside production' : ''})`;
  }
  return `${label}${by}`;
}

function ApplicationView({
  crewId,
  viewAs,
  achievementTitle,
  readOnly,
  isAdmin,
  onChanged
}: {
  crewId: number;
  viewAs: number;
  achievementTitle: string;
  readOnly: boolean;
  isAdmin: boolean;
  onChanged: () => Promise<void>;
}) {
  const loadStaffApplication = useAppContext((v) => v.requestHelpers.loadStaffApplication);
  const confirmMeetupSlot = useAppContext((v) => v.requestHelpers.confirmMeetupSlot);
  const addMeetupStaffNote = useAppContext((v) => v.requestHelpers.addMeetupStaffNote);
  const previewCoordinatorEmail = useAppContext((v) => v.requestHelpers.previewCoordinatorEmail);
  const resendCoordinatorEmail = useAppContext((v) => v.requestHelpers.resendCoordinatorEmail);
  const [data, setData] = useState<StaffApplicationData | null>(null);
  const [error, setError] = useState('');
  const [choice, setChoice] = useState<number>(0);
  const [custom, setCustom] = useState({ date: '', start: '14:00', end: '16:00' });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<{ subject: string; html: string; text: string; to: string } | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crewId, viewAs]);

  if (error) return <div style={{ marginTop: '2rem' }}><QuestNote tone="warning">{error}</QuestNote></div>;
  if (!data) return <Loading />;
  const { application, events, notes, headmaster } = data;
  const offered = application.venue.slots;
  const canSetSlot =
    application.status === 'active' &&
    application.plan.status === 'approved' &&
    application.venue.status !== 'cancelled';
  const useCustom = choice === -1 || offered.length === 0;

  return (
    <div className={css`display: flex; flex-direction: column; gap: 1.6rem; margin-top: 1.8rem;`}>
      <article className={staffCardClass}>
        <ApplicationDetails application={application} achievementTitle={achievementTitle} />
      </article>

      <section className={css`${staffCardClass}; padding: 1.4rem 1.6rem; display: flex; flex-direction: column; gap: 1rem;`}>
        <h3 className={staffHeadingClass}>Slot setup</h3>
        {application.venue.confirmedSlot && (
          <QuestNote tone="success">
            Set up: <b>{formatSlot(application.venue.confirmedSlot)}</b>
            {application.venue.room ? ` · ${application.venue.branch} ${application.venue.room}` : ''}
            {application.venueSetBy ? ` (by ${application.venueSetBy.username})` : ''}
          </QuestNote>
        )}
        {canSetSlot ? (
          <>
            {offered.length > 0 && (
              <div role="radiogroup" aria-label="Offered slots" className={css`display: flex; flex-direction: column; gap: 0.4rem;`}>
                {offered.map((slot, index) => (
                  <label key={index} className={radioClass}>
                    <input type="radio" checked={choice === index} disabled={readOnly} onChange={() => setChoice(index)} />
                    {formatSlot(slot)}
                  </label>
                ))}
                <label className={radioClass}>
                  <input type="radio" checked={choice === -1} disabled={readOnly} onChange={() => setChoice(-1)} />
                  A different date or time
                </label>
              </div>
            )}
            {useCustom && (
              <div className={css`display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;`}>
                <input type="date" aria-label="Date" className={questInputClass} style={{ width: '15rem' }} value={custom.date} disabled={readOnly} onChange={(event) => setCustom({ ...custom, date: event.target.value })} />
                <input type="time" aria-label="Start" className={questInputClass} style={{ width: '10rem' }} value={custom.start} disabled={readOnly} onChange={(event) => setCustom({ ...custom, start: event.target.value })} />
                <span>–</span>
                <input type="time" aria-label="End" className={questInputClass} style={{ width: '10rem' }} value={custom.end} disabled={readOnly} onChange={(event) => setCustom({ ...custom, end: event.target.value })} />
              </div>
            )}
            <div>
              <Button color="green" loading={busy} disabled={busy || readOnly} onClick={handleSetSlot}>
                <Icon icon="check" style={{ marginRight: '0.5rem' }} />
                Slot is set up
              </Button>
              <div className={questHelpClass}>
                The crew sees the final slot on its page and gets a message.
                The actual room booking happens through the academy.
              </div>
            </div>
          </>
        ) : (
          <span className={questHelpClass}>
            {application.venue.status === 'cancelled'
              ? 'On hold: the crew changed or disbanded after approval.'
              : 'Nothing to set up right now.'}
          </span>
        )}
        {headmaster && (
          <div style={{ fontSize: '1.35rem' }}>
            Questions? Contact the approving headmaster:{' '}
            <Link to={`/users/${headmaster.username}`} style={{ fontWeight: 'bold' }}>
              {headmaster.username}
              {headmaster.realName ? ` (${headmaster.realName})` : ''}
            </Link>{' '}
            <span className={questHelpClass}>(message them from their profile)</span>
          </div>
        )}
        {message && <QuestNote tone="success">{message}</QuestNote>}
        {actionError && <QuestNote tone="warning">{actionError}</QuestNote>}
        {isAdmin && (
          <div className={css`display: flex; gap: 0.6rem; flex-wrap: wrap; border-top: 1px dashed var(--ui-border); padding-top: 1rem;`}>
            <Button size="sm" variant="soft" color="logoBlue" disabled={busy} onClick={handlePreview}>
              <Icon icon="eye" style={{ marginRight: '0.4rem' }} />
              Preview email
            </Button>
            <Button size="sm" variant="outline" color="logoBlue" disabled={busy} onClick={handleResend}>
              <Icon icon="paper-plane" style={{ marginRight: '0.4rem' }} />
              Resend email
            </Button>
            <span className={questHelpClass}>
              Last emailed: {application.coordinatorEmailedAt ? formatTime(application.coordinatorEmailedAt) : 'never'}
            </span>
          </div>
        )}
      </section>

      <section className={css`${staffCardClass}; padding: 1.4rem 1.6rem; display: flex; flex-direction: column; gap: 0.9rem;`}>
        <h3 className={staffHeadingClass}>Staff notes</h3>
        <span className={questHelpClass}>Only staff see these. The crew never does.</span>
        {notes.map((item) => (
          <div key={item.id} className={css`font-size: 1.35rem; border-left: 3px solid ${Color.logoBlue(0.5)}; padding-left: 0.8rem;`}>
            <b>{item.username || 'staff'}</b>{' '}
            <span style={{ color: Color.darkGray() }}>{formatTime(item.createdAt)}</span>
            <div style={{ whiteSpace: 'pre-wrap' }}>{item.note}</div>
          </div>
        ))}
        <label className={questLabelClass} htmlFor={`staff-note-${crewId}`}>Add a note</label>
        <textarea id={`staff-note-${crewId}`} className={questInputClass} rows={2} maxLength={2000} value={note} disabled={readOnly} onChange={(event) => setNote(event.target.value)} />
        <div>
          <Button size="sm" color="logoBlue" disabled={busy || readOnly || !note.trim()} onClick={handleNote}>
            Save note
          </Button>
        </div>
      </section>

      <section className={css`${staffCardClass}; padding: 1.4rem 1.6rem;`}>
        <h3 className={staffHeadingClass}>Timeline</h3>
        <ol className={css`list-style: none; margin: 1rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem;`}>
          {events.length === 0 && <li className={questHelpClass}>No events recorded yet.</li>}
          {events.map((event) => (
            <li key={event.id} className={css`display: grid; grid-template-columns: 16rem minmax(0, 1fr); gap: 1rem; font-size: 1.3rem; @media (max-width: ${mobileMaxWidth}) { grid-template-columns: 1fr; gap: 0; }`}>
              <span style={{ color: Color.darkGray() }}>{formatTime(event.createdAt)}</span>
              <span>{eventText(event)}</span>
            </li>
          ))}
        </ol>
      </section>

      {preview && (
        <Modal modalKey="MeetupCoordinatorEmailPreview" isOpen onClose={() => setPreview(null)} hasHeader title="Email preview (not sent)" size="lg">
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '1.3rem' }}>
              <b>To:</b> {preview.to || '(no address set)'}
              <br />
              <b>Subject:</b> {preview.subject}
            </div>
            <iframe
              title="Email HTML"
              sandbox=""
              srcDoc={preview.html}
              className={css`width: 100%; height: 60vh; border: 1px solid var(--ui-border); border-radius: 0.8rem; background: #fff;`}
            />
            <details>
              <summary style={{ fontSize: '1.3rem', cursor: 'pointer' }}>Plain text</summary>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '1.2rem' }}>{preview.text}</pre>
            </details>
          </div>
        </Modal>
      )}
    </div>
  );

  async function load() {
    try {
      setData(await loadStaffApplication({ crewId, viewAs: viewAs || undefined }));
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Could not load the application.');
    }
  }

  async function run(action: () => Promise<unknown>, done: string) {
    if (busy || readOnly) return;
    setBusy(true);
    setActionError('');
    setMessage('');
    try {
      await action();
      setMessage(done);
      await Promise.all([load(), onChanged()]);
    } catch (err: any) {
      setActionError(err?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  function handleSetSlot() {
    return run(
      () =>
        confirmMeetupSlot(
          useCustom ? { crewId, slot: custom } : { crewId, slotIndex: choice }
        ),
      'Slot is set up. The crew can see it now.'
    );
  }

  function handleNote() {
    return run(async () => {
      await addMeetupStaffNote({ crewId, note });
      setNote('');
    }, 'Note saved.');
  }

  async function handlePreview() {
    setActionError('');
    try {
      setPreview(await previewCoordinatorEmail(crewId));
    } catch (err: any) {
      setActionError(err?.message || 'Could not build the preview.');
    }
  }

  function handleResend() {
    return run(async () => {
      const result = await resendCoordinatorEmail(crewId);
      if (!result?.sent) throw new Error(`Not sent: ${result?.reason || 'unknown'}`);
    }, 'Email resent.');
  }
}

const radioClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.4rem;
  cursor: pointer;
`;
