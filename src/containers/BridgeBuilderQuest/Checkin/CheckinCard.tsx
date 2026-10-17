import React, { useEffect, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import Button from '~/components/Button';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import FormModal from '~/components/AchievementItem/FormModal';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { QuestNote } from '../StepCard';
import CheckinModal from './CheckinModal';
import { unlockSound } from './soundCode';
import { ParentInviteModal, TeacherWitnessModal } from './GrownUpModals';
import type { CheckinPerson, CheckinProgress } from '../types';

const pop = keyframes`
  0% { transform: scale(0.6); opacity: 0; }
  70% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

// The Bridge Builder checkpoint: 7 slots that fill as friends check in, the
// one big Check in button, and the grown-up shortcut. Friendly and short on
// purpose (Mikey 2026-10-17: "it should feel like a game checkpoint"): no
// rules wall, no step numbers, refusals never explained.
export default function CheckinCard({
  achievementTitle,
  onUnlocked
}: {
  achievementTitle: string;
  onUnlocked?: () => void;
}) {
  const loadMeetupCheckins = useAppContext(
    (v) => v.requestHelpers.loadMeetupCheckins
  );
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const [progress, setProgress] = useState<CheckinProgress | null>(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<
    '' | 'checkin' | 'together' | 'teacher' | 'parent' | 'birthdate'
  >('');

  useEffect(() => {
    trackMeetupQuestView('checkin_page');
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = achievementTitle || 'Bridge Builder';
  if (!progress) {
    return error ? <QuestNote tone="warning">{error}</QuestNote> : null;
  }
  const counted = progress.people.filter((p) => p.state === 'counted');
  const pending = progress.people.filter(
    (p) => p.state === 'getting_started' || p.state === 'waiting_birthdate'
  );
  const slots = [...counted, ...pending].slice(0, progress.target);
  const empty = Math.max(0, progress.target - slots.length);
  const gettingStarted = pending.filter(
    (p) => p.state === 'getting_started'
  ).length;
  const waitingCheck = pending.filter(
    (p) => p.state === 'waiting_birthdate' && p.waitingOn === 'them'
  ).length;

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
        <Icon icon="star" /> {title}
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
          : `Meet ${progress.target} people in real life`}
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
            <Icon icon="trophy" /> All {progress.target} met!
          </>
        ) : (
          `${Math.min(progress.counted, progress.target)} of ${progress.target} met`
        )}
      </div>

      {!progress.unlocked && (gettingStarted > 0 || waitingCheck > 0) && (
        <div className={smallLineClass}>
          {[
            gettingStarted
              ? `${gettingStarted} ${gettingStarted === 1 ? 'friend counts' : 'friends count'} once they’ve played on Twinkle a few days`
              : '',
            waitingCheck
              ? `${waitingCheck} ${waitingCheck === 1 ? 'waits' : 'wait'} for a birthdate check`
              : ''
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
      )}
      {progress.review && !progress.unlocked && (
        <div style={{ marginTop: '1.2rem' }}>
          <QuestNote tone="info">
            You reached {progress.target}! The administrator is taking a quick
            look at your check-ins.
          </QuestNote>
        </div>
      )}
      {progress.needsTogether && !progress.unlocked && (
        <div style={{ marginTop: '1.2rem' }}>
          <QuestNote tone="info">
            <div className={rowClass}>
              <span>
                <b>One quick step:</b> next time you meet, show that you’re
                together so {title} unlocks on its own.
              </span>
              <Button
                size="sm"
                color="logoBlue"
                variant="soft"
                onClick={() => setModal('together')}
              >
                <Icon icon="handshake" style={{ marginRight: '0.5rem' }} />
                How?
              </Button>
            </div>
          </QuestNote>
        </div>
      )}
      {progress.needsMyBirthdate && (
        <div style={{ marginTop: '1.2rem' }}>
          <QuestNote tone="warning">
            <div className={rowClass}>
              <span>Add your birthdate so your check-ins count.</span>
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
      <div className={smallLineClass}>
        Meeting a friend? Scan each other’s codes. Friends you bring to Twinkle
        count too.
      </div>

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
            kid who scans their code unlocks {title} in one go.
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
      {modal === 'parent' && <ParentInviteModal onHide={() => setModal('')} />}
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

  async function reload() {
    try {
      handleProgress(await loadMeetupCheckins());
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Could not load your check-ins.');
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
            : `${person.username}: counts once they’ve played a few days`
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
