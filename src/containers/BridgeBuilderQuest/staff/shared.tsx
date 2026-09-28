import React from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import CrewCover from '../CrewCover';
import { BranchChips } from '../DirectoryCard';
import { questHelpClass, questInputClass, questLabelClass } from '../StepCard';
import type {
  CoordinatorStatus,
  MeetupSlot,
  StaffApplication,
  StaffMemberOption,
  StaffViewer
} from '../types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatSlot(slot: MeetupSlot) {
  const match = slot.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const day = match
    ? WEEKDAYS[new Date(Date.UTC(+match[1], +match[2] - 1, +match[3])).getUTCDay()]
    : '';
  return `${day} ${slot.date} · ${slot.start}–${slot.end}`;
}

export function formatTime(seconds: number) {
  if (!seconds) return '';
  return new Date(seconds * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export const COORDINATOR_CHIPS: Record<CoordinatorStatus, { label: string; color: string }> = {
  needs_scheduling: { label: 'Needs scheduling', color: '#e08a00' },
  scheduled: { label: 'Scheduled', color: '#418ceb' },
  filmed: { label: 'Met & filmed', color: '#139a9a' },
  done: { label: 'Done', color: '#28a745' },
  on_hold: { label: 'On hold', color: '#888888' }
};

export function CoordinatorChip({ status }: { status: CoordinatorStatus }) {
  const chip = COORDINATOR_CHIPS[status];
  return (
    <span
      className={css`
        display: inline-block;
        padding: 0.2rem 0.9rem;
        border-radius: 999px;
        font-size: 1.2rem;
        font-weight: bold;
        color: #fff;
        background: ${chip.color};
        white-space: nowrap;
      `}
    >
      {chip.label}
    </span>
  );
}

export const staffCardClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 1.2rem;
  background: #fff;
  overflow: hidden;
`;

export const staffHeadingClass = css`
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  color: ${Color.black()};
`;

// Admins: "View as" a headmaster or the coordinator. The page then renders
// that person's own server response; actions are off while previewing.
export function ViewAsBar({
  viewer,
  options,
  viewAs,
  onChange
}: {
  viewer: StaffViewer;
  options: StaffMemberOption[] | null;
  viewAs: number;
  onChange: (userId: number) => void;
}) {
  return (
    <>
      {options && (
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.6rem;
            flex-wrap: wrap;
            margin-top: 1.2rem;
            font-size: 1.3rem;
            @media (max-width: ${mobileMaxWidth}) {
              margin: 1.2rem 1rem 0;
            }
          `}
        >
          <b style={{ color: Color.darkGray() }}>View as:</b>
          <Button
            size="sm"
            variant={!viewAs ? 'solid' : 'outline'}
            color="logoBlue"
            onClick={() => onChange(0)}
          >
            Admin (you)
          </Button>
          {options.map((option) => (
            <Button
              key={`${option.userId}-${option.role}`}
              size="sm"
              variant={viewAs === option.userId ? 'solid' : 'outline'}
              color="logoBlue"
              onClick={() => onChange(option.userId)}
            >
              {option.role === 'reviewer' ? 'Headmaster' : 'Coordinator'} ({option.username})
            </Button>
          ))}
          {options.length === 0 && (
            <span className={questHelpClass}>No headmasters or coordinator are set up yet.</span>
          )}
        </div>
      )}
      {viewer.preview && (
        <div
          role="status"
          className={css`
            margin-top: 1rem;
            padding: 0.8rem 1.2rem;
            border-radius: 0.8rem;
            background: ${Color.logoBlue(0.12)};
            border: 1px solid ${Color.logoBlue(0.4)};
            font-size: 1.3rem;
            font-weight: bold;
            color: ${Color.logoBlue()};
          `}
        >
          <Icon icon="eye" /> Preview as {viewer.username}: actions off
        </div>
      )}
    </>
  );
}

export function StaffNav({
  summary
}: {
  summary: { canReviewPlans: boolean; canCoordinate: boolean; plansWaiting: number; needsScheduling: number };
}) {
  const badge = (count: number) =>
    count > 0 ? (
      <span
        className={css`
          margin-left: 0.5rem;
          padding: 0 0.7rem;
          border-radius: 999px;
          background: ${Color.red()};
          color: #fff;
          font-size: 1.1rem;
        `}
      >
        {count}
      </span>
    ) : null;
  const linkClass = css`
    display: inline-flex;
    align-items: center;
    font-size: 1.4rem;
    font-weight: bold;
    color: ${Color.logoBlue()};
  `;
  return (
    <div
      className={css`
        display: flex;
        gap: 1.6rem;
        flex-wrap: wrap;
      `}
    >
      {summary.canReviewPlans && (
        <Link className={linkClass} to="/achievements/bridge-builder/desk">
          <Icon icon="clipboard-check" style={{ marginRight: '0.5rem' }} />
          Headmaster desk{badge(summary.plansWaiting)}
        </Link>
      )}
      {summary.canCoordinate && (
        <Link className={linkClass} to="/achievements/bridge-builder/coordinator">
          <Icon icon="clock" style={{ marginRight: '0.5rem' }} />
          Coordinator desk{badge(summary.needsScheduling)}
        </Link>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: 14rem minmax(0, 1fr);
        gap: 1rem;
        font-size: 1.4rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--ui-border);
        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 1fr;
          gap: 0.2rem;
        }
      `}
    >
      <span style={{ color: Color.darkGray(), fontWeight: 'bold' }}>{label}</span>
      <span style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{children}</span>
    </div>
  );
}

export function VenueSummary({ application }: { application: StaffApplication }) {
  const { venue } = application;
  if (venue.status === 'none') return <>Not decided</>;
  if (venue.status === 'cancelled') return <>On hold (the crew changed after approval)</>;
  return (
    <>
      {venue.room ? (
        <>
          <b>{venue.branch}</b> · {venue.room}
        </>
      ) : (
        'No classroom: the crew meets elsewhere with its grown-up'
      )}
      {venue.slots.length > 0 && (
        <span style={{ display: 'block', color: Color.darkerGray() }}>
          Offered: {venue.slots.map(formatSlot).join(' / ')}
        </span>
      )}
      {venue.confirmedSlot && (
        <span style={{ display: 'block', color: Color.green(), fontWeight: 'bold' }}>
          Set up: {formatSlot(venue.confirmedSlot)}
          {application.venueSetBy ? ` (by ${application.venueSetBy.username})` : ''}
        </span>
      )}
    </>
  );
}

// Everything staff need about one application.
export function ApplicationDetails({
  application,
  achievementTitle,
  showDecision = true
}: {
  application: StaffApplication;
  achievementTitle: string;
  showDecision?: boolean;
}) {
  return (
    <div>
      <CrewCover
        cover={application.cover}
        height="6rem"
        stage={application.stage}
        achievementTitle={achievementTitle}
        rounded="0"
      />
      <div
        className={css`
          padding: 1.4rem 1.6rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.2rem 1rem;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.8rem;
            flex-wrap: wrap;
          `}
        >
          <h3 className={staffHeadingClass}>{application.displayName}</h3>
          <span style={{ color: Color.darkGray(), fontSize: '1.3rem' }}>#{application.crewId}</span>
          {application.plan.reviewedAt > 0 && <CoordinatorChip status={application.coordinatorStatus} />}
        </div>
        <BranchChips names={application.branchNames} />
        <div>
          <span className={questLabelClass}>Members</span>
          <div
            className={css`
              border: 1px solid var(--ui-border);
              border-radius: 0.8rem;
              overflow: hidden;
            `}
          >
            {application.members.map((member) => (
              <div
                key={member.userId}
                className={css`
                  display: grid;
                  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) auto;
                  gap: 0.8rem;
                  padding: 0.6rem 0.9rem;
                  font-size: 1.35rem;
                  border-bottom: 1px solid var(--ui-border);
                  &:last-child {
                    border-bottom: 0;
                  }
                `}
              >
                <span style={{ overflowWrap: 'anywhere' }}>
                  <b>{member.username}</b>
                  {member.realName ? ` · ${member.realName}` : ''}
                  {member.isFounder ? ' 👑' : ''}
                </span>
                <span>{member.branch}</span>
                <span style={{ color: member.parentOk ? Color.green() : Color.orange() }}>
                  <Icon icon={member.parentOk ? 'check-circle' : 'exclamation-circle'} />{' '}
                  {member.parentOk ? 'Parent OK' : 'Parent not yet'}
                </span>
              </div>
            ))}
          </div>
          <span className={questHelpClass}>The parent OK is ticked by each student themselves.</span>
        </div>
        <div>
          <Row label="Grown-up coming">
            {application.adult.kind
              ? `${application.adult.kind === 'teacher' ? 'Twinkle teacher' : 'Parent'}: ${application.adult.name}`
              : 'Not named'}
          </Row>
          <Row label="Proposed date">{application.plan.date || '—'}</Row>
          <Row label="General area">{application.plan.area || '—'}</Row>
          <Row label="Activity">{application.plan.activity || '—'}</Row>
          {application.plan.submittedAt > 0 && (
            <Row label="Plan sent">{formatTime(application.plan.submittedAt)}</Row>
          )}
          {showDecision && application.plan.reviewedAt > 0 && (
            <>
              <Row label="Decision">
                {application.plan.status === 'sent_back' ? 'Sent back' : 'Approved'}
                {application.decidedBy ? ` by ${application.decidedBy.username}` : ''} ·{' '}
                {formatTime(application.plan.reviewedAt)}
              </Row>
              {application.plan.note && <Row label="Headmaster note">{application.plan.note}</Row>}
              <Row label="Classroom">
                <VenueSummary application={application} />
              </Row>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export interface VenueDraft {
  mode: 'later' | 'none' | 'offer';
  branch: string;
  room: string;
  slots: MeetupSlot[];
}

export function emptyVenueDraft(branch = ''): VenueDraft {
  return { mode: 'later', branch, room: '', slots: [{ date: '', start: '14:00', end: '16:00' }] };
}

export function venueFromDraft(draft: VenueDraft) {
  if (draft.mode === 'later') return undefined;
  if (draft.mode === 'none') return { mode: 'none' };
  return { mode: 'offer', branch: draft.branch, room: draft.room, slots: draft.slots };
}

// A headmaster's classroom offer: branch (suggested from the crew's
// branches) + classroom + one or more slots, or "no classroom".
export function VenueForm({
  idPrefix,
  draft,
  branchSuggestions,
  allowLater = true,
  disabled,
  onChange
}: {
  idPrefix: string;
  draft: VenueDraft;
  branchSuggestions: string[];
  allowLater?: boolean;
  disabled?: boolean;
  onChange: (draft: VenueDraft) => void;
}) {
  const modes: [VenueDraft['mode'], string][] = [
    ...(allowLater ? ([['later', 'No classroom offer']] as [VenueDraft['mode'], string][]) : []),
    ['offer', 'Offer a classroom'],
    ['none', 'No classroom available']
  ];
  return (
    <div className={css`display: flex; flex-direction: column; gap: 0.8rem;`}>
      <div className={css`display: flex; gap: 0.5rem; flex-wrap: wrap;`}>
        {modes.map(([mode, label]) => (
          <Button
            key={mode}
            size="sm"
            variant={draft.mode === mode ? 'solid' : 'outline'}
            color="logoBlue"
            aria-pressed={draft.mode === mode}
            disabled={disabled}
            onClick={() => onChange({ ...draft, mode })}
          >
            {label}
          </Button>
        ))}
      </div>
      {draft.mode === 'none' && (
        <span className={questHelpClass}>
          The crew meets elsewhere with its grown-up. The coordinator still gets
          the briefing to help schedule it.
        </span>
      )}
      {draft.mode === 'offer' && (
        <>
          <div
            className={css`
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.8rem;
              @media (max-width: ${mobileMaxWidth}) {
                grid-template-columns: 1fr;
              }
            `}
          >
            <div>
              <label className={questLabelClass} htmlFor={`${idPrefix}-branch`}>
                Branch
              </label>
              <input
                id={`${idPrefix}-branch`}
                list={`${idPrefix}-branches`}
                className={questInputClass}
                value={draft.branch}
                maxLength={40}
                disabled={disabled}
                onChange={(event) => onChange({ ...draft, branch: event.target.value })}
              />
              <datalist id={`${idPrefix}-branches`}>
                {branchSuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={questLabelClass} htmlFor={`${idPrefix}-room`}>
                Classroom
              </label>
              <input
                id={`${idPrefix}-room`}
                className={questInputClass}
                value={draft.room}
                maxLength={60}
                placeholder="For example: Room 302"
                disabled={disabled}
                onChange={(event) => onChange({ ...draft, room: event.target.value })}
              />
            </div>
          </div>
          <span className={questLabelClass}>Time slots</span>
          {draft.slots.map((slot, index) => (
            <div
              key={index}
              className={css`
                display: flex;
                gap: 0.5rem;
                align-items: center;
                flex-wrap: wrap;
              `}
            >
              <input
                type="date"
                aria-label="Slot date"
                className={questInputClass}
                style={{ width: '15rem' }}
                value={slot.date}
                disabled={disabled}
                onChange={(event) => updateSlot(index, { date: event.target.value })}
              />
              <input
                type="time"
                aria-label="Start time"
                className={questInputClass}
                style={{ width: '10rem' }}
                value={slot.start}
                disabled={disabled}
                onChange={(event) => updateSlot(index, { start: event.target.value })}
              />
              <span>–</span>
              <input
                type="time"
                aria-label="End time"
                className={questInputClass}
                style={{ width: '10rem' }}
                value={slot.end}
                disabled={disabled}
                onChange={(event) => updateSlot(index, { end: event.target.value })}
              />
              {draft.slots.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  color="darkGray"
                  disabled={disabled}
                  onClick={() =>
                    onChange({ ...draft, slots: draft.slots.filter((_, i) => i !== index) })
                  }
                >
                  <Icon icon="times" />
                </Button>
              )}
            </div>
          ))}
          {draft.slots.length < 5 && (
            <div>
              <Button
                size="sm"
                variant="soft"
                color="logoBlue"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    ...draft,
                    slots: [...draft.slots, { date: '', start: '14:00', end: '16:00' }]
                  })
                }
              >
                <Icon icon="plus" style={{ marginRight: '0.4rem' }} />
                Add a slot
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  function updateSlot(index: number, patch: Partial<MeetupSlot>) {
    onChange({
      ...draft,
      slots: draft.slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot))
    });
  }
}
