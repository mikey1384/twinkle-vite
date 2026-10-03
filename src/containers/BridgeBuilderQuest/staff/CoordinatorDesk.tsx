import DateCalendar from '~/components/DateCalendar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import Modal from '~/components/Modal';
import ProfilePic from '~/components/ProfilePic';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import CrewCover from '../CrewCover';
import { QuestNote, questHelpClass, questInputClass } from '../StepCard';
import { backLinkClass, pageWidthClass } from '../pageStyles';
import {
  ApplicationDetails,
  COORDINATOR_CHIPS,
  CalendarChip,
  CoordinatorChip,
  CountBubble,
  EmptyState,
  ViewAsBar,
  VenueSummary,
  WelcomeHeader,
  addDays,
  formatSlot,
  formatTime,
  liftCardClass,
  staffMainGutterClass,
  localToday,
  sectionTitleClass,
  staffCardClass
} from './shared';
import type {
  CoordinatorData,
  CoordinatorStatus,
  StaffApplication,
  StaffApplicationData,
  StaffEvent
} from '../types';

const OTHER_FILTERS: (CoordinatorStatus | 'all')[] = ['all', 'scheduled', 'filmed', 'done', 'on_hold'];
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pop = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
`;

// /achievements/bridge-builder/coordinator — the coordinator's desk: this
// week's meetups, what needs scheduling, every other approved application,
// and the full application view (?crew=; her briefing email links here).
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

  const applications = useMemo(() => data?.applications || [], [data]);
  const needsScheduling = applications.filter((a) => a.coordinatorStatus === 'needs_scheduling');
  const others = applications.filter(
    (a) => a.coordinatorStatus !== 'needs_scheduling' && (filter === 'all' || a.coordinatorStatus === filter)
  );
  const week = useMemo(() => {
    const today = localToday();
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, index);
      return {
        date,
        meetups: applications.filter((a) => a.venue.confirmedSlot?.date === date && a.status === 'active')
      };
    });
  }, [applications]);

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
        <main className={`${pageWidthClass} ${staffMainGutterClass}`} style={{ maxWidth: '1000px' }}>
          {crewId ? (
            <button type="button" className={backButtonClass} onClick={() => setParams({ crew: 0 })}>
              <Icon icon="arrow-left" /> Coordinator desk
            </button>
          ) : (
            <Link to="/achievements/bridge-builder" className={backLinkClass}>
              <Icon icon="arrow-left" /> {title ? `${title} quest` : 'Meetup quest'}
            </Link>
          )}
          {error && (
            <div style={{ marginTop: '2rem' }}>
              <QuestNote tone="warning">{error}</QuestNote>
            </div>
          )}
          {!data && !error && <Loading />}
          {data && !crewId && (
            <WelcomeHeader
              viewer={data.viewer}
              title="Coordinator desk"
              lead="Approved meetups land here for you to arrange."
              summary={data.summary}
              stats={[
                { icon: 'clock', label: 'Need scheduling', one: 'needs scheduling', value: data.counts.needs_scheduling || 0, color: '#e08a00' },
                { icon: 'check-circle', label: 'Meetups this week', one: 'meetup this week', value: data.summary.meetupsThisWeek || 0, color: '#418ceb' },
                { icon: 'users', label: 'Crews met this month', one: 'crew met this month', value: data.summary.metThisMonth || 0, color: '#28b62c' },
                { icon: 'trophy', label: 'Done', value: data.counts.done || 0, color: '#139a9a' }
              ]}
            />
          )}
          {data && (
            <ViewAsBar
              viewer={data.viewer}
              options={data.viewAsOptions}
              viewAs={viewAs}
              onChange={(id) => setParams({ viewAs: id })}
            />
          )}
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
              <h2 className={sectionTitleClass}>
                <Icon icon="clock" style={{ color: Color.logoBlue() }} /> This week
              </h2>
              <div
                className={css`
                  display: grid;
                  grid-template-columns: repeat(7, minmax(0, 1fr));
                  gap: 0.6rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    display: flex;
                    overflow-x: auto;
                    padding: 0 0 0.4rem;
                    scroll-snap-type: x mandatory;
                  }
                `}
              >
                {week.map((day, index) => {
                  const date = new Date(`${day.date}T00:00:00`);
                  const isToday = index === 0;
                  return (
                    <div
                      key={day.date}
                      className={css`
                        ${staffCardClass};
                        min-height: 11rem;
                        padding: 0.8rem;
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                        border-color: ${isToday ? Color.logoBlue() : 'var(--ui-border)'};
                        @media (max-width: ${mobileMaxWidth}) {
                          min-width: 12rem;
                          scroll-snap-align: start;
                        }
                      `}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <b style={{ fontSize: '1.8rem', color: isToday ? Color.logoBlue() : Color.black() }}>
                          {date.getDate()}
                        </b>
                        <span style={{ fontSize: '1.2rem', color: Color.darkGray() }}>
                          {isToday ? 'Today' : WEEKDAY_NAMES[date.getDay()]}
                        </span>
                      </div>
                      {day.meetups.length === 0 ? (
                        <span style={{ fontSize: '1.15rem', color: Color.gray() }}>—</span>
                      ) : (
                        day.meetups.map((meetup) => (
                          <button
                            key={meetup.crewId}
                            type="button"
                            onClick={() => setParams({ crew: meetup.crewId })}
                            className={css`
                              border: 0;
                              border-radius: 0.8rem;
                              padding: 0.5rem 0.6rem;
                              background: ${Color.logoBlue(0.12)};
                              border-left: 3px solid ${Color.logoBlue()};
                              text-align: left;
                              cursor: pointer;
                              font-size: 1.15rem;
                              transition: transform 0.15s ease;
                              &:hover {
                                transform: translateY(-1px);
                              }
                              @media (prefers-reduced-motion: reduce) {
                                transition: none;
                              }
                            `}
                          >
                            <b style={{ display: 'block' }}>{meetup.venue.confirmedSlot?.start}</b>
                            {meetup.displayName}
                          </button>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>

              <h2 className={sectionTitleClass}>
                <Icon icon="clock" style={{ color: Color.orange() }} /> Needs scheduling
                <CountBubble count={needsScheduling.length} color={Color.orange()} />
              </h2>
              {needsScheduling.length === 0 ? (
                <EmptyState
                  emoji="🌤️"
                  title="All caught up"
                  text="Nothing needs scheduling right now. When a headmaster approves a plan, you'll get a briefing email and it'll appear here."
                />
              ) : (
                <div
                  className={css`
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(28rem, 1fr));
                    gap: 1.4rem;
                    @media (max-width: ${mobileMaxWidth}) {
                      grid-template-columns: 1fr;
                    }
                  `}
                >
                  {needsScheduling.map((application) => (
                    <SchedulingCard
                      key={application.crewId}
                      application={application}
                      onOpen={() => setParams({ crew: application.crewId })}
                    />
                  ))}
                </div>
              )}

              <h2 className={sectionTitleClass}>
                <Icon icon="list" style={{ color: Color.logoBlue() }} /> All applications
              </h2>
              <div
                className={css`
                  display: flex;
                  gap: 0.5rem;
                  overflow-x: auto;
                  margin-bottom: 1.2rem;
                  padding-bottom: 0.3rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    margin: 0 0 1rem;
                  }
                `}
              >
                {OTHER_FILTERS.map((key) => {
                  const active = filter === key;
                  const chip = key === 'all' ? null : COORDINATOR_CHIPS[key];
                  const count =
                    key === 'all'
                      ? applications.length - needsScheduling.length
                      : data.counts[key] || 0;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(key)}
                      className={css`
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1.2rem;
                        border-radius: 999px;
                        border: 1.5px solid ${active ? Color.logoBlue() : 'var(--ui-border)'};
                        background: ${active ? Color.logoBlue() : '#fff'};
                        color: ${active ? '#fff' : Color.darkerGray()};
                        font-size: 1.25rem;
                        font-weight: bold;
                        white-space: nowrap;
                        cursor: pointer;
                      `}
                    >
                      {chip && <Icon icon={chip.icon} />}
                      {chip ? chip.label : 'All'} ({count})
                    </button>
                  );
                })}
              </div>
              {others.length === 0 ? (
                <EmptyState
                  emoji="📚"
                  title={applications.length ? 'Nothing here' : 'No applications yet'}
                  text={
                    applications.length
                      ? 'No applications with this status.'
                      : 'Approved meetup plans will show up here as soon as a headmaster approves one.'
                  }
                />
              ) : (
                <div className={css`display: flex; flex-direction: column; gap: 0.8rem;`}>
                  {others.map((application) => (
                    <button
                      key={application.crewId}
                      type="button"
                      onClick={() => setParams({ crew: application.crewId })}
                      className={css`
                        ${liftCardClass};
                        display: grid;
                        grid-template-columns: 8rem minmax(0, 1fr) auto;
                        gap: 1.2rem;
                        align-items: center;
                        padding: 0.8rem;
                        text-align: left;
                        cursor: pointer;
                        @media (max-width: ${mobileMaxWidth}) {
                          grid-template-columns: 6rem minmax(0, 1fr);
                        }
                      `}
                    >
                      <CrewCover cover={application.cover} height="5.4rem" rounded="0.9rem" />
                      <span style={{ minWidth: 0 }}>
                        <b style={{ fontSize: '1.5rem', color: Color.black() }}>{application.displayName}</b>
                        <span style={{ display: 'block', fontSize: '1.25rem', color: Color.darkerGray() }}>
                          {application.branchNames.join(' · ')}
                        </span>
                        <span style={{ display: 'block', fontSize: '1.2rem', color: Color.darkGray() }}>
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

function SchedulingCard({
  application,
  onOpen
}: {
  application: StaffApplication;
  onOpen: () => void;
}) {
  return (
    <article className={css`${liftCardClass}; display: flex; flex-direction: column;`}>
      <CrewCover cover={application.cover} height="7rem" rounded="0">
        <span
          className={css`
            position: absolute;
            left: 1.2rem;
            bottom: 0.8rem;
            color: #fff;
            font-size: 1.9rem;
            font-weight: bold;
            text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
          `}
        >
          {application.displayName}
        </span>
      </CrewCover>
      <div className={css`padding: 1.2rem; display: flex; flex-direction: column; gap: 1rem; flex: 1;`}>
        <div className={css`display: flex; gap: 1.2rem; align-items: center;`}>
          <CalendarChip date={application.plan.date} />
          <div style={{ minWidth: 0, fontSize: '1.3rem', color: Color.darkerGray() }}>
            <div style={{ display: 'flex', marginBottom: '0.4rem' }}>
              {application.members.slice(0, 5).map((member, index) => (
                <span
                  key={member.userId}
                  title={member.username}
                  className={css`
                    width: 3rem;
                    height: 3rem;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 2px solid #fff;
                    margin-left: ${index ? '-0.8rem' : 0};
                    display: inline-flex;
                  `}
                >
                  <ProfilePic userId={member.userId} profilePicUrl={member.profilePicUrl} style={{ width: '100%', height: '100%' }} />
                </span>
              ))}
            </div>
            {application.branchNames.join(' · ')}
            <span style={{ display: 'block' }}>
              <VenueSummary application={{ ...application, venue: { ...application.venue, slots: [] } }} />
            </span>
          </div>
        </div>
        {application.venue.slots.length > 0 && (
          <div className={css`display: flex; gap: 0.5rem; flex-wrap: wrap;`}>
            {application.venue.slots.map((slot, index) => (
              <CalendarChip key={index} date={slot.date} time={`${slot.start}–${slot.end}`} />
            ))}
          </div>
        )}
        <div style={{ marginTop: 'auto' }}>
          <Button color="logoBlue" stretch onClick={onOpen}>
            <Icon icon="clock" style={{ marginRight: '0.5rem' }} />
            Schedule this meetup
          </Button>
        </div>
      </div>
    </article>
  );
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
    margin: 1rem 0 0;
  }
`;

const EVENTS: Record<string, { label: string; icon: string; color: string }> = {
  crew_created: { label: 'Crew created', icon: 'users', color: '#418ceb' },
  plan_submitted: { label: 'Plan sent for review', icon: 'paper-plane', color: '#418ceb' },
  plan_approved: { label: 'Plan approved', icon: 'check-circle', color: '#28b62c' },
  plan_sent_back: { label: 'Plan sent back', icon: 'redo', color: '#e08a00' },
  plan_reset: { label: 'Crew changed: plan must be sent again', icon: 'redo', color: '#8a8a8a' },
  venue_changed: { label: 'Classroom/slots changed', icon: 'school', color: '#418ceb' },
  email_sent: { label: 'Briefing emailed to the coordinator', icon: 'paper-plane', color: '#139a9a' },
  email_resent: { label: 'Briefing resent to the coordinator', icon: 'paper-plane', color: '#139a9a' },
  email_failed: { label: 'Coordinator email failed', icon: 'exclamation-triangle', color: '#e0474c' },
  slot_set: { label: 'Slot set up', icon: 'clock', color: '#28b62c' },
  video_submitted: { label: 'Video sent', icon: 'film', color: '#139a9a' },
  video_sent_back: { label: 'Video sent back', icon: 'redo', color: '#e08a00' },
  completed: { label: 'Final review: approved', icon: 'trophy', color: '#e0a800' },
  disbanded: { label: 'Crew disbanded', icon: 'times', color: '#8a8a8a' },
  story_parent_email: { label: 'Parent email added for story photos', icon: 'paper-plane', color: '#418ceb' }
};

function eventText(event: StaffEvent) {
  const label = EVENTS[event.kind]?.label || event.kind;
  const by = event.actorUsername ? ` by ${event.actorUsername}` : '';
  if (event.kind === 'slot_set' && event.detail?.slot) return `${label}${by}: ${formatSlot(event.detail.slot)}`;
  if (event.kind === 'story_parent_email' && event.detail) {
    return `${label}${by}: ${event.detail.username || 'a member'} (${event.detail.email}, ${event.detail.count} of 3)`;
  }
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
  const myId = useKeyContext((v) => v.myState.userId);
  const [data, setData] = useState<StaffApplicationData | null>(null);
  const [error, setError] = useState('');
  const [choice, setChoice] = useState<number>(0);
  const [custom, setCustom] = useState({ date: '', start: '14:00', end: '16:00' });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const [justSet, setJustSet] = useState(false);
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
  const confirmed = application.venue.confirmedSlot;

  return (
    <div className={css`display: flex; flex-direction: column; gap: 1.8rem; margin-top: 1.8rem;`}>
      <article className={staffCardClass}>
        <ApplicationDetails application={application} achievementTitle={achievementTitle} />
      </article>

      <section
        className={css`
          ${staffCardClass};
          padding: 1.8rem 1.6rem;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.4rem 1rem;
          }
        `}
      >
        <h3 className={css`margin: 0; font-size: 1.9rem; font-weight: bold; color: ${Color.black()};`}>
          <Icon icon="clock" style={{ color: Color.logoBlue() }} /> Slot setup
        </h3>
        {confirmed && (
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 1.4rem;
              padding: 1.4rem;
              border-radius: 1.4rem;
              background: ${Color.green(0.1)};
              border: 1.5px solid ${Color.green(0.5)};
            `}
          >
            <span
              className={css`
                width: 5rem;
                height: 5rem;
                border-radius: 50%;
                background: ${Color.green()};
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.4rem;
                flex-shrink: 0;
                animation: ${justSet ? pop : 'none'} 0.6s ease-out;
                @media (prefers-reduced-motion: reduce) {
                  animation: none;
                }
              `}
            >
              <Icon icon="check" />
            </span>
            <span style={{ minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: '1.7rem', color: Color.black() }}>
                {justSet ? 'All set! The crew has been told.' : 'Slot is set up'}
              </b>
              <span style={{ fontSize: '1.4rem', color: Color.darkerGray() }}>
                {formatSlot(confirmed)}
                {application.venue.room ? ` · ${application.venue.branch} ${application.venue.room}` : ''}
                {application.venueSetBy ? ` · by ${application.venueSetBy.username}` : ''}
              </span>
            </span>
          </div>
        )}
        {canSetSlot ? (
          <>
            <span style={{ fontSize: '1.4rem', color: Color.darkerGray() }}>
              {confirmed ? 'Need to change it? Pick again:' : 'Which time did you arrange?'}
            </span>
            <div role="radiogroup" aria-label="Slot" className={css`display: flex; gap: 0.8rem; flex-wrap: wrap;`}>
              {offered.map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  role="radio"
                  aria-checked={choice === index}
                  disabled={readOnly}
                  onClick={() => setChoice(index)}
                  className={slotChoiceClass(choice === index)}
                >
                  <CalendarChip date={slot.date} time={`${slot.start}–${slot.end}`} />
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={useCustom}
                disabled={readOnly}
                onClick={() => setChoice(-1)}
                className={css`
                  ${slotChoiceClass(useCustom)};
                  min-width: 12rem;
                  font-size: 1.3rem;
                  font-weight: bold;
                  color: ${Color.darkerGray()};
                `}
              >
                <Icon icon="pencil-alt" style={{ marginRight: '0.4rem' }} />
                {offered.length ? 'A different time' : 'Enter the time'}
              </button>
            </div>
            {useCustom && (
              <div className={css`display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;`}>
                <DateCalendar value={custom.date} disabled={readOnly} placeholder="Date" onChange={(date) => setCustom({ ...custom, date })} />
                <input type="time" aria-label="Start" className={questInputClass} style={{ width: '13rem' }} value={custom.start} disabled={readOnly} onChange={(event) => setCustom({ ...custom, start: event.target.value })} />
                <span>–</span>
                <input type="time" aria-label="End" className={questInputClass} style={{ width: '13rem' }} value={custom.end} disabled={readOnly} onChange={(event) => setCustom({ ...custom, end: event.target.value })} />
              </div>
            )}
            <div>
              <Button color="green" size="lg" loading={busy} disabled={busy || readOnly} onClick={handleSetSlot}>
                <Icon icon="check" style={{ marginRight: '0.6rem' }} />
                Slot is set up
              </Button>
              <div className={questHelpClass} style={{ marginTop: '0.4rem' }}>
                The crew sees the final slot on its page and gets a message. The
                room booking itself happens through the academy.
              </div>
            </div>
          </>
        ) : (
          !confirmed && (
            <span className={questHelpClass}>
              {application.venue.status === 'cancelled'
                ? 'On hold: the crew changed or disbanded after approval.'
                : 'Nothing to set up right now.'}
            </span>
          )
        )}
        {headmaster && (
          <Link
            to={`/users/${headmaster.username}`}
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 1rem;
              align-self: flex-start;
              padding: 0.6rem 1.2rem 0.6rem 0.6rem;
              border-radius: 999px;
              border: 1px solid var(--ui-border);
              background: #fff;
              color: ${Color.black()};
              font-size: 1.35rem;
              &:hover {
                text-decoration: none;
                border-color: ${Color.logoBlue()};
              }
            `}
          >
            <span className={css`width: 3.2rem; height: 3.2rem; border-radius: 50%; overflow: hidden; display: inline-flex;`}>
              <ProfilePic userId={headmaster.userId} style={{ width: '100%', height: '100%' }} />
            </span>
            <span>
              Questions? Contact <b>{headmaster.realName || headmaster.username}</b>
              <span style={{ display: 'block', fontSize: '1.15rem', color: Color.darkGray() }}>
                The approving headmaster · message from their profile
              </span>
            </span>
          </Link>
        )}
        {message && <QuestNote tone="success">{message}</QuestNote>}
        {actionError && <QuestNote tone="warning">{actionError}</QuestNote>}
        {isAdmin && (
          <div className={css`display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center; border-top: 1px dashed var(--ui-border); padding-top: 1.2rem;`}>
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

      <div
        className={css`
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 1.8rem;
          @media (max-width: ${mobileMaxWidth}) {
            grid-template-columns: 1fr;
          }
        `}
      >
        <section className={css`${staffCardClass}; padding: 1.6rem; display: flex; flex-direction: column; gap: 1rem; @media (max-width: ${mobileMaxWidth}) { padding: 1.4rem 1rem; }`}>
          <h3 className={css`margin: 0; font-size: 1.8rem; font-weight: bold;`}>
            <Icon icon="comments" style={{ color: Color.logoBlue() }} /> Staff notes
          </h3>
          <span className={questHelpClass}>Only staff see these. The crew never does.</span>
          {notes.length === 0 && (
            <span style={{ fontSize: '1.35rem', color: Color.darkGray() }}>
              No notes yet. Jot down calls, bookings or reminders here. ✏️
            </span>
          )}
          {notes.map((item) => {
            const mine = item.authorId === myId;
            return (
              <div key={item.id} className={css`display: flex; gap: 0.8rem; align-items: flex-end; flex-direction: ${mine ? 'row-reverse' : 'row'};`}>
                <span className={css`width: 3rem; height: 3rem; border-radius: 50%; overflow: hidden; flex-shrink: 0; display: inline-flex;`}>
                  <ProfilePic userId={item.authorId} style={{ width: '100%', height: '100%' }} />
                </span>
                <div
                  className={css`
                    max-width: 85%;
                    padding: 0.8rem 1.1rem;
                    border-radius: 1.4rem;
                    border-bottom-${mine ? 'right' : 'left'}-radius: 0.3rem;
                    background: ${mine ? Color.logoBlue(0.12) : Color.extraLightGray()};
                    font-size: 1.35rem;
                    white-space: pre-wrap;
                    overflow-wrap: anywhere;
                  `}
                >
                  <span style={{ display: 'block', fontSize: '1.15rem', color: Color.darkGray(), marginBottom: '0.2rem' }}>
                    <b>{item.username || 'staff'}</b> · {formatTime(item.createdAt)}
                  </span>
                  {item.note}
                </div>
              </div>
            );
          })}
          <div className={css`display: flex; gap: 0.6rem; align-items: flex-end; margin-top: 0.4rem;`}>
            <textarea
              aria-label="Add a staff note"
              className={questInputClass}
              rows={2}
              maxLength={2000}
              value={note}
              disabled={readOnly}
              placeholder="Add a note…"
              onChange={(event) => setNote(event.target.value)}
            />
            <Button color="logoBlue" disabled={busy || readOnly || !note.trim()} onClick={handleNote}>
              <Icon icon="paper-plane" />
            </Button>
          </div>
        </section>

        <section className={css`${staffCardClass}; padding: 1.6rem; @media (max-width: ${mobileMaxWidth}) { padding: 1.4rem 1rem; }`}>
          <h3 className={css`margin: 0 0 1.2rem; font-size: 1.8rem; font-weight: bold;`}>
            <Icon icon="history" style={{ color: Color.logoBlue() }} /> Timeline
          </h3>
          {events.length === 0 && <span className={questHelpClass}>No events recorded yet.</span>}
          <ol className={css`list-style: none; margin: 0; padding: 0; position: relative;`}>
            {events.map((event, index) => {
              const style = EVENTS[event.kind] || { icon: 'circle', color: '#8a8a8a' };
              return (
                <li key={event.id} className={css`display: flex; gap: 1rem; position: relative; padding-bottom: ${index === events.length - 1 ? 0 : '1.2rem'};`}>
                  {index < events.length - 1 && (
                    <span aria-hidden className={css`position: absolute; left: 1.45rem; top: 3rem; bottom: 0; width: 2px; background: var(--ui-border);`} />
                  )}
                  <span
                    className={css`
                      width: 3rem;
                      height: 3rem;
                      border-radius: 50%;
                      flex-shrink: 0;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 1.3rem;
                      color: #fff;
                      background: ${style.color};
                    `}
                  >
                    <Icon icon={style.icon} />
                  </span>
                  <span style={{ minWidth: 0, paddingTop: '0.3rem' }}>
                    <span style={{ display: 'block', fontSize: '1.4rem', color: Color.black() }}>{eventText(event)}</span>
                    <span style={{ fontSize: '1.15rem', color: Color.darkGray() }}>{formatTime(event.createdAt)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

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
    if (busy || readOnly) return false;
    setBusy(true);
    setActionError('');
    setMessage('');
    try {
      await action();
      if (done) setMessage(done);
      await Promise.all([load(), onChanged()]);
      return true;
    } catch (err: any) {
      setActionError(err?.message || 'Something went wrong.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleSetSlot() {
    const ok = await run(
      () => confirmMeetupSlot(useCustom ? { crewId, slot: custom } : { crewId, slotIndex: choice }),
      ''
    );
    if (ok) setJustSet(true);
  }

  function handleNote() {
    return run(async () => {
      await addMeetupStaffNote({ crewId, note });
      setNote('');
    }, '');
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

const slotChoiceClass = (active: boolean) => css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 1.3rem;
  border: 2px solid ${active ? Color.logoBlue() : 'var(--ui-border)'};
  background: ${active ? Color.logoBlue(0.08) : '#fff'};
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
  &:hover {
    transform: translateY(-1px);
  }
  &:disabled {
    cursor: default;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
