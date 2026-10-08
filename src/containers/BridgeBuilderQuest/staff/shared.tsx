import ParentContactsAdmin from '../Parent/ParentContactsAdmin';
import React, { useEffect, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import { Link } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import DateCalendar from '~/components/DateCalendar';
import ProfilePic from '~/components/ProfilePic';
import { Color, mobileMaxWidth } from '~/constants/css';
import CrewCover, { StageBadge } from '../CrewCover';
import { questHelpClass, questInputClass, questLabelClass } from '../StepCard';
import type {
  CoordinatorStatus,
  MeetupSlot,
  StaffApplication,
  StaffMemberOption,
  StaffSummary,
  StaffViewer
} from '../types';

// ---- Formatting ----

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(date: string) {
  const match = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const value = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  return { value, month: MONTHS[+match[2] - 1], day: +match[3], weekday: WEEKDAYS[value.getUTCDay()] };
}

export function formatSlot(slot: MeetupSlot) {
  const parsed = parseDate(slot.date);
  return `${parsed ? `${parsed.weekday} ` : ''}${slot.date} · ${slot.start}–${slot.end}`;
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

export function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  const parsed = parseDate(date);
  if (!parsed) return date;
  return new Date(parsed.value.getTime() + days * 86400_000).toISOString().slice(0, 10);
}

function firstName(viewer: { realName?: string; username: string }) {
  return (viewer.realName || '').trim().split(/\s+/)[0] || viewer.username;
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

// ---- Motion (subtle, and off for reduced-motion users) ----

const noMotion = `
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    transition: none !important;
  }
`;

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const liftCardClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 1.6rem;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 0.2rem 0.8rem rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: ${riseIn} 0.35s ease-out;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.8rem 2.2rem rgba(0, 0, 0, 0.09);
  }
  ${noMotion}
`;

export const staffCardClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 1.6rem;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 0.2rem 0.8rem rgba(0, 0, 0, 0.04);
`;

export const staffHeadingClass = css`
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  color: ${Color.black()};
`;

export const sectionTitleClass = css`
  margin: 3rem 0 1.2rem;
  font-size: 2rem;
  font-weight: bold;
  color: ${Color.black()};
  display: flex;
  align-items: center;
  gap: 0.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    margin: 2.4rem 0 1rem;
  }
`;

export function CountBubble({ count, color = Color.logoBlue() }: { count: number; color?: string }) {
  return (
    <span
      className={css`
        min-width: 2.6rem;
        padding: 0.1rem 0.8rem;
        border-radius: 999px;
        background: ${color};
        color: #fff;
        font-size: 1.3rem;
        text-align: center;
      `}
    >
      {count}
    </span>
  );
}

// Staff pages keep a gutter on phones (cards are rounded, not full-bleed).
export const staffMainGutterClass = css`
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 1rem;
    box-sizing: border-box;
  }
`;

// ---- Status chips ----

export const COORDINATOR_CHIPS: Record<
  CoordinatorStatus,
  { label: string; color: string; icon: string }
> = {
  needs_scheduling: { label: 'Needs scheduling', color: '#e08a00', icon: 'clock' },
  scheduled: { label: 'Scheduled', color: '#418ceb', icon: 'check-circle' },
  filmed: { label: 'Met & filmed', color: '#139a9a', icon: 'film' },
  done: { label: 'Done', color: '#28a745', icon: 'trophy' },
  on_hold: { label: 'On hold', color: '#8a8a8a', icon: 'pause' }
};

export function CoordinatorChip({ status }: { status: CoordinatorStatus }) {
  const chip = COORDINATOR_CHIPS[status];
  return (
    <span
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.3rem 1rem;
        border-radius: 999px;
        font-size: 1.2rem;
        font-weight: bold;
        color: ${chip.color};
        background: #fff;
        border: 1.5px solid ${chip.color};
        white-space: nowrap;
      `}
    >
      <Icon icon={chip.icon} />
      {chip.label}
    </span>
  );
}

// ---- Welcome header ----

export interface StatTileData {
  icon: string;
  label: string;
  // the summary line's wording for exactly one ("plan waiting")
  one?: string;
  value: number;
  color: string;
}

export function WelcomeHeader({
  viewer,
  title,
  lead,
  stats,
  summary
}: {
  viewer: StaffViewer;
  title: string;
  lead: string;
  stats: StatTileData[];
  summary: StaffSummary;
}) {
  const line = stats
    .filter((stat) => stat.value > 0)
    .map((stat) => `${stat.value} ${stat.value === 1 && stat.one ? stat.one : stat.label.toLowerCase()}`)
    .join(' · ');
  return (
    <section
      className={css`
        margin-top: 1.4rem;
        border-radius: 2rem;
        background: #fff;
        border: 1px solid var(--ui-border);
        box-shadow: 0 0.4rem 1.6rem rgba(65, 140, 235, 0.08);
        overflow: hidden;
      `}
    >
      <div
        className={css`
          background: ${Color.logoBlue(0.08)};
          padding: 2rem 2.2rem 1.6rem;
          display: flex;
          gap: 1.6rem;
          align-items: center;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.6rem 1.2rem 1.2rem;
            gap: 1.2rem;
          }
        `}
      >
        <span
          className={css`
            width: 6.4rem;
            height: 6.4rem;
            flex-shrink: 0;
            border-radius: 50%;
            border: 3px solid #fff;
            box-shadow: 0 0.2rem 0.8rem rgba(0, 0, 0, 0.12);
            overflow: hidden;
            @media (max-width: ${mobileMaxWidth}) {
              width: 5rem;
              height: 5rem;
            }
          `}
        >
          <ProfilePic
            userId={viewer.userId}
            profilePicUrl={viewer.profilePicUrl}
            style={{ width: '100%', height: '100%' }}
          />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className={css`font-size: 1.3rem; font-weight: bold; color: ${Color.logoBlue()}; text-transform: uppercase; letter-spacing: 0.06em;`}>
            {title}
          </div>
          <h1
            className={css`
              margin: 0.2rem 0 0;
              font-size: 2.6rem;
              font-weight: bold;
              color: ${Color.black()};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2.1rem;
              }
            `}
          >
            {greeting()}, {firstName(viewer)} 👋
          </h1>
          <p className={css`margin: 0.3rem 0 0; font-size: 1.45rem; color: ${Color.darkerGray()};`}>
            {line || lead}
          </p>
        </div>
      </div>
      <div
        className={css`
          display: grid;
          grid-template-columns: repeat(${stats.length}, minmax(0, 1fr));
          gap: 1rem;
          padding: 1.4rem 2.2rem 1.6rem;
          @media (max-width: ${mobileMaxWidth}) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 1.2rem;
          }
        `}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={css`
              display: flex;
              align-items: center;
              gap: 1rem;
              padding: 1rem 1.2rem;
              border-radius: 1.2rem;
              background: #fff;
              border: 1px solid var(--ui-border);
              transition: transform 0.2s ease;
              &:hover {
                transform: translateY(-2px);
              }
              ${noMotion}
            `}
          >
            <span
              className={css`
                width: 3.8rem;
                height: 3.8rem;
                border-radius: 1rem;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.7rem;
                color: ${stat.color};
                background: ${stat.color}1f;
              `}
            >
              <Icon icon={stat.icon} />
            </span>
            <span style={{ minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: '2.2rem', lineHeight: 1.1, color: Color.black() }}>
                {stat.value}
              </b>
              <span style={{ fontSize: '1.2rem', color: Color.darkGray() }}>{stat.label}</span>
            </span>
          </div>
        ))}
      </div>
      <div className={css`padding: 0 2.2rem 1.6rem; @media (max-width: ${mobileMaxWidth}) { padding: 0 1.2rem 1.4rem; }`}>
        <StaffNav summary={summary} />
      </div>
    </section>
  );
}

// ---- Staff navigation (quest page + desks) ----

export function StaffNav({
  summary
}: {
  summary: { canReviewPlans: boolean; canCoordinate: boolean; plansWaiting: number; needsScheduling: number };
}) {
  const pill = css`
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1.2rem;
    border-radius: 999px;
    border: 1.5px solid ${Color.logoBlue(0.5)};
    background: #fff;
    font-size: 1.35rem;
    font-weight: bold;
    color: ${Color.logoBlue()};
    transition: background 0.15s ease;
    &:hover {
      background: ${Color.logoBlue(0.08)};
      text-decoration: none;
    }
    ${noMotion}
  `;
  const badge = (count: number) =>
    count > 0 ? <CountBubble count={count} color={Color.orange()} /> : null;
  return (
    <div className={css`display: flex; gap: 0.8rem; flex-wrap: wrap;`}>
      {summary.canReviewPlans && (
        <Link className={pill} to="/achievements/bridge-builder/desk">
          <Icon icon="clipboard-check" />
          Headmaster desk
          {badge(summary.plansWaiting)}
        </Link>
      )}
      {summary.canCoordinate && (
        <Link className={pill} to="/achievements/bridge-builder/coordinator">
          <Icon icon="clock" />
          Coordinator desk
          {badge(summary.needsScheduling)}
        </Link>
      )}
    </div>
  );
}

// ---- View as (admins) ----

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
  const chip = (active: boolean) => css`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 1rem 0.4rem 0.4rem;
    border-radius: 999px;
    border: 1.5px solid ${active ? Color.logoBlue() : 'var(--ui-border)'};
    background: ${active ? Color.logoBlue(0.1) : '#fff'};
    color: ${active ? Color.logoBlue() : Color.darkerGray()};
    font-size: 1.25rem;
    font-weight: bold;
    cursor: pointer;
    white-space: nowrap;
  `;
  return (
    <>
      {options && (
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.6rem;
            margin-top: 1.2rem;
            overflow-x: auto;
            padding-bottom: 0.3rem;
          `}
        >
          <span style={{ fontSize: '1.25rem', color: Color.darkGray(), whiteSpace: 'nowrap' }}>
            <Icon icon="eye" /> View as
          </span>
          <button type="button" className={chip(!viewAs)} onClick={() => onChange(0)}>
            <span className={css`width: 2.4rem; height: 2.4rem; border-radius: 50%; background: ${Color.logoBlue(0.15)}; display: inline-flex; align-items: center; justify-content: center;`}>
              <Icon icon="crown" />
            </span>
            Admin (you)
          </button>
          {options.map((option) => (
            <button
              key={`${option.userId}-${option.role}`}
              type="button"
              aria-pressed={viewAs === option.userId}
              className={chip(viewAs === option.userId)}
              onClick={() => onChange(option.userId)}
            >
              <span className={css`width: 2.4rem; height: 2.4rem; border-radius: 50%; overflow: hidden; display: inline-flex;`}>
                <ProfilePic userId={option.userId} style={{ width: '100%', height: '100%' }} />
              </span>
              {option.role === 'reviewer' ? 'Headmaster' : 'Coordinator'} · {option.username}
            </button>
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
            padding: 0.9rem 1.2rem;
            border-radius: 1rem;
            background: ${Color.logoBlue(0.1)};
            border: 1px dashed ${Color.logoBlue(0.6)};
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

// ---- Building blocks of an application card ----

export function CalendarChip({ date, time }: { date: string; time?: string }) {
  const parsed = parseDate(date);
  if (!parsed) return null;
  return (
    <span
      title={date}
      className={css`
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        min-width: 6.2rem;
        flex-shrink: 0;
        border-radius: 1rem;
        overflow: hidden;
        border: 1px solid var(--ui-border);
        background: #fff;
        box-shadow: 0 0.1rem 0.4rem rgba(0, 0, 0, 0.06);
      `}
    >
      <span
        className={css`
          width: 100%;
          text-align: center;
          background: ${Color.logoBlue()};
          color: #fff;
          font-size: 1.1rem;
          font-weight: bold;
          letter-spacing: 0.08em;
          padding: 0.15rem 0;
        `}
      >
        {parsed.month.toUpperCase()}
      </span>
      <b style={{ fontSize: '2.2rem', lineHeight: 1.2, color: Color.black() }}>{parsed.day}</b>
      <span style={{ fontSize: '1.1rem', color: Color.darkGray(), padding: '0 0.6rem 0.3rem', whiteSpace: 'nowrap' }}>
        {time ? `${parsed.weekday} ${time}` : parsed.weekday}
      </span>
    </span>
  );
}

// The server's adultForDisplay: nobody is shown as coming who does not count
// (a teacher only after they confirmed; a classroom names no person).
export function GrownUpBadge({
  adult
}: {
  adult: { kind: string; name: string; status?: string; waitingFor?: string };
}) {
  if (!adult.kind) return null;
  const teacher = adult.kind === 'teacher';
  const classroom = adult.kind === 'classroom';
  const waiting = adult.status === 'waiting';
  return (
    <span
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.4rem 1.1rem;
        border-radius: 999px;
        background: ${Color.green(0.1)};
        color: ${Color.darkerGray()};
        font-size: 1.3rem;
        border: 1px solid ${Color.green(0.35)};
      `}
    >
      <Icon
        icon={teacher || classroom ? 'chalkboard-teacher' : 'user'}
        style={{ color: waiting ? Color.orange() : Color.green() }}
      />
      <span>
        {classroom ? (
          adult.status === 'confirmed' && adult.name ? (
            <>Supervised at <b>{adult.name}</b></>
          ) : (
            'Twinkle arranges the grown-up (classroom)'
          )
        ) : waiting ? (
          <>Waiting for Twinkle teacher <b>{adult.waitingFor}</b> to confirm</>
        ) : (
          <>{teacher ? 'Twinkle teacher' : 'Parent'}: <b>{adult.name}</b></>
        )}
      </span>
    </span>
  );
}

export function ActivityQuote({ text }: { text: string }) {
  if (!text) return null;
  return (
    <blockquote
      className={css`
        margin: 0;
        position: relative;
        padding: 1.2rem 1.4rem 1.2rem 4.2rem;
        border-radius: 1.2rem;
        background: ${Color.logoBlue(0.06)};
        border-left: 4px solid ${Color.logoBlue()};
        font-size: 1.5rem;
        line-height: 1.55;
        color: ${Color.black()};
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      `}
    >
      <span
        aria-hidden
        className={css`
          position: absolute;
          left: 1.3rem;
          top: 0.4rem;
          font-size: 3.4rem;
          font-family: Georgia, serif;
          color: ${Color.logoBlue(0.6)};
        `}
      >
        “
      </span>
      {text}
    </blockquote>
  );
}

export function MemberStrip({ members }: { members: StaffApplication['members'] }) {
  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
        gap: 0.8rem;
      `}
    >
      {members.map((member) => (
        <div
          key={member.userId}
          className={css`
            display: flex;
            align-items: center;
            gap: 0.9rem;
            padding: 0.7rem 0.9rem;
            border-radius: 1.2rem;
            border: 1px solid var(--ui-border);
            background: #fff;
            min-width: 0;
          `}
        >
          <span className={css`position: relative; width: 4rem; height: 4rem; flex-shrink: 0;`}>
            <span className={css`display: block; width: 100%; height: 100%; border-radius: 50%; overflow: hidden;`}>
              <ProfilePic userId={member.userId} profilePicUrl={member.profilePicUrl} style={{ width: '100%', height: '100%' }} />
            </span>
            <span
              title={member.parentOk ? 'Parent OK (ticked by the student)' : 'Parent not yet'}
              className={css`
                position: absolute;
                right: -0.3rem;
                bottom: -0.3rem;
                width: 1.9rem;
                height: 1.9rem;
                border-radius: 50%;
                border: 2px solid #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                color: #fff;
                background: ${member.parentOk ? Color.green() : Color.orange()};
              `}
            >
              <Icon icon={member.parentOk ? 'check' : 'question'} />
            </span>
          </span>
          <span style={{ minWidth: 0 }}>
            <b style={{ display: 'block', fontSize: '1.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {member.username}
              {member.isFounder ? ' 👑' : ''}
            </b>
            <span style={{ display: 'block', fontSize: '1.2rem', color: Color.darkGray(), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {member.realName || '—'}
            </span>
            <span
              className={css`
                display: inline-block;
                margin-top: 0.2rem;
                padding: 0 0.7rem;
                border-radius: 999px;
                background: ${Color.logoBlue(0.1)};
                color: ${Color.darkBlue()};
                font-size: 1.1rem;
                font-weight: bold;
              `}
            >
              {member.branch}
            </span>
          </span>
        </div>
      ))}
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
      {venue.confirmedSlot ? (
        <span style={{ display: 'block', color: Color.green(), fontWeight: 'bold' }}>
          Set up: {formatSlot(venue.confirmedSlot)}
          {application.venueSetBy ? ` (by ${application.venueSetBy.username})` : ''}
        </span>
      ) : venue.slots.length > 0 ? (
        <span style={{ display: 'block', color: Color.darkerGray() }}>
          Offered: {venue.slots.map(formatSlot).join(' / ')}
        </span>
      ) : null}
    </>
  );
}

function InfoLine({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className={css`display: flex; gap: 0.8rem; align-items: flex-start; font-size: 1.35rem; color: ${Color.darkerGray()};`}>
      <span className={css`width: 2.4rem; flex-shrink: 0; text-align: center; color: ${Color.logoBlue()};`}>
        <Icon icon={icon} />
      </span>
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{children}</span>
    </div>
  );
}

// One application, presented like the student crew cards: cover, avatars,
// the activity as a quote, the date as a calendar chip.
export function ApplicationDetails({
  application,
  achievementTitle,
  showDecision = true
}: {
  application: StaffApplication;
  achievementTitle: string;
  showDecision?: boolean;
}) {
  const decided = showDecision && application.plan.reviewedAt > 0;
  return (
    <div>
      <CrewCover cover={application.cover} height="9rem" rounded="0">
        <div
          className={css`
            position: absolute;
            left: 1.6rem;
            right: 1.6rem;
            bottom: 1rem;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 1rem;
          `}
        >
          <span style={{ minWidth: 0 }}>
            <span
              className={css`
                display: block;
                color: #fff;
                font-size: 2.2rem;
                font-weight: bold;
                text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              `}
            >
              {application.displayName}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem' }}>
              Crew #{application.crewId} · {application.members.length} students ·{' '}
              {application.branchNames.length} branches
            </span>
          </span>
          <StageBadge stage={application.stage} achievementTitle={achievementTitle} />
        </div>
      </CrewCover>
      {/* parents asking for this meetup: the demand the hakwon sees */}
      {(() => {
        const want = application.parents?.filter((p) => p.status === 'approved').length || 0;
        return want > 0 ? (
          <div
            className={css`
              padding: 0.8rem 1.6rem;
              background: ${Color.green(0.1)};
              color: ${Color.darkerGray()};
              font-size: 1.45rem;
              font-weight: 700;
            `}
          >
            <Icon icon="users" style={{ marginRight: '0.6rem', color: Color.green() }} />
            {want} of {application.members.length} parents want this meetup to happen
          </div>
        ) : null;
      })()}
      <div
        className={css`
          padding: 1.6rem;
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.2rem 1rem;
          }
        `}
      >
        <div className={css`display: flex; gap: 1.4rem; align-items: flex-start;`}>
          <CalendarChip date={application.plan.date} />
          <div className={css`display: flex; flex-direction: column; gap: 0.7rem; min-width: 0; flex: 1;`}>
            <div className={css`display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center;`}>
              {application.plan.reviewedAt > 0 && <CoordinatorChip status={application.coordinatorStatus} />}
              <GrownUpBadge adult={application.adult} />
            </div>
            <InfoLine icon="globe">
              Meeting around <b>{application.plan.area || '—'}</b>
            </InfoLine>
            {application.plan.submittedAt > 0 && (
              <InfoLine icon="paper-plane">Plan sent {formatTime(application.plan.submittedAt)}</InfoLine>
            )}
          </div>
        </div>
        <ActivityQuote text={application.plan.activity} />
        <div>
          <span className={questLabelClass}>The crew</span>
          <MemberStrip members={application.members} />
          <span className={questHelpClass}>
            <Icon icon="check" style={{ color: Color.green() }} /> = a parent said yes.
          </span>
        </div>
        {!!application.parents?.length && (
          <ParentContactsAdmin crewId={application.crewId} contacts={application.parents} />
        )}
        {decided && (
          <div
            className={css`
              border-radius: 1.2rem;
              background: ${application.plan.status === 'sent_back' ? Color.orange(0.07) : Color.green(0.07)};
              padding: 1.1rem 1.3rem;
              display: flex;
              flex-direction: column;
              gap: 0.6rem;
            `}
          >
            <InfoLine icon={application.plan.status === 'sent_back' ? 'redo' : 'check-circle'}>
              <b>{application.plan.status === 'sent_back' ? 'Sent back' : 'Approved'}</b>
              {application.decidedBy ? ` by ${application.decidedBy.username}` : ''} ·{' '}
              {formatTime(application.plan.reviewedAt)}
            </InfoLine>
            {application.plan.note && <InfoLine icon="comment">“{application.plan.note}”</InfoLine>}
            {application.plan.status !== 'sent_back' && (
              <InfoLine icon="school">
                <VenueSummary application={application} />
              </InfoLine>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Empty states and celebrations ----

export function EmptyState({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div
      className={css`
        ${staffCardClass};
        padding: 3rem 2rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.6rem;
      `}
    >
      <span
        aria-hidden
        className={css`
          width: 9rem;
          height: 9rem;
          border-radius: 50%;
          background: ${Color.logoBlue(0.08)};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4.4rem;
          margin-bottom: 0.6rem;
          animation: ${bob} 3s ease-in-out infinite;
          ${noMotion}
        `}
      >
        {emoji}
      </span>
      <b style={{ fontSize: '1.8rem', color: Color.black() }}>{title}</b>
      <span style={{ fontSize: '1.4rem', color: Color.darkGray(), maxWidth: '44rem' }}>{text}</span>
    </div>
  );
}

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const burst = keyframes`
  0% { transform: translate(0, 0) scale(0.4) rotate(0deg); opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(1) rotate(var(--rot)); opacity: 0; }
`;

const popIn = keyframes`
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); }
`;

const CONFETTI_COLORS = ['#418ceb', '#28b62c', '#ffcb32', '#ff8c00', '#ff6b8b', '#139a9a'];

// A small burst of confetti and a message, then it fades away.
export function Celebration({
  title,
  message,
  onDone,
  durationMs = 3200
}: {
  title: string;
  message: string;
  onDone: () => void;
  durationMs?: number;
}) {
  const [pieces] = useState(() =>
    Array.from({ length: 28 }, (_, index) => {
      const angle = (index / 28) * Math.PI * 2;
      const distance = 90 + Math.random() * 90;
      return {
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance - 40,
        rot: Math.round(Math.random() * 540 - 270),
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        round: index % 3 === 0,
        delay: Math.random() * 0.15
      };
    })
  );
  useEffect(() => {
    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      role="status"
      className={css`
        position: relative;
        border-radius: 1.6rem;
        background: ${Color.green(0.1)};
        border: 1.5px solid ${Color.green(0.5)};
        padding: 2rem 1.6rem;
        text-align: center;
        overflow: hidden;
        animation: ${popIn} 0.45s ease-out;
        ${noMotion}
      `}
    >
      <span aria-hidden className={css`position: absolute; left: 50%; top: 45%; width: 0; height: 0;`}>
        {pieces.map((piece, index) => (
          <span
            key={index}
            style={
              {
                '--dx': `${piece.dx}px`,
                '--dy': `${piece.dy}px`,
                '--rot': `${piece.rot}deg`,
                animationDelay: `${piece.delay}s`,
                background: piece.color
              } as React.CSSProperties
            }
            className={css`
              position: absolute;
              width: ${piece.round ? '0.8rem' : '0.7rem'};
              height: ${piece.round ? '0.8rem' : '1.2rem'};
              border-radius: ${piece.round ? '50%' : '0.2rem'};
              animation: ${burst} 1.4s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
              @media (prefers-reduced-motion: reduce) {
                display: none;
              }
            `}
          />
        ))}
      </span>
      <div style={{ fontSize: '3.6rem' }}>🎉</div>
      <b style={{ display: 'block', fontSize: '2rem', color: Color.black() }}>{title}</b>
      <span style={{ fontSize: '1.45rem', color: Color.darkerGray() }}>{message}</span>
    </div>
  );
}

// ---- The classroom offer picker ----

export interface VenueDraft {
  mode: 'later' | 'none' | 'offer';
  branch: string;
  room: string;
  slots: MeetupSlot[];
}

export function emptyVenueDraft(branch = ''): VenueDraft {
  return { mode: 'later', branch, room: '', slots: [] };
}

export function venueFromDraft(draft: VenueDraft) {
  if (draft.mode === 'later') return undefined;
  if (draft.mode === 'none') return { mode: 'none' };
  return { mode: 'offer', branch: draft.branch, room: draft.room, slots: draft.slots };
}

const QUICK_TIMES: [string, string, string][] = [
  ['Morning', '10:00', '12:00'],
  ['Afternoon', '14:00', '16:00'],
  ['Late afternoon', '16:00', '18:00']
];

const choiceChip = (active: boolean) => css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  border: 1.5px solid ${active ? Color.logoBlue() : 'var(--ui-border)'};
  background: ${active ? Color.logoBlue() : '#fff'};
  color: ${active ? '#fff' : Color.darkerGray()};
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
  ${noMotion}
`;

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
  const [slotDate, setSlotDate] = useState(() => addDays(localToday(), 7));
  const [slotTime, setSlotTime] = useState<[string, string]>(['14:00', '16:00']);
  const [otherBranch, setOtherBranch] = useState(
    !!draft.branch && !branchSuggestions.includes(draft.branch)
  );
  const modes: [VenueDraft['mode'], string, string][] = [
    ...(allowLater ? ([['later', 'No classroom needed', 'users']] as [VenueDraft['mode'], string, string][]) : []),
    ['offer', 'Offer a classroom', 'school'],
    ['none', 'No classroom available', 'times']
  ];
  const nextWeek = Array.from({ length: 14 }, (_, index) => addDays(localToday(), index + 1));

  return (
    <div className={css`display: flex; flex-direction: column; gap: 1.2rem;`}>
      <div role="radiogroup" aria-label="Classroom" className={css`display: flex; gap: 0.6rem; flex-wrap: wrap;`}>
        {modes.map(([mode, label, icon]) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={draft.mode === mode}
            disabled={disabled}
            className={choiceChip(draft.mode === mode)}
            onClick={() => onChange({ ...draft, mode })}
          >
            <Icon icon={icon} />
            {label}
          </button>
        ))}
      </div>
      {draft.mode === 'later' && (
        <span className={questHelpClass}>
          The crew meets with its grown-up as planned. The coordinator still
          gets the briefing to help schedule it.
        </span>
      )}
      {draft.mode === 'none' && (
        <span className={questHelpClass}>
          The crew meets elsewhere with its grown-up. The coordinator still
          gets the briefing to help schedule it.
        </span>
      )}
      {draft.mode === 'offer' && (
        <div
          className={css`
            border-radius: 1.4rem;
            border: 1px solid var(--ui-border);
            background: #fff;
            padding: 1.4rem;
            display: flex;
            flex-direction: column;
            gap: 1.3rem;
            @media (max-width: ${mobileMaxWidth}) {
              padding: 1.1rem;
            }
          `}
        >
          <div>
            <span className={questLabelClass}>Which branch?</span>
            <div className={css`display: flex; gap: 0.5rem; flex-wrap: wrap;`}>
              {branchSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  disabled={disabled}
                  className={choiceChip(!otherBranch && draft.branch === name)}
                  onClick={() => {
                    setOtherBranch(false);
                    onChange({ ...draft, branch: name });
                  }}
                >
                  <Icon icon="school" />
                  {name}
                </button>
              ))}
              <button
                type="button"
                disabled={disabled}
                className={choiceChip(otherBranch)}
                onClick={() => {
                  setOtherBranch(true);
                  onChange({ ...draft, branch: '' });
                }}
              >
                Another branch…
              </button>
            </div>
            {otherBranch && (
              <input
                aria-label="Branch"
                className={questInputClass}
                style={{ marginTop: '0.6rem' }}
                value={draft.branch}
                maxLength={40}
                placeholder="Branch name"
                disabled={disabled}
                onChange={(event) => onChange({ ...draft, branch: event.target.value })}
              />
            )}
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
          <div>
            <span className={questLabelClass}>Time slots you can offer</span>
            {draft.slots.length > 0 ? (
              <div className={css`display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 1rem;`}>
                {draft.slots.map((slot, index) => (
                  <span
                    key={`${slot.date}-${slot.start}-${index}`}
                    className={css`
                      display: inline-flex;
                      align-items: center;
                      gap: 0.6rem;
                      padding: 0.4rem 0.5rem 0.4rem 0.4rem;
                      border-radius: 1.2rem;
                      background: ${Color.logoBlue(0.08)};
                      border: 1px solid ${Color.logoBlue(0.3)};
                      animation: ${popIn} 0.3s ease-out;
                      ${noMotion}
                    `}
                  >
                    <CalendarChip date={slot.date} time={`${slot.start}–${slot.end}`} />
                    <button
                      type="button"
                      aria-label="Remove this slot"
                      disabled={disabled}
                      onClick={() => onChange({ ...draft, slots: draft.slots.filter((_, i) => i !== index) })}
                      className={css`border: 0; background: none; color: ${Color.darkGray()}; cursor: pointer; font-size: 1.4rem;`}
                    >
                      <Icon icon="times" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className={questHelpClass} style={{ display: 'block', marginBottom: '0.8rem' }}>
                Pick a day and a time below, then add it. Up to 5 slots.
              </span>
            )}
            {draft.slots.length < 5 && (
              <div
                className={css`
                  border-radius: 1.2rem;
                  background: ${Color.extraLightGray(0.5)};
                  padding: 1rem;
                  display: flex;
                  flex-direction: column;
                  gap: 0.8rem;
                `}
              >
                <div
                  aria-label="Pick a day"
                  className={css`
                    display: flex;
                    gap: 0.5rem;
                    overflow-x: auto;
                    padding-bottom: 0.3rem;
                  `}
                >
                  {nextWeek.map((date) => {
                    const parsed = parseDate(date)!;
                    const active = slotDate === date;
                    return (
                      <button
                        key={date}
                        type="button"
                        disabled={disabled}
                        aria-pressed={active}
                        onClick={() => setSlotDate(date)}
                        className={css`
                          flex-shrink: 0;
                          width: 5.2rem;
                          padding: 0.5rem 0;
                          border-radius: 1rem;
                          border: 1.5px solid ${active ? Color.logoBlue() : 'var(--ui-border)'};
                          background: ${active ? Color.logoBlue() : '#fff'};
                          color: ${active ? '#fff' : Color.darkerGray()};
                          cursor: pointer;
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          font-size: 1.1rem;
                        `}
                      >
                        <span>{parsed.weekday}</span>
                        <b style={{ fontSize: '1.8rem' }}>{parsed.day}</b>
                        <span>{parsed.month}</span>
                      </button>
                    );
                  })}
                </div>
                <div className={css`display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;`}>
                  <DateCalendar
                    value={slotDate}
                    min={localToday()}
                    disabled={disabled}
                    placeholder="Another date"
                    onChange={setSlotDate}
                  />
                  {QUICK_TIMES.map(([label, start, end]) => (
                    <button
                      key={label}
                      type="button"
                      disabled={disabled}
                      className={choiceChip(slotTime[0] === start && slotTime[1] === end)}
                      onClick={() => setSlotTime([start, end])}
                    >
                      {label} {start}–{end}
                    </button>
                  ))}
                </div>
                <div className={css`display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;`}>
                  <input
                    type="time"
                    aria-label="Start time"
                    className={questInputClass}
                    style={{ width: '13rem' }}
                    value={slotTime[0]}
                    disabled={disabled}
                    onChange={(event) => setSlotTime([event.target.value, slotTime[1]])}
                  />
                  <span>–</span>
                  <input
                    type="time"
                    aria-label="End time"
                    className={questInputClass}
                    style={{ width: '13rem' }}
                    value={slotTime[1]}
                    disabled={disabled}
                    onChange={(event) => setSlotTime([slotTime[0], event.target.value])}
                  />
                  <Button
                    size="sm"
                    color="logoBlue"
                    disabled={disabled || !slotDate || slotTime[1] <= slotTime[0]}
                    onClick={() =>
                      onChange({
                        ...draft,
                        slots: [...draft.slots, { date: slotDate, start: slotTime[0], end: slotTime[1] }]
                      })
                    }
                  >
                    <Icon icon="plus" style={{ marginRight: '0.4rem' }} />
                    Add this slot
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
