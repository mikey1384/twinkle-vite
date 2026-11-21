import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  BRIDGE_BUILDER_BAR_LEARNING_DAYS,
  BRIDGE_BUILDER_BAR_LEARNING_XP,
  BRIDGE_BUILDER_INVITE_APP_PATH
} from '~/constants/meetupQuest';
import { QuestNote } from './StepCard';
import type { TourFriend, TourScreen } from './types';

// Bridge Builder path 3 (Mikey 2026-11-21): show 7 different Twinkle users
// around Twinkle Minecraft World. An MMO-style quest log: the landmarks, each
// friend's ticks, one next step. The server sees each spot (both people there
// together, really moving) and notifies both; this card only shows it.
export default function TourCard() {
  const navigate = useNavigate();
  const loadBridgeTour = useAppContext((v) => v.requestHelpers.loadBridgeTour);
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const [tour, setTour] = useState<TourScreen | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    reload();
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!tour) {
    return error ? <QuestNote tone="warning">{error}</QuestNote> : null;
  }
  const guided = tour.friends.filter((f) => f.role === 'guide');
  const shownMe = tour.friends.filter((f) => f.state === 'shown_me');
  const total = tour.landmarks.length;

  return (
    <section className={cardClass}>
      <div className={labelClass}>
        <Icon icon="cubes" /> Path 3 · Show friends around
      </div>
      <h2 className={titleClass}>
        {tour.unlocked
          ? 'Bridge Builder unlocked!'
          : `Show ${tour.target} Twinkle friends around Twinkle Minecraft World`}
      </h2>
      <div className={countClass}>
        {Math.min(tour.counted, tour.target)} of {tour.target} friends counted
      </div>

      {renderNextStep()}

      {total > 0 && !tour.unlocked && (
        <div style={{ marginTop: '1.4rem' }}>
          <div className={sectionLabelClass}>The tour: {total} spots</div>
          <ol className={landmarkListClass}>
            {tour.landmarks.map((l) => (
              <li key={l.id}>{l.name}</li>
            ))}
          </ol>
          <div className={smallClass}>
            Go to each spot together with your friend. Every spot you both reach
            counts for both of you, and you each get a notification. The list
            also shows in the game.
          </div>
        </div>
      )}

      {guided.length > 0 && (
        <div style={{ marginTop: '1.4rem' }}>
          <div className={sectionLabelClass}>Friends you showed around</div>
          <ul className={listClass}>
            {guided.map((f) => (
              <FriendRow
                key={`${f.userId}-${f.minecraftName}`}
                friend={f}
                total={total}
              />
            ))}
          </ul>
        </div>
      )}
      {shownMe.length > 0 && (
        <div className={smallClass} style={{ marginTop: '1rem' }}>
          Shown around by{' '}
          {shownMe.map((f) => f.username || f.minecraftName).join(', ')}: that
          counts for them, since they joined Twinkle first.
        </div>
      )}

      {!tour.unlocked && (
        <div style={{ marginTop: '1.4rem' }}>
          <Button
            color="green"
            onClick={() => {
              trackMeetupQuestView('tour_world_open');
              navigate(BRIDGE_BUILDER_INVITE_APP_PATH);
            }}
          >
            <Icon icon="cubes" style={{ marginRight: '0.6rem' }} />
            Open Twinkle Minecraft World
          </Button>
        </div>
      )}
    </section>
  );

  function renderNextStep() {
    if (!tour || tour.nextStep === 'unlocked') return null;
    const line = (tone: 'info' | 'warning', body: React.ReactNode) => (
      <div style={{ marginTop: '1.2rem' }}>
        <QuestNote tone={tone}>
          <b>Next step:</b> {body}
        </QuestNote>
      </div>
    );
    if (tour.nextStep === 'wait_review') {
      return line(
        'info',
        <>
          Your tours are saved. Mikey is checking them before the achievement
          unlocks. You don’t need to do anything else.
        </>
      );
    }
    if (tour.nextStep === 'rejected') {
      return line(
        'warning',
        <>
          These tours weren’t approved. They stay saved; new tours with
          different friends ask Mikey again.
        </>
      );
    }
    if (tour.nextStep === 'friend_learning') {
      const friend = tour.friends
        .filter((f) => f.state === 'getting_started')
        .sort((a, b) => (a.deadline || 0) - (b.deadline || 0))[0];
      return line(
        'info',
        <>
          {friend?.username || 'Your friend'} finished the tour! They count once
          they learn on Twinkle on {BRIDGE_BUILDER_BAR_LEARNING_DAYS} different
          days and earn {BRIDGE_BUILDER_BAR_LEARNING_XP.toLocaleString('en-US')}{' '}
          learning XP
          {friend?.deadline ? ` by ${shortDate(friend.deadline)}` : ''}.
        </>
      );
    }
    if (tour.nextStep === 'keep_touring') {
      const friend = tour.friends.find(
        (f) => f.role === 'guide' && f.state === 'touring'
      );
      const left = friend
        ? Math.max(0, tour.landmarks.length - friend.spots.length)
        : 0;
      return line(
        'info',
        <>
          Keep going with {friend?.username || 'your friend'}:{' '}
          {left === 1 ? '1 spot' : `${left} spots`} left. Walk there together.
        </>
      );
    }
    return line(
      'info',
      <>
        Invite a Twinkle friend (new or not) to Twinkle Minecraft World and walk
        to each spot on the tour together.
      </>
    );
  }

  async function reload() {
    try {
      setTour(await loadBridgeTour());
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Could not load your tours.');
    }
  }
}

function FriendRow({ friend, total }: { friend: TourFriend; total: number }) {
  let status: React.ReactNode;
  if (friend.state === 'counted') {
    status = (
      <span style={{ color: Color.green(), fontWeight: 'bold' }}>
        <Icon icon="check" /> Counts
      </span>
    );
  } else if (friend.state === 'touring') {
    status = `${friend.spots.length} of ${total} spots together`;
  } else if (friend.state === 'getting_started') {
    status = `Tour done · counts after ${BRIDGE_BUILDER_BAR_LEARNING_DAYS} learning days and ${BRIDGE_BUILDER_BAR_LEARNING_XP.toLocaleString('en-US')} XP${friend.deadline ? ` (by ${shortDate(friend.deadline)})` : ''}`;
  } else if (friend.state === 'needs_account') {
    status = `${friend.spots.length} of ${total} spots · counts once they link a Twinkle account`;
  } else if (friend.timedOut) {
    status = 'Time ran out before they reached the learning goal';
  } else {
    status = 'Doesn’t count';
  }
  return (
    <li className={rowClass}>
      <div className={picClass}>
        {friend.userId > 0 ? (
          <ProfilePic userId={friend.userId} profilePicUrl="" size="100%" />
        ) : (
          <Icon icon="cubes" />
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className={nameClass}>
          {friend.username || friend.minecraftName}
        </div>
        <div className={statusClass}>{status}</div>
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

const cardClass = css`
  border-radius: 1.6rem;
  border: 1px solid ${Color.green(0.35)};
  background: ${Color.green(0.05)};
  padding: 2rem;
  margin-top: 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    padding: 1.6rem 1rem;
  }
`;

const labelClass = css`
  font-size: 1.3rem;
  font-weight: bold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${Color.green()};
`;

const titleClass = css`
  margin: 0.4rem 0 0.6rem;
  font-size: 2.1rem;
  color: ${Color.black()};
`;

const countClass = css`
  font-size: 1.6rem;
  font-weight: bold;
  color: ${Color.black()};
`;

const sectionLabelClass = css`
  font-size: 1.3rem;
  font-weight: bold;
  color: ${Color.darkerGray()};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const landmarkListClass = css`
  margin: 0.6rem 0 0;
  padding-left: 2rem;
  font-size: 1.4rem;
  line-height: 1.6;
  color: ${Color.black()};
`;

const smallClass = css`
  margin-top: 0.6rem;
  font-size: 1.3rem;
  line-height: 1.5;
  color: ${Color.darkGray()};
`;

const listClass = css`
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const rowClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 0.8rem;
  border-radius: 1rem;
  background: #fff;
  border: 1px solid var(--ui-border);
`;

const picClass = css`
  width: 3.6rem;
  height: 3.6rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: ${Color.green()};
`;

const nameClass = css`
  font-weight: bold;
  font-size: 1.4rem;
  overflow-wrap: anywhere;
`;

const statusClass = css`
  font-size: 1.25rem;
  line-height: 1.4;
  color: ${Color.darkGray()};
`;
