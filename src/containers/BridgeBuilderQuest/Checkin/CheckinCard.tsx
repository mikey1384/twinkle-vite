import React, { useEffect, useRef, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import Button from '~/components/Button';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import FormModal from '~/components/AchievementItem/FormModal';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import {
  BRIDGE_BUILDER_BAR_DAYS_AFTER,
  BRIDGE_BUILDER_BAR_DAYS_BEFORE,
  BRIDGE_BUILDER_BAR_LEARNING_DAYS,
  BRIDGE_BUILDER_BAR_LEARNING_XP,
  BRIDGE_BUILDER_INVITE_APP_PATH,
  BRIDGE_BUILDER_INVITE_COPLAY_MINUTES
} from '~/constants/meetupQuest';
import { Color, mobileMaxWidth } from '~/constants/css';
import { QuestNote } from '../StepCard';
import CheckinModal from './CheckinModal';
import { unlockSound } from './soundCode';
import { ParentInviteModal, TeacherWitnessModal } from './GrownUpModals';
import ParentInviteStatus from './ParentInviteStatus';
import type { CheckinPerson, CheckinProgress } from '../types';

const pop = keyframes`
  0% { transform: scale(0.6); opacity: 0; }
  70% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

// The Bridge Builder checkpoint: 7 slots that fill as people count, one
// "Next step" line the server picks, each person's progress, the two ways to
// count, the big Check in button and the grown-up shortcut. Friendly and
// short on purpose (Mikey 2026-10-17: "it should feel like a game
// checkpoint"; 11-21: every step says plainly what to do, where, and what
// counts). Refusals are never explained; only "time ran out" is stated.
export default function CheckinCard({
  achievementTitle,
  onUnlocked
}: {
  achievementTitle: string;
  onUnlocked?: () => void;
}) {
  const navigate = useNavigate();
  const loadMeetupCheckins = useAppContext(
    (v) => v.requestHelpers.loadMeetupCheckins
  );
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const [progress, setProgress] = useState<CheckinProgress | null>(null);
  const [error, setError] = useState('');
  const refreshing = useRef(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [modal, setModal] = useState<
    '' | 'checkin' | 'together' | 'teacher' | 'parent' | 'birthdate'
  >('');
  // null: not chosen yet (open for someone with nobody so far)
  const [howToOpen, setHowToOpen] = useState<boolean | null>(null);

  useEffect(() => {
    trackMeetupQuestView('checkin_page');
    reload();
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = achievementTitle || 'Bridge Builder';
  if (!progress) {
    return error ? <QuestNote tone="warning">{error}</QuestNote> : null;
  }
  const canCheckIn = progress.myAge !== 'adult';
  const counted = progress.people.filter((p) => p.state === 'counted');
  const pending = progress.people.filter(
    (p) => p.state === 'getting_started' || p.state === 'waiting_birthdate'
  );
  const timedOut = progress.people.filter(
    (p) => p.state === 'not_counted' && p.timedOut
  );
  const slots = [...counted, ...pending].slice(0, progress.target);
  const empty = Math.max(0, progress.target - slots.length);
  const listed = [...counted, ...pending, ...timedOut];
  const showHowTo =
    !progress.unlocked &&
    (howToOpen ?? (counted.length === 0 && pending.length === 0));

  return (
    <section
      className={css`
        border-radius: 1.6rem;
        border: 1px solid ${Color.logoBlue(0.3)};
        background: ${Color.logoBlue(0.05)};
        padding: 2rem;
        margin-top: 1.6rem;
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          border-left: 0;
          border-right: 0;
          padding: 1.6rem 1rem;
        }
      `}
    >
      <div
        className={css`
          font-size: 1.3rem;
          font-weight: bold;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: ${Color.logoBlue()};
        `}
      >
        <Icon icon="qrcode" /> Path 1 · Meet up
      </div>
      <h2
        className={css`
          margin: 0.4rem 0 1.4rem;
          font-size: 2.3rem;
          color: ${Color.black()};
        `}
      >
        {progress.unlocked
          ? `${title} unlocked!`
          : `Meet ${progress.target} people, or bring them to Twinkle`}
      </h2>

      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.8rem;
          @media (max-width: ${mobileMaxWidth}) {
            gap: 0.5rem;
          }
        `}
      >
        {slots.map((person) => (
          <Slot key={`${person.way}-${person.userId}`} person={person} />
        ))}
        {Array.from({ length: progress.unlocked ? 0 : empty }).map(
          (_, index) => (
            <div key={`empty-${index}`} className={emptySlotClass} />
          )
        )}
      </div>
      <div
        className={css`
          margin-top: 0.8rem;
          font-size: 1.7rem;
          font-weight: bold;
          color: ${progress.unlocked ? Color.orange() : Color.black()};
        `}
      >
        {progress.unlocked ? (
          <>
            <Icon icon="trophy" /> {title} unlocked
          </>
        ) : (
          `${Math.min(progress.counted, progress.target)} of ${progress.target} people counted`
        )}
      </div>

      {renderNextStep()}

      {!progress.unlocked &&
        !progress.review &&
        !progress.reviewRejected &&
        progress.witnessPending && (
          <div style={{ marginTop: '1.2rem' }}>
            <QuestNote tone="info">
              Your grown-up check-in is saved. At least two kids need to scan
              and have their birthdates checked before Mikey reviews the meetup.
            </QuestNote>
          </div>
        )}
      {progress.needsMyBirthdate && progress.nextStep !== 'add_birthdate' && (
        <div style={{ marginTop: '1.2rem' }}>
          <QuestNote tone="warning">
            <div className={rowClass}>
              <span>
                Add your birthdate for review so your check-ins can count.
              </span>
              <Button
                size="sm"
                color="orange"
                variant="soft"
                onClick={() => {
                  trackMeetupQuestView('checkin_birthdate_open');
                  setModal('birthdate');
                }}
              >
                Add my birthdate
              </Button>
            </div>
          </QuestNote>
        </div>
      )}
      {progress.needsTogether &&
        !progress.unlocked &&
        progress.nextStep !== 'together' && (
          <div className={smallLineClass}>
            Next time you meet a friend you checked in with,{' '}
            <button
              type="button"
              className={inlineLinkClass}
              onClick={() => setModal('together')}
            >
              show that you’re together
            </button>{' '}
            to help Mikey review your meetup.
          </div>
        )}

      {progress.parentInvite &&
        !progress.unlocked &&
        !progress.review &&
        !progress.reviewRejected && (
          <div style={{ marginTop: '1.2rem' }}>
            <ParentInviteStatus invite={progress.parentInvite} />
          </div>
        )}
      {(progress.parentInvite ||
        progress.review ||
        progress.reviewRejected ||
        progress.witnessPending) && (
        <div style={{ marginTop: '0.8rem' }}>
          <Button
            size="sm"
            variant="ghost"
            color="darkGray"
            loading={refreshBusy}
            onClick={reload}
          >
            Refresh status
          </Button>
          {error && <QuestNote tone="warning">{error}</QuestNote>}
        </div>
      )}

      {listed.length > 0 && (
        <div style={{ marginTop: '1.6rem' }}>
          <div className={sectionLabelClass}>Your people</div>
          <ul className={peopleListClass}>
            {listed.map((person) => (
              <PersonRow
                key={`${person.way}-${person.userId}`}
                person={person}
              />
            ))}
          </ul>
        </div>
      )}

      {!progress.unlocked && (
        <div style={{ marginTop: '1.6rem' }}>
          <button
            type="button"
            className={howToToggleClass}
            aria-expanded={showHowTo}
            onClick={() => {
              if (!showHowTo) trackMeetupQuestView('invite_howto_open');
              setHowToOpen(!showHowTo);
            }}
          >
            <Icon icon={showHowTo ? 'chevron-down' : 'chevron-right'} /> Two
            ways to count people
          </button>
          {showHowTo && (
            <div className={waysClass}>
              <div className={wayClass}>
                <div className={wayTitleClass}>
                  <Icon icon="user-plus" style={{ color: Color.green() }} /> 1.
                  Invite a friend who&apos;s new to Twinkle
                </div>
                <ol className={stepsClass}>
                  <li>
                    In Twinkle Minecraft World, go to{' '}
                    <b>Play › The Dark Citadel</b>, pick an area and choose{' '}
                    <b>Private room › Create a room</b>. In the pause menu, tap{' '}
                    <b>Private room · invite › Copy link</b>. Send the link to
                    your friend and play {BRIDGE_BUILDER_INVITE_COPLAY_MINUTES}{' '}
                    minutes together while they&apos;re a guest.
                  </li>
                  <li>
                    Twinkle then offers them <b>Join Twinkle</b>. They sign up
                    from it.
                  </li>
                  <li>
                    Then they use Twinkle: learning on{' '}
                    {BRIDGE_BUILDER_BAR_LEARNING_DAYS} different days and{' '}
                    {BRIDGE_BUILDER_BAR_LEARNING_XP.toLocaleString('en-US')}{' '}
                    learning XP within {BRIDGE_BUILDER_BAR_DAYS_AFTER} days of
                    joining. Then they count by themselves.
                  </li>
                </ol>
                <div className={smallLineClass}>
                  Showing friends around Twinkle Minecraft World is its own
                  path: see Path 3 below.
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <Button
                    size="sm"
                    color="green"
                    variant="soft"
                    onClick={() => {
                      trackMeetupQuestView('invite_citadel_open');
                      navigate(BRIDGE_BUILDER_INVITE_APP_PATH);
                    }}
                  >
                    <Icon icon="cubes" style={{ marginRight: '0.5rem' }} />
                    Open Twinkle Minecraft World
                  </Button>
                </div>
              </div>
              <div className={wayClass}>
                <div className={wayTitleClass}>
                  <Icon icon="qrcode" style={{ color: Color.logoBlue() }} /> 2.
                  Check in with a Twinkle friend you meet
                </div>
                <div className={wayTextClass}>
                  When you&apos;re together, both tap <b>Check in</b> below and
                  scan each other&apos;s codes. A friend without an account can
                  scan your code with their phone camera and tap Join Twinkle.
                  Both friends must be under 18 and have a checked birthdate.
                  Your friend needs {BRIDGE_BUILDER_BAR_LEARNING_DAYS} different
                  learning days and{' '}
                  {BRIDGE_BUILDER_BAR_LEARNING_XP.toLocaleString('en-US')}{' '}
                  learning XP from the {BRIDGE_BUILDER_BAR_DAYS_BEFORE} days
                  before the check-in through {BRIDGE_BUILDER_BAR_DAYS_AFTER}{' '}
                  days after it.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {canCheckIn && (
        <div style={{ marginTop: '1.6rem' }}>
          <GameCTAButton
            variant="success"
            size="xl"
            shiny
            icon="qrcode"
            onClick={() => {
              // a tap lets the code screen play its sound check
              unlockSound();
              setModal('checkin');
            }}
          >
            {progress.unlocked ? 'Check in with a friend' : 'Check in'}
          </GameCTAButton>
        </div>
      )}

      {!progress.unlocked && progress.myAge !== 'adult' && (
        <div
          className={css`
            margin-top: 1.8rem;
            padding: 1.4rem 1.6rem;
            border-radius: 1.2rem;
            background: ${Color.gold(0.16)};
            border: 1px solid ${Color.gold(0.5)};
          `}
        >
          <div
            className={css`
              font-size: 1.6rem;
              font-weight: bold;
              color: ${Color.black()};
            `}
          >
            <Icon icon="bolt" style={{ color: Color.orange() }} /> Shortcut:
            meet with a grown-up
          </div>
          <div
            className={css`
              font-size: 1.4rem;
              line-height: 1.5;
              color: ${Color.darkerGray()};
              margin-top: 0.4rem;
            `}
          >
            If a Twinkle teacher or your parent is there when you meet, every
            kid who scans their code can qualify for {title} after Mikey reviews
            the meetup.
          </div>
          <div
            className={css`
              display: flex;
              gap: 0.8rem;
              flex-wrap: wrap;
              margin-top: 1rem;
            `}
          >
            <Button
              color="orange"
              variant="soft"
              onClick={() => setModal('parent')}
            >
              <Icon icon="envelope" style={{ marginRight: '0.6rem' }} />
              Invite my parent
            </Button>
          </div>
        </div>
      )}
      {progress.canWitness && (
        <div style={{ marginTop: '1.4rem' }}>
          <Button
            color="orange"
            variant="soft"
            onClick={() => setModal('teacher')}
          >
            <Icon icon="user-shield" style={{ marginRight: '0.6rem' }} />
            Be the grown-up at a meetup
          </Button>
        </div>
      )}
      {progress.unlocked && canCheckIn && (
        <div
          className={css`
            ${smallLineClass};
            margin-top: 1.4rem;
          `}
        >
          <Icon icon="user-shield" style={{ color: Color.green() }} /> Check in
          with people you already see in real life: at school, your hagwon or a
          Twinkle class.
        </div>
      )}

      {(modal === 'checkin' || modal === 'together') && (
        <CheckinModal
          startWithGuide={modal === 'together'}
          progress={progress}
          onProgress={handleProgress}
          onAddBirthdate={() => setModal('birthdate')}
          onHide={() => {
            setModal('');
            reload();
          }}
        />
      )}
      {modal === 'teacher' && (
        <TeacherWitnessModal onHide={() => setModal('')} />
      )}
      {modal === 'parent' && (
        <ParentInviteModal
          hasInvitation={!!progress.parentInvite}
          onHide={() => {
            setModal('');
            reload();
          }}
        />
      )}
      {modal === 'birthdate' && (
        <FormModal
          header="Your birthdate"
          type="dob"
          onHide={() => {
            setModal('');
            reload();
          }}
        />
      )}
    </section>
  );

  // The one "do this next" line (the server picks it: nextStep).
  function renderNextStep() {
    if (!progress) return null;
    const step =
      progress.nextStep ?? (progress.unlocked ? 'unlocked' : 'invite');
    if (step === 'unlocked') return null;
    const box = (
      tone: 'info' | 'warning' | 'success',
      body: React.ReactNode,
      action?: React.ReactNode
    ) => (
      <div style={{ marginTop: '1.2rem' }}>
        <QuestNote tone={tone}>
          <div className={rowClass}>
            <span>
              <b>Next step:</b> {body}
            </span>
            {action}
          </div>
        </QuestNote>
      </div>
    );
    if (step === 'wait_review') {
      return box(
        'info',
        <>
          Your check-ins are saved. Waiting for Mikey’s review before the
          achievement unlocks. You don’t need to send another request.
        </>
      );
    }
    if (step === 'rejected') {
      return box(
        'warning',
        <>
          This meetup was not approved. Your check-ins are saved; you can check
          in again when you next meet.
        </>
      );
    }
    if (step === 'add_birthdate') {
      return box(
        'warning',
        <>Add your birthdate for review so your check-ins can count.</>,
        <Button
          size="sm"
          color="orange"
          variant="soft"
          onClick={() => {
            trackMeetupQuestView('checkin_birthdate_open');
            setModal('birthdate');
          }}
        >
          Add my birthdate
        </Button>
      );
    }
    if (step === 'friend_learning') {
      const friend = [...progress.people]
        .filter((p) => p.state === 'getting_started')
        .sort((a, b) => (a.endsAt || 0) - (b.endsAt || 0))[0];
      return box(
        'info',
        <>
          {friend?.username || 'Your friend'}{' '}
          {friend?.way === 'invite'
            ? 'joined Twinkle!'
            : 'checked in with you!'}{' '}
          They count once they learn on Twinkle on{' '}
          {BRIDGE_BUILDER_BAR_LEARNING_DAYS} different days and earn{' '}
          {BRIDGE_BUILDER_BAR_LEARNING_XP.toLocaleString('en-US')} learning XP
          {friend?.endsAt ? ` by ${shortDate(friend.endsAt)}` : ''}. Puzzles,
          videos, the Daily Question and Grammarbles all help.
        </>
      );
    }
    if (step === 'friend_signup') {
      const n = progress.pendingInvites?.count || 0;
      const until = progress.pendingInvites?.nextExpiresAt || 0;
      return box(
        'info',
        <>
          {n === 1
            ? 'One Join Twinkle invite is'
            : `${n} Join Twinkle invites are`}{' '}
          waiting to be used.
          {!!until && (
            <>
              {' '}
              {n === 1 ? 'It expires' : 'The next one expires'} on{' '}
              {shortDate(until)}.
            </>
          )}{' '}
          Your friends need to sign up with their invite and start learning on
          Twinkle.
        </>
      );
    }
    if (step === 'wait_birthdate') {
      return box(
        'info',
        <>
          A friend you checked in with needs their birthdate checked. Ask them
          to add it on their own Bridge Builder page.
        </>
      );
    }
    if (step === 'together') {
      return box(
        'info',
        <>
          Next time you meet, show that you’re together to help Mikey review
          your meetup.
        </>,
        <Button
          size="sm"
          color="logoBlue"
          variant="soft"
          onClick={() => setModal('together')}
        >
          <Icon icon="handshake" style={{ marginRight: '0.5rem' }} />
          How?
        </Button>
      );
    }
    return box(
      'info',
      <>
        Invite a friend who’s new to Twinkle
        {canCheckIn && ', or check in with a Twinkle friend you meet'}. See how
        below.
      </>
    );
  }

  async function reload() {
    if (refreshing.current) return;
    refreshing.current = true;
    setRefreshBusy(true);
    try {
      handleProgress(await loadMeetupCheckins());
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Could not load your check-ins.');
    } finally {
      refreshing.current = false;
      setRefreshBusy(false);
    }
  }

  function handleProgress(next: CheckinProgress) {
    setProgress((prev) => {
      if (next.unlocked && prev && !prev.unlocked) onUnlocked?.();
      return next;
    });
  }
}

function Slot({ person }: { person: CheckinPerson }) {
  const counted = person.state === 'counted';
  return (
    <div
      title={
        counted
          ? person.username
          : person.state === 'waiting_birthdate'
            ? `${person.username}: waiting for a birthdate check`
            : `${person.username}: counts after ${BRIDGE_BUILDER_BAR_LEARNING_DAYS} learning days and ${BRIDGE_BUILDER_BAR_LEARNING_XP.toLocaleString('en-US')} XP`
      }
      className={css`
        position: relative;
        width: ${SLOT_SIZE};
        height: ${SLOT_SIZE};
        flex-shrink: 0;
        border-radius: 50%;
        padding: 0.25rem;
        @media (max-width: ${mobileMaxWidth}) {
          width: ${SLOT_SIZE_PHONE};
          height: ${SLOT_SIZE_PHONE};
        }
        background: ${counted ? Color.green() : Color.lightGray()};
        animation: ${pop} 0.4s ease-out both;
        opacity: ${counted ? 1 : 0.7};
      `}
    >
      <ProfilePic
        userId={person.userId}
        profilePicUrl={person.profilePicUrl || ''}
        size="100%"
      />
      {!counted && (
        <span
          className={css`
            position: absolute;
            right: -0.2rem;
            bottom: -0.2rem;
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            color: ${Color.darkGray()};
            border: 1px solid var(--ui-border);
          `}
        >
          <Icon icon="hourglass-half" />
        </span>
      )}
    </div>
  );
}

// One line per person: who, and what is left before they count.
function PersonRow({ person }: { person: CheckinPerson }) {
  const how = person.way === 'invite' ? 'Joined' : 'Checked in';
  let status: React.ReactNode;
  if (person.state === 'counted') {
    status = (
      <span style={{ color: Color.green(), fontWeight: 'bold' }}>
        <Icon icon="check" /> Counts
      </span>
    );
  } else if (person.state === 'waiting_birthdate') {
    status = 'Checked in · waiting for a birthdate check';
  } else if (person.state === 'getting_started') {
    const deadline = person.endsAt
      ? ` · until ${shortDate(person.endsAt)}`
      : '';
    status = `${how} ${shortDate(person.at)} · still learning${deadline}`;
  } else {
    status = `Time ran out: ${BRIDGE_BUILDER_BAR_LEARNING_DAYS} days and ${BRIDGE_BUILDER_BAR_LEARNING_XP.toLocaleString('en-US')} XP weren’t reached in time`;
  }
  return (
    <li className={personRowClass}>
      <div className={personPicClass}>
        <ProfilePic
          userId={person.userId}
          profilePicUrl={person.profilePicUrl || ''}
          size="100%"
        />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '1.4rem',
            overflowWrap: 'anywhere'
          }}
        >
          {person.username}
        </div>
        <div
          style={{
            fontSize: '1.25rem',
            color: Color.darkGray(),
            lineHeight: 1.4
          }}
        >
          {status}
        </div>
      </div>
    </li>
  );
}

function shortDate(atSeconds: number) {
  return new Date(atSeconds * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

// 7 slots fit one row on a phone
const SLOT_SIZE = '5.2rem';
const SLOT_SIZE_PHONE = '4.4rem';

const emptySlotClass = css`
  width: ${SLOT_SIZE};
  height: ${SLOT_SIZE};
  flex-shrink: 0;
  border-radius: 50%;
  @media (max-width: ${mobileMaxWidth}) {
    width: ${SLOT_SIZE_PHONE};
    height: ${SLOT_SIZE_PHONE};
  }
  border: 0.25rem dashed ${Color.logoBlue(0.35)};
  background: #fff;
`;

const smallLineClass = css`
  margin-top: 0.8rem;
  font-size: 1.3rem;
  line-height: 1.5;
  color: ${Color.darkGray()};
`;

const rowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const sectionLabelClass = css`
  font-size: 1.3rem;
  font-weight: bold;
  color: ${Color.darkerGray()};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const peopleListClass = css`
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const personRowClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 0.8rem;
  border-radius: 1rem;
  background: #fff;
  border: 1px solid var(--ui-border);
`;

const personPicClass = css`
  width: 3.6rem;
  height: 3.6rem;
  flex-shrink: 0;
`;

const howToToggleClass = css`
  appearance: none;
  border: 0;
  background: none;
  padding: 0;
  cursor: pointer;
  font-size: 1.5rem;
  font-weight: bold;
  color: ${Color.logoBlue()};
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
`;

const waysClass = css`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const wayClass = css`
  padding: 1.2rem 1.4rem;
  border-radius: 1.2rem;
  background: #fff;
  border: 1px solid var(--ui-border);
`;

const wayTitleClass = css`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${Color.black()};
`;

const wayTextClass = css`
  margin-top: 0.6rem;
  font-size: 1.35rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
`;

const stepsClass = css`
  margin: 0.6rem 0 0;
  padding-left: 2rem;
  font-size: 1.35rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
  li + li {
    margin-top: 0.3rem;
  }
`;

const inlineLinkClass = css`
  appearance: none;
  border: 0;
  background: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
  font-weight: bold;
  color: ${Color.logoBlue()};
  &:hover {
    text-decoration: underline;
  }
`;
