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
import CrewCover from '../CrewCover';
import { QuestNote, questInputClass, questLabelClass } from '../StepCard';
import { backLinkClass, pageWidthClass } from '../pageStyles';
import {
  ApplicationDetails,
  Celebration,
  CoordinatorChip,
  CountBubble,
  EmptyState,
  VenueForm,
  ViewAsBar,
  WelcomeHeader,
  emptyVenueDraft,
  formatTime,
  liftCardClass,
  staffMainGutterClass,
  sectionTitleClass,
  venueFromDraft,
  type VenueDraft
} from './shared';
import type { DeskData, StaffApplication, StaffUser } from '../types';

const SEND_BACK_SUGGESTIONS = [
  'Please choose a public place, like a library or a museum.',
  'Please tell us more about what you will learn together.',
  'Please pick a date when your grown-up can come.',
  'Please make sure every member has asked a parent.'
];

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
        <main className={`${pageWidthClass} ${staffMainGutterClass}`} style={{ maxWidth: '1000px' }}>
          <Link to="/achievements/bridge-builder" className={backLinkClass}>
            <Icon icon="arrow-left" /> {title ? `${title} quest` : 'Meetup quest'}
          </Link>
          {error && (
            <div style={{ marginTop: '2rem' }}>
              <QuestNote tone="warning">{error}</QuestNote>
            </div>
          )}
          {!data && !error && <Loading />}
          {data && (
            <>
              <WelcomeHeader
                viewer={data.viewer}
                title="Headmaster desk"
                lead="Meetup plans from students land here for your decision."
                summary={data.summary}
                stats={[
                  { icon: 'clipboard-check', label: 'Plans waiting', one: 'plan waiting', value: data.summary.plansWaiting, color: '#418ceb' },
                  { icon: 'clock', label: 'Meetups this week', one: 'meetup this week', value: data.summary.meetupsThisWeek || 0, color: '#28b62c' },
                  { icon: 'users', label: 'Crews met this month', one: 'crew met this month', value: data.summary.metThisMonth || 0, color: '#e08a00' },
                  { icon: 'check-circle', label: 'Decided', value: data.decided.length, color: '#139a9a' }
                ]}
              />
              <ViewAsBar
                viewer={data.viewer}
                options={data.viewAsOptions}
                viewAs={viewAs}
                onChange={(id) => setSearchParams(id ? { viewAs: String(id) } : {})}
              />
              <h2 className={sectionTitleClass}>
                <Icon icon="clipboard-check" style={{ color: Color.logoBlue() }} /> Waiting for you
                <CountBubble count={data.queue.length} />
              </h2>
              {queue.length === 0 ? (
                <EmptyState
                  emoji="☕"
                  title="No plans waiting"
                  text="Enjoy your tea. New meetup plans from students will show up here, and you'll get a message in chat."
                />
              ) : (
                <div className={css`display: flex; flex-direction: column; gap: 2rem;`}>
                  {queue.map((application) => (
                    <PendingPlan
                      key={application.crewId}
                      application={application}
                      achievementTitle={title}
                      coordinator={data.coordinator || null}
                      readOnly={readOnly}
                      onChanged={reload}
                    />
                  ))}
                </div>
              )}
              {data.videosWaiting && data.videosWaiting.length > 0 && (
                <>
                  <h2 className={sectionTitleClass}>
                    <Icon icon="film" style={{ color: Color.logoBlue() }} /> Videos waiting (admins)
                    <CountBubble count={data.videosWaiting.length} />
                  </h2>
                  <div className={css`display: flex; flex-direction: column; gap: 0.8rem;`}>
                    {data.videosWaiting.map((application) => (
                      <Link
                        key={application.crewId}
                        to={`/achievements/bridge-builder?crew=${application.crewId}`}
                        className={css`${liftCardClass}; display: flex; align-items: center; gap: 1rem; padding: 0.8rem; color: ${Color.black()};`}
                      >
                        <span style={{ width: '6rem' }}>
                          <CrewCover cover={application.cover} height="4rem" rounded="0.8rem" />
                        </span>
                        <b style={{ fontSize: '1.4rem' }}>{application.displayName}</b>
                        <span style={{ marginLeft: 'auto', fontSize: '1.3rem', color: Color.logoBlue() }}>
                          Review the video <Icon icon="chevron-right" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
              <h2 className={sectionTitleClass}>
                <Icon icon="history" style={{ color: Color.logoBlue() }} /> Decided
              </h2>
              {data.decided.length === 0 ? (
                <EmptyState
                  emoji="🌱"
                  title="No decisions yet"
                  text="Plans you approve or send back will be listed here, so you can change a classroom offer later."
                />
              ) : (
                <div className={css`display: flex; flex-direction: column; gap: 1rem;`}>
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

function PendingPlan({
  application,
  achievementTitle,
  coordinator,
  readOnly,
  onChanged
}: {
  application: StaffApplication;
  achievementTitle: string;
  coordinator: StaffUser | null;
  readOnly: boolean;
  onChanged: () => Promise<void>;
}) {
  const decideMeetupPlan = useAppContext((v) => v.requestHelpers.decideMeetupPlan);
  const [note, setNote] = useState('');
  const [draft, setDraft] = useState<VenueDraft>(() => emptyVenueDraft(application.branchNames[0] || ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sendBackShown, setSendBackShown] = useState(false);
  const [celebration, setCelebration] = useState('');
  const [sentBack, setSentBack] = useState(false);
  const coordinatorName = coordinator
    ? (coordinator.realName || '').split(' ')[0] || coordinator.username
    : 'The coordinator';

  if (celebration) {
    return (
      <Celebration
        title="Plan approved!"
        message={celebration}
        onDone={() => {
          setCelebration('');
          onChanged();
        }}
      />
    );
  }
  if (sentBack) {
    return (
      <QuestNote tone="info">
        Sent back to <b>{application.displayName}</b> with your note. They&apos;ll see it on their crew page.
      </QuestNote>
    );
  }

  return (
    <article className={liftCardClass}>
      <ApplicationDetails application={application} achievementTitle={achievementTitle} />
      <div
        className={css`
          border-top: 1px solid var(--ui-border);
          padding: 1.8rem 1.6rem;
          background: ${Color.logoBlue(0.03)};
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.4rem 1rem;
          }
        `}
      >
        <div>
          <h3 className={css`margin: 0; font-size: 1.8rem; font-weight: bold; color: ${Color.black()};`}>
            Your decision
          </h3>
          <span style={{ fontSize: '1.3rem', color: Color.darkGray() }}>
            Can the academy offer a classroom? It&apos;s optional.
          </span>
        </div>
        <VenueForm
          idPrefix={`desk-${application.crewId}`}
          draft={draft}
          branchSuggestions={application.branchNames}
          disabled={readOnly}
          onChange={setDraft}
        />
        {sendBackShown && (
          <div
            className={css`
              border-radius: 1.4rem;
              background: ${Color.orange(0.07)};
              border: 1px solid ${Color.orange(0.3)};
              padding: 1.2rem;
              display: flex;
              flex-direction: column;
              gap: 0.8rem;
            `}
          >
            <label className={questLabelClass} htmlFor={`desk-note-${application.crewId}`}>
              What should the crew change? Be kind: they&apos;re kids and they&apos;ll read it.
            </label>
            <div className={css`display: flex; gap: 0.5rem; flex-wrap: wrap;`}>
              {SEND_BACK_SUGGESTIONS.map((text) => (
                <button
                  key={text}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setNote((current) => (current ? `${current} ${text}` : text))}
                  className={css`
                    padding: 0.4rem 1rem;
                    border-radius: 999px;
                    border: 1px dashed ${Color.orange(0.6)};
                    background: #fff;
                    font-size: 1.2rem;
                    color: ${Color.darkerGray()};
                    cursor: pointer;
                    text-align: left;
                  `}
                >
                  + {text}
                </button>
              ))}
            </div>
            <textarea
              id={`desk-note-${application.crewId}`}
              className={questInputClass}
              rows={3}
              maxLength={1000}
              value={note}
              disabled={readOnly}
              placeholder="Great idea! Just one thing…"
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        )}
        {!sendBackShown && (
          <div>
            <label className={questLabelClass} htmlFor={`desk-approve-note-${application.crewId}`}>
              A note for the crew (optional)
            </label>
            <input
              id={`desk-approve-note-${application.crewId}`}
              className={questInputClass}
              maxLength={1000}
              value={note}
              disabled={readOnly}
              placeholder="Have a wonderful meetup!"
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        )}
        <div
          className={css`
            display: flex;
            gap: 0.8rem;
            flex-wrap: wrap;
            align-items: center;
            @media (max-width: ${mobileMaxWidth}) {
              flex-direction: column;
              align-items: stretch;
            }
          `}
        >
          {sendBackShown ? (
            <>
              <Button color="orange" size="lg" loading={busy} disabled={busy || readOnly} onClick={handleSendBack}>
                <Icon icon="paper-plane" style={{ marginRight: '0.6rem' }} />
                Send back with this note
              </Button>
              <Button variant="ghost" color="darkGray" disabled={busy} onClick={() => setSendBackShown(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button color="green" size="lg" loading={busy} disabled={busy || readOnly} onClick={handleApprove}>
                <Icon icon="check" style={{ marginRight: '0.6rem' }} />
                Approve plan
              </Button>
              <Button variant="soft" color="orange" disabled={busy || readOnly} onClick={() => setSendBackShown(true)}>
                <Icon icon="redo" style={{ marginRight: '0.5rem' }} />
                Send back
              </Button>
            </>
          )}
        </div>
        {error && <QuestNote tone="warning">{error}</QuestNote>}
      </div>
    </article>
  );

  async function handleApprove() {
    if (busy || readOnly) return;
    if (draft.mode === 'offer' && (!draft.branch.trim() || !draft.room.trim() || !draft.slots.length)) {
      setError('For a classroom offer, pick the branch, name the classroom and add at least one slot.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await decideMeetupPlan({
        crewId: application.crewId,
        action: 'approve',
        note,
        venue: venueFromDraft(draft)
      });
      setCelebration(
        response?.email?.sent
          ? `${coordinatorName} will get the briefing to arrange the meetup.`
          : `${coordinatorName} will see it on the coordinator desk.`
      );
    } catch (err: any) {
      setError(err?.message || 'Could not save the decision.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSendBack() {
    if (busy || readOnly) return;
    if (!note.trim()) {
      setError('Write a note so the crew knows what to change.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await decideMeetupPlan({ crewId: application.crewId, action: 'send-back', note });
      setSentBack(true);
      setTimeout(onChanged, 2000);
    } catch (err: any) {
      setError(err?.message || 'Could not send it back.');
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
    slots: application.venue.slots
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canChangeVenue =
    application.plan.status === 'approved' &&
    application.status === 'active' &&
    application.video.status !== 'pending' &&
    application.video.status !== 'approved';

  return (
    <article className={liftCardClass}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((shown) => !shown)}
        className={css`
          width: 100%;
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 0.8rem;
          border: 0;
          background: #fff;
          cursor: pointer;
          text-align: left;
        `}
      >
        <span style={{ width: '7rem', flexShrink: 0 }}>
          <CrewCover cover={application.cover} height="4.8rem" rounded="0.9rem" />
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <b style={{ display: 'block', fontSize: '1.5rem', color: Color.black() }}>{application.displayName}</b>
          <span style={{ fontSize: '1.25rem', color: Color.darkGray() }}>
            {application.plan.status === 'sent_back' ? 'Sent back' : 'Approved'}
            {application.decidedBy ? ` by ${application.decidedBy.username}` : ''} · {formatTime(application.plan.reviewedAt)}
          </span>
        </span>
        {application.plan.status !== 'sent_back' && (
          <span className={css`@media (max-width: ${mobileMaxWidth}) { display: none; }`}>
            <CoordinatorChip status={application.coordinatorStatus} />
          </span>
        )}
        <Icon icon={open ? 'chevron-up' : 'chevron-down'} style={{ color: Color.darkGray() }} />
      </button>
      {open && (
        <>
          <ApplicationDetails application={application} achievementTitle={achievementTitle} />
          {canChangeVenue && (
            <div
              className={css`
                border-top: 1px solid var(--ui-border);
                padding: 1.4rem 1.6rem;
                display: flex;
                flex-direction: column;
                gap: 1rem;
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
                  <div className={css`display: flex; gap: 0.6rem; flex-wrap: wrap;`}>
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
                    <Icon icon="school" style={{ marginRight: '0.5rem' }} />
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
