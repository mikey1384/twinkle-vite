import React, { useState } from 'react';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import FormModal from '~/components/AchievementItem/FormModal';
import { Link } from 'react-router-dom';
import { useAppContext, useKeyContext } from '~/contexts';
import { css, keyframes } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { SITE_NAME } from '~/constants/siteBrand';
import { timeSince } from '~/helpers/timeStampHelpers';
import { getStoredItem, setStoredItem } from '~/helpers/userDataHelpers';
import {
  BROUGHT_FRIENDS_ANCHOR_ID,
  BROUGHT_FRIENDS_TIERS,
  broughtFriendsHeadline,
  getBroughtFriendsTier,
  getNextBroughtFriendsTier,
  readReferrals
} from '~/components/BroughtFriendsBadge/tiers';

const DARK_CITADEL_PRIVATE_ROOM_PATH = '/app/2610/vigil/megacitadel/private';
const NUDGE_DISMISS_KEY_PREFIX = 'bring-a-friend-nudge-dismissed:';
const PLAQUE_BG = '#10142a';
const PLAQUE_RAISED = '#1a2142';

const medallionFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.5rem); }
`;
const haloPulse = keyframes`
  0%, 100% { opacity: 0.35; transform: scale(0.96); }
  50% { opacity: 0.75; transform: scale(1.04); }
`;
const twinkle = keyframes`
  0%, 100% { opacity: 0.15; transform: scale(0.6); }
  50% { opacity: 1; transform: scale(1); }
`;
const fillIn = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const SPARKLES = [
  { top: '6%', left: '10%', delay: '0s' },
  { top: '14%', left: '88%', delay: '0.9s' },
  { top: '78%', left: '4%', delay: '1.7s' },
  { top: '88%', left: '84%', delay: '0.4s' },
  { top: '46%', left: '98%', delay: '2.3s' }
];

// "Brought N people to Twinkle": the honour plaque at the top of a profile.
// Nothing on other people's profiles at zero. On your own, a quiet card that
// follows your invite rewards status (sent by the server with your own
// session, never your birthday or age): the invite prompt if you can earn
// invite rewards (approved birthday, under 18), a nudge to add your birthday
// if none is on file, a note while it is being checked. Grown-ups see nothing
// (Mikey, 2026-09-28: "dont show this to grownup users. just teenagers and
// below"), and neither does anyone whose birthday was rejected.
export default function BroughtFriends({
  profile,
  isOwnProfile
}: {
  profile: any;
  isOwnProfile: boolean;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const inviteRewardsStatus = useKeyContext(
    (v) => v.myState.inviteRewardsStatus
  );
  const referrals = readReferrals(profile?.referrals);
  if (!referrals) return null;
  const { count, recent } = referrals;
  if (count <= 0) {
    if (!isOwnProfile || !myId) return null;
    if (inviteRewardsStatus === 'eligible') return <BringAFriendPrompt />;
    if (
      inviteRewardsStatus === 'needs_birthday' ||
      inviteRewardsStatus === 'pending'
    ) {
      return (
        <BirthdayNudge
          key={inviteRewardsStatus}
          userId={myId}
          status={inviteRewardsStatus}
        />
      );
    }
    return null;
  }
  const tier = getBroughtFriendsTier(count);
  if (!tier) return null;
  const next = getNextBroughtFriendsTier(count);
  const progress = next
    ? Math.min(1, (count - tier.min) / (next.min - tier.min))
    : 1;
  const tierVars = { '--bf-tier': tier.color } as React.CSSProperties;

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/BroughtFriends">
      <section
        id={BROUGHT_FRIENDS_ANCHOR_ID}
        aria-label={broughtFriendsHeadline(count)}
        style={tierVars}
        className={css`
          position: relative;
          overflow: hidden;
          margin-bottom: 1.5rem;
          border-radius: ${borderRadius};
          background: ${PLAQUE_BG};
          border: 1px solid var(--bf-tier);
          color: #fff;
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-left: none;
            border-right: none;
          }
        `}
      >
        {SPARKLES.map((sparkle, index) => (
          <span
            key={index}
            aria-hidden
            style={{
              top: sparkle.top,
              left: sparkle.left,
              animationDelay: sparkle.delay
            }}
            className={css`
              position: absolute;
              width: 0.5rem;
              height: 0.5rem;
              border-radius: 50%;
              background: var(--bf-tier);
              animation: ${twinkle} 3.4s ease-in-out infinite;
              pointer-events: none;
              @media (prefers-reduced-motion: reduce) {
                animation: none;
                opacity: 0.4;
              }
            `}
          />
        ))}
        <div
          className={css`
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 2.6rem;
            align-items: center;
            padding: 2.6rem 3rem 2.2rem;
            @media (max-width: ${mobileMaxWidth}) {
              grid-template-columns: minmax(0, 1fr);
              justify-items: center;
              gap: 1.6rem;
              padding: 2.2rem 1.6rem 1.8rem;
              text-align: center;
            }
          `}
        >
          <Medallion src={tier.badgeSrc} name={tier.name} />
          <div
            className={css`
              min-width: 0;
              width: 100%;
            `}
          >
            <div
              className={css`
                font-size: 1.3rem;
                font-weight: 800;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: var(--bf-tier);
              `}
            >
              {tier.name} · {SITE_NAME} honour
            </div>
            <div
              className={css`
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: 0 1.2rem;
                margin-top: 0.6rem;
                line-height: 1.05;
                @media (max-width: ${mobileMaxWidth}) {
                  justify-content: center;
                }
              `}
            >
              <span
                className={css`
                  font-size: 6.4rem;
                  font-weight: 900;
                  color: var(--bf-tier);
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 5.6rem;
                  }
                `}
              >
                {count.toLocaleString()}
              </span>
              <span
                className={css`
                  font-size: 2.4rem;
                  font-weight: 800;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 2.1rem;
                  }
                `}
              >
                {count === 1 ? 'person' : 'people'} brought to {SITE_NAME}
              </span>
            </div>
            <div
              className={css`
                margin-top: 1.6rem;
                max-width: 52rem;
                @media (max-width: ${mobileMaxWidth}) {
                  margin-left: auto;
                  margin-right: auto;
                }
              `}
            >
              <div
                className={css`
                  height: 0.9rem;
                  border-radius: 1rem;
                  background: ${PLAQUE_RAISED};
                  overflow: hidden;
                `}
              >
                <div
                  style={{ width: `${Math.max(4, progress * 100)}%` }}
                  className={css`
                    height: 100%;
                    border-radius: 1rem;
                    background: var(--bf-tier);
                    transform-origin: left center;
                    animation: ${fillIn} 1.1s cubic-bezier(0.2, 0.8, 0.2, 1);
                    @media (prefers-reduced-motion: reduce) {
                      animation: none;
                    }
                  `}
                />
              </div>
              <div
                className={css`
                  margin-top: 0.7rem;
                  font-size: 1.4rem;
                  color: rgba(255, 255, 255, 0.78);
                `}
              >
                {next
                  ? `${(next.min - count).toLocaleString()} more to reach ${
                      next.name
                    }`
                  : 'The highest honour there is. Thank you.'}
              </div>
            </div>
            <TierLadder count={count} />
          </div>
        </div>
        {recent.length > 0 && (
          <div
            className={css`
              padding: 1.6rem 3rem 1.8rem;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              @media (max-width: ${mobileMaxWidth}) {
                padding: 1.4rem 1.6rem 1.6rem;
              }
            `}
          >
            <div
              className={css`
                font-size: 1.3rem;
                font-weight: 700;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 1rem;
              `}
            >
              {recent.length < count ? 'Most recent to join' : 'They joined'}
            </div>
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                gap: 0.8rem;
              `}
            >
              {recent.map((person) => (
                <Link
                  key={person.userId}
                  to={`/users/${person.username}`}
                  className={css`
                    display: inline-flex;
                    align-items: center;
                    gap: 0.8rem;
                    min-width: 0;
                    max-width: 100%;
                    padding: 0.5rem 1.2rem 0.5rem 0.5rem;
                    border-radius: 3rem;
                    background: ${PLAQUE_RAISED};
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: #fff;
                    text-decoration: none;
                    transition: border-color 0.2s;
                    &:hover {
                      border-color: var(--bf-tier);
                      text-decoration: none;
                    }
                  `}
                >
                  <ProfilePic
                    userId={person.userId}
                    profilePicUrl={person.profilePicUrl || undefined}
                    style={{ width: '3.4rem', flexShrink: 0 }}
                  />
                  <span
                    className={css`
                      display: flex;
                      flex-direction: column;
                      min-width: 0;
                      line-height: 1.25;
                      text-align: left;
                    `}
                  >
                    <span
                      className={css`
                        font-size: 1.4rem;
                        font-weight: 700;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                      `}
                    >
                      {person.username}
                    </span>
                    <span
                      className={css`
                        font-size: 1.2rem;
                        color: rgba(255, 255, 255, 0.65);
                        white-space: nowrap;
                      `}
                    >
                      <Icon
                        icon={person.source === 'minecraft' ? 'cubes' : 'fire'}
                        style={{ marginRight: '0.4rem' }}
                      />
                      {person.source === 'minecraft'
                        ? 'Minecraft'
                        : 'The Dark Citadel'}
                      {person.joinedAt ? ` · ${timeSince(person.joinedAt)}` : ''}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div
          className={css`
            padding: 1.2rem 3rem 1.4rem;
            background: ${PLAQUE_RAISED};
            font-size: 1.3rem;
            line-height: 1.5;
            color: rgba(255, 255, 255, 0.75);
            a {
              color: var(--bf-tier);
              font-weight: 700;
            }
            @media (max-width: ${mobileMaxWidth}) {
              padding: 1.2rem 1.6rem 1.4rem;
            }
          `}
        >
          <Icon icon="user-plus" style={{ marginRight: '0.6rem' }} />
          Earned when friends join {SITE_NAME}: play{' '}
          <Link to={DARK_CITADEL_PRIVATE_ROOM_PATH}>The Dark Citadel</Link> with them
          in a private room, or vouch for them on our Minecraft server (moderators).
        </div>
      </section>
    </ErrorBoundary>
  );
}

function Medallion({ src, name }: { src: string; name: string }) {
  return (
    <div
      className={css`
        position: relative;
        width: 15rem;
        height: 15rem;
        flex-shrink: 0;
        animation: ${medallionFloat} 5s ease-in-out infinite;
        @media (max-width: ${mobileMaxWidth}) {
          width: 13rem;
          height: 13rem;
        }
        @media (prefers-reduced-motion: reduce) {
          animation: none;
        }
      `}
    >
      <div
        aria-hidden
        className={css`
          position: absolute;
          inset: 3%;
          border-radius: 50%;
          box-shadow: 0 0 3.2rem 0.8rem var(--bf-tier);
          animation: ${haloPulse} 3.2s ease-in-out infinite;
          @media (prefers-reduced-motion: reduce) {
            animation: none;
            opacity: 0.5;
          }
        `}
      />
      <img
        src={src}
        alt={`${name} badge`}
        className={css`
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        `}
      />
    </div>
  );
}

function TierLadder({ count }: { count: number }) {
  return (
    <ol
      aria-label="Honour tiers"
      className={css`
        display: flex;
        flex-wrap: wrap;
        gap: 1.4rem;
        list-style: none;
        margin: 2rem 0 0;
        padding: 0;
        @media (max-width: ${mobileMaxWidth}) {
          justify-content: center;
          gap: 1rem;
        }
      `}
    >
      {BROUGHT_FRIENDS_TIERS.map((tier, index) => {
        const earned = count >= tier.min;
        const nextTier = BROUGHT_FRIENDS_TIERS[index + 1];
        const isCurrent = earned && (!nextTier || count < nextTier.min);
        return (
          <li
            key={tier.min}
            title={`${tier.name}: ${tier.min.toLocaleString()}+ ${
              tier.min === 1 ? 'person' : 'people'
            }${earned ? ' (earned)' : ''}`}
            style={{ '--bf-step': tier.color } as React.CSSProperties}
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0.4rem;
              width: 5.6rem;
            `}
          >
            <img
              src={tier.badgeSrc}
              alt=""
              loading="lazy"
              className={css`
                width: 4.6rem;
                height: 4.6rem;
                object-fit: contain;
                filter: ${earned
                  ? 'drop-shadow(0 0 0.35rem var(--bf-step))'
                  : 'grayscale(1) brightness(0.45)'};
                @media (max-width: ${mobileMaxWidth}) {
                  width: 4rem;
                  height: 4rem;
                }
              `}
            />
            <span
              className={css`
                font-size: 1.2rem;
                font-weight: 800;
                white-space: nowrap;
                color: ${earned
                  ? 'var(--bf-step)'
                  : 'rgba(255, 255, 255, 0.45)'};
              `}
            >
              {isCurrent ? tier.name : `${tier.min.toLocaleString()}+`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function BringAFriendPrompt() {
  const firstTier = BROUGHT_FRIENDS_TIERS[0];
  return (
    <PromptCard
      componentPath="Profile/Body/Home/BroughtFriends/Prompt"
      title={`Bring a friend to ${SITE_NAME}`}
    >
      Invite a friend who isn&apos;t on {SITE_NAME} yet into a private room in{' '}
      <Link to={DARK_CITADEL_PRIVATE_ROOM_PATH}>The Dark Citadel</Link> and play
      together for 10 minutes, or, if you moderate our Minecraft server, vouch
      for a player there. When they join, you earn the {firstTier.name} badge,
      shown here and on your cover.
    </PromptCard>
  );
}

// The same card, before invite rewards open: no birthday on file yet (add it
// through the usual birthday check), or one waiting for an admin to check it.
function BirthdayNudge({
  userId,
  status
}: {
  userId: number;
  status: 'needs_birthday' | 'pending';
}) {
  const firstTier = BROUGHT_FRIENDS_TIERS[0];
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const checkDobApprovalSubmission = useAppContext(
    (v) => v.requestHelpers.checkDobApprovalSubmission
  );
  const dismissKey = `${NUDGE_DISMISS_KEY_PREFIX}${userId}:${status}`;
  const [dismissed, setDismissed] = useState(
    () => getStoredItem(dismissKey) === '1'
  );
  const [formShown, setFormShown] = useState(false);
  if (dismissed) return null;

  return (
    <>
      <PromptCard
        componentPath="Profile/Body/Home/BroughtFriends/BirthdayNudge"
        title={
          status === 'pending'
            ? 'Your birthday is being checked'
            : 'Add your birthday to unlock invite rewards'
        }
        actions={
          <>
            {status === 'needs_birthday' && (
              <Button
                size="sm"
                color="logoBlue"
                onClick={() => setFormShown(true)}
              >
                Add birthday
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not now
            </Button>
          </>
        }
      >
        {status === 'pending' ? (
          <>
            Invite rewards open up after that. Then you can bring a friend to{' '}
            {SITE_NAME} and earn the {firstTier.name} badge.
          </>
        ) : (
          <>
            Then you can bring a friend who isn&apos;t on {SITE_NAME} yet and
            earn the {firstTier.name} badge, shown here and on your cover. An
            admin checks your birthday first.
          </>
        )}
      </PromptCard>
      {formShown && <FormModal type="dob" onHide={handleFormHide} />}
    </>
  );

  function handleDismiss() {
    setStoredItem(dismissKey, '1');
    setDismissed(true);
  }

  async function handleFormHide() {
    setFormShown(false);
    // the card follows the server: once the birthday is on file, it's pending
    try {
      const { status: submitStatus } = await checkDobApprovalSubmission();
      if (submitStatus === 'pending') {
        onSetUserState({
          userId,
          newState: { inviteRewardsStatus: 'pending' }
        });
      }
    } catch (error) {
      console.error('Failed to check the birthday submission:', error);
    }
  }
}

function PromptCard({
  componentPath,
  title,
  children,
  actions
}: {
  componentPath: string;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const firstTier = BROUGHT_FRIENDS_TIERS[0];
  return (
    <ErrorBoundary componentPath={componentPath}>
      <section
        id={BROUGHT_FRIENDS_ANCHOR_ID}
        aria-label={title}
        className={css`
          display: flex;
          align-items: center;
          gap: 1.6rem;
          margin-bottom: 1.5rem;
          padding: 1.4rem 2rem;
          border-radius: ${borderRadius};
          border: 1px dashed var(--ui-border, ${Color.borderGray()});
          background: #fff;
          color: ${Color.darkerGray()};
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-left: none;
            border-right: none;
            padding: 1.4rem 1.6rem;
          }
        `}
      >
        <img
          src={firstTier.badgeSrc}
          alt=""
          loading="lazy"
          className={css`
            width: 5.2rem;
            height: 5.2rem;
            flex-shrink: 0;
            align-self: flex-start;
            object-fit: contain;
            filter: grayscale(1);
            opacity: 0.55;
          `}
        />
        <div
          className={css`
            min-width: 0;
            font-size: 1.4rem;
            line-height: 1.5;
            a {
              font-weight: 700;
            }
          `}
        >
          <div
            className={css`
              font-size: 1.6rem;
              font-weight: 800;
              margin-bottom: 0.2rem;
            `}
          >
            {title}
          </div>
          {children}
          {actions && (
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.8rem;
                margin-top: 1rem;
              `}
            >
              {actions}
            </div>
          )}
        </div>
      </section>
    </ErrorBoundary>
  );
}
