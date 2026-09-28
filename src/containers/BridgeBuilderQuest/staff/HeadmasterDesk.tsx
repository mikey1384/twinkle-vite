import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { QuestNote, questInputClass, questLabelClass } from '../StepCard';
import { backLinkClass, pageWidthClass } from '../pageStyles';
import {
  ApplicationDetails,
  StaffNav,
  ViewAsBar,
  VenueForm,
  emptyVenueDraft,
  formatTime,
  staffCardClass,
  staffHeadingClass,
  venueFromDraft,
  type VenueDraft
} from './shared';
import type { DeskData, StaffApplication } from '../types';

// /achievements/bridge-builder/desk — the headmasters' desk: submitted plans
// (oldest first) with approve / send back and an optional classroom offer,
// then the decided history. Admins can "View as" a headmaster.
export default function HeadmasterDesk() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadMeetupDesk = useAppContext((v) => v.requestHelpers.loadMeetupDesk);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewAs = Number(searchParams.get('viewAs')) || 0;
  const focusCrewId = Number(searchParams.get('crew')) || 0;
  const [data, setData] = useState<DeskData | null>(null);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!userId) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, viewAs]);

  if (!userId) {
    return (
      <div className={css`padding: 2rem 1rem;`}>
        <HomeLoginPrompt />
      </div>
    );
  }

  const readOnly = !!data?.viewer.preview;
  const title = data?.achievementTitle || '';
  const queue = data
    ? [...data.queue].sort((a, b) =>
        a.crewId === focusCrewId ? -1 : b.crewId === focusCrewId ? 1 : 0
      )
    : [];

  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest/HeadmasterDesk">
      <div className={css`width: 100%; display: flex; justify-content: center; padding-bottom: 20rem;`}>
        <main className={pageWidthClass} style={{ maxWidth: '980px' }}>
          <Link to="/achievements/bridge-builder" className={backLinkClass}>
            <Icon icon="arrow-left" /> {title ? `${title} quest` : 'Meetup quest'}
          </Link>
          <div className={css`margin-top: 1.4rem; @media (max-width: ${mobileMaxWidth}) { margin: 1.4rem 1rem 0; }`}>
            <h1 className={css`margin: 0; font-size: 2.6rem; font-weight: bold; color: ${Color.black()};`}>
              Headmaster desk
            </h1>
            <p className={css`margin: 0.4rem 0 0.8rem; font-size: 1.4rem; color: ${Color.darkerGray()};`}>
              Meetup plans waiting for a decision. Approving sends the coordinator a
              briefing email; you can also offer a classroom and time slots.
            </p>
            {data && <StaffNav summary={data.summary} />}
          </div>
          {data && (
            <ViewAsBar
              viewer={data.viewer}
              options={data.viewAsOptions}
              viewAs={viewAs}
              onChange={(id) => setSearchParams(id ? { viewAs: String(id) } : {})}
            />
          )}
          {error && (
            <div style={{ marginTop: '2rem' }}>
              <QuestNote tone="warning">{error}</QuestNote>
            </div>
          )}
          {!data && !error && <Loading />}
          {data && (
            <>
              <h2 className={sectionTitleClass}>
                Waiting for you <span style={{ color: Color.darkGray() }}>({data.queue.length})</span>
              </h2>
              {queue.length === 0 ? (
                <QuestNote tone="info">No plans are waiting right now.</QuestNote>
              ) : (
                <div className={css`display: flex; flex-direction: column; gap: 1.6rem;`}>
                  {queue.map((application) => (
                    <PendingPlan
                      key={application.crewId}
                      application={application}
                      achievementTitle={title}
                      readOnly={readOnly}
                      onChanged={reload}
                    />
                  ))}
                </div>
              )}
              {data.videosWaiting && data.videosWaiting.length > 0 && (
                <>
                  <h2 className={sectionTitleClass}>Videos waiting (admins)</h2>
                  {data.videosWaiting.map((application) => (
                    <div key={application.crewId} style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>
                      <Link to={`/achievements/bridge-builder?crew=${application.crewId}`}>
                        {application.displayName} (#{application.crewId}): review the video
                      </Link>
                    </div>
                  ))}
                </>
              )}
              <h2 className={sectionTitleClass}>Decided</h2>
              {data.decided.length === 0 ? (
                <QuestNote tone="info">No decisions yet.</QuestNote>
              ) : (
                <div className={css`display: flex; flex-direction: column; gap: 1.2rem;`}>
                  {data.decided.map((application) => (
                    <DecidedPlan
                      key={application.crewId}
                      application={application}
                      achievementTitle={title}
                      readOnly={readOnly}
                      onChanged={reload}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );

  async function reload() {
    const requestId = ++requestIdRef.current;
    try {
      const next = await loadMeetupDesk(viewAs || undefined);
      if (requestId !== requestIdRef.current) return;
      setData(next);
      setError('');
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setData(null);
      setError(err?.message || 'Could not load the desk.');
    }
  }
}

const sectionTitleClass = css`
  margin: 2.6rem 0 1rem;
  font-size: 1.9rem;
  font-weight: bold;
  color: ${Color.black()};
  @media (max-width: ${mobileMaxWidth}) {
    margin: 2.2rem 1rem 1rem;
  }
`;

function PendingPlan({
  application,
  achievementTitle,
  readOnly,
  onChanged
}: {
  application: StaffApplication;
  achievementTitle: string;
  readOnly: boolean;
  onChanged: () => Promise<void>;
}) {
  const decideMeetupPlan = useAppContext((v) => v.requestHelpers.decideMeetupPlan);
  const [note, setNote] = useState('');
  const [draft, setDraft] = useState<VenueDraft>(() => emptyVenueDraft(application.branchNames[0] || ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  return (
    <article className={staffCardClass}>
      <ApplicationDetails application={application} achievementTitle={achievementTitle} />
      <div
        className={css`
          border-top: 1px solid var(--ui-border);
          padding: 1.4rem 1.6rem;
          background: ${Color.logoBlue(0.03)};
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.2rem 1rem;
          }
        `}
      >
        <h4 className={staffHeadingClass} style={{ fontSize: '1.6rem' }}>
          Your decision
        </h4>
        <div>
          <span className={questLabelClass}>Classroom (optional)</span>
          <VenueForm
            idPrefix={`desk-${application.crewId}`}
            draft={draft}
            branchSuggestions={application.branchNames}
            disabled={readOnly}
            onChange={setDraft}
          />
        </div>
        <div>
          <label className={questLabelClass} htmlFor={`desk-note-${application.crewId}`}>
            Note to the crew (needed to send back)
          </label>
          <textarea
            id={`desk-note-${application.crewId}`}
            className={questInputClass}
            rows={2}
            maxLength={1000}
            value={note}
            disabled={readOnly}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
        <div className={css`display: flex; gap: 0.6rem; flex-wrap: wrap;`}>
          <Button color="green" loading={busy} disabled={busy || readOnly} onClick={() => decide('approve')}>
            <Icon icon="check" style={{ marginRight: '0.5rem' }} />
            Approve
          </Button>
          <Button
            color="orange"
            variant="soft"
            disabled={busy || readOnly}
            onClick={() => (note.trim() ? decide('send-back') : setError('Write a note so the crew knows what to change.'))}
          >
            Send back
          </Button>
        </div>
        {done && <QuestNote tone="success">{done}</QuestNote>}
        {error && <QuestNote tone="warning">{error}</QuestNote>}
      </div>
    </article>
  );

  async function decide(action: 'approve' | 'send-back') {
    if (busy || readOnly) return;
    setBusy(true);
    setError('');
    try {
      const response = await decideMeetupPlan({
        crewId: application.crewId,
        action,
        note,
        venue: action === 'approve' ? venueFromDraft(draft) : undefined
      });
      setDone(
        action === 'approve'
          ? response?.email?.sent
            ? 'Approved. The coordinator got the briefing email.'
            : 'Approved.'
          : 'Sent back to the crew with your note.'
      );
      await onChanged();
    } catch (err: any) {
      setError(err?.message || 'Could not save the decision.');
    } finally {
      setBusy(false);
    }
  }
}

function DecidedPlan({
  application,
  achievementTitle,
  readOnly,
  onChanged
}: {
  application: StaffApplication;
  achievementTitle: string;
  readOnly: boolean;
  onChanged: () => Promise<void>;
}) {
  const changeMeetupVenue = useAppContext((v) => v.requestHelpers.changeMeetupVenue);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<VenueDraft>(() => ({
    ...emptyVenueDraft(application.venue.branch || application.branchNames[0] || ''),
    mode: application.venue.room ? 'offer' : 'none',
    room: application.venue.room,
    slots: application.venue.slots.length
      ? application.venue.slots
      : emptyVenueDraft().slots
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canChangeVenue =
    application.plan.status === 'approved' &&
    application.status === 'active' &&
    application.video.status !== 'pending' &&
    application.video.status !== 'approved';

  return (
    <article className={staffCardClass}>
      <button
        type="button"
        onClick={() => setOpen((shown) => !shown)}
        className={css`
          width: 100%;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.4rem;
          border: 0;
          background: #fff;
          cursor: pointer;
          text-align: left;
          font-size: 1.4rem;
          flex-wrap: wrap;
        `}
      >
        <Icon icon={open ? 'chevron-down' : 'chevron-right'} />
        <b>{application.displayName}</b>
        <span style={{ color: Color.darkGray() }}>
          {application.plan.status === 'sent_back' ? 'Sent back' : 'Approved'}
          {application.decidedBy ? ` by ${application.decidedBy.username}` : ''} ·{' '}
          {formatTime(application.plan.reviewedAt)}
        </span>
      </button>
      {open && (
        <>
          <ApplicationDetails application={application} achievementTitle={achievementTitle} />
          {canChangeVenue && (
            <div
              className={css`
                border-top: 1px solid var(--ui-border);
                padding: 1.2rem 1.6rem;
                display: flex;
                flex-direction: column;
                gap: 0.9rem;
              `}
            >
              {editing ? (
                <>
                  <VenueForm
                    idPrefix={`desk-change-${application.crewId}`}
                    draft={draft}
                    allowLater={false}
                    branchSuggestions={application.branchNames}
                    disabled={readOnly}
                    onChange={setDraft}
                  />
                  <div className={css`display: flex; gap: 0.6rem;`}>
                    <Button color="logoBlue" loading={busy} disabled={busy || readOnly} onClick={handleSave}>
                      Save and tell the coordinator
                    </Button>
                    <Button variant="ghost" color="darkGray" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div>
                  <Button variant="soft" color="logoBlue" size="sm" disabled={readOnly} onClick={() => setEditing(true)}>
                    Change classroom or slots
                  </Button>
                </div>
              )}
              {error && <QuestNote tone="warning">{error}</QuestNote>}
            </div>
          )}
        </>
      )}
    </article>
  );

  async function handleSave() {
    if (busy || readOnly) return;
    setBusy(true);
    setError('');
    try {
      await changeMeetupVenue({ crewId: application.crewId, venue: venueFromDraft(draft) });
      setEditing(false);
      await onChanged();
    } catch (err: any) {
      setError(err?.message || 'Could not change the classroom.');
    } finally {
      setBusy(false);
    }
  }
}
