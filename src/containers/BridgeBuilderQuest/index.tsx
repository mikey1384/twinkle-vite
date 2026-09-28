import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import CreateCrewModal from './CreateCrewModal';
import CrewCover from './CrewCover';
import CrewDirectory from './CrewDirectory';
import CrewPanel from './CrewPanel';
import { BranchChips } from './DirectoryCard';
import JoinCrewModal from './JoinCrewModal';
import { QuestNote } from './StepCard';
import { backLinkClass, pageWidthClass, sectionClass } from './pageStyles';
import type { CrewInvitation, DirectoryCrew, MeetupQuestData } from './types';

const DARK_CITADEL_PRIVATE_ROOM_PATH = '/app/2610/vigil/megacitadel/private';

const headingClass = css`
  font-size: 1.9rem;
  font-weight: bold;
  color: ${Color.black()};
  margin: 0 0 1rem;
`;

const bodyTextClass = css`
  font-size: 1.4rem;
  color: ${Color.darkerGray()};
  line-height: 1.6;
  margin: 0;
`;

const wayHeadingClass = css`
  font-size: 1.6rem;
  font-weight: bold;
  color: ${Color.darkGray()};
  margin: 3rem 0 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  @media (max-width: ${mobileMaxWidth}) {
    margin: 2.4rem 1rem 0;
  }
`;

interface JoinTarget {
  crewId: number;
  crewName: string;
  inviteId: number;
}

// Bridge Builder's step-by-step meetup quest (achievement type 'meetup'):
// your crew, invitations, and the crew directory. The achievement's name
// comes from its data, so a rename is one DB change.
export default function BridgeBuilderQuest() {
  const userId = useKeyContext((v) => v.myState.userId);
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const loadMeetupQuest = useAppContext((v) => v.requestHelpers.loadMeetupQuest);
  const loadMyAchievements = useAppContext(
    (v) => v.requestHelpers.loadMyAchievements
  );
  const declineMeetupInvite = useAppContext(
    (v) => v.requestHelpers.declineMeetupInvite
  );
  const dismissMeetupNotice = useAppContext(
    (v) => v.requestHelpers.dismissMeetupNotice
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCrewId = Number(searchParams.get('crew')) || 0;
  const [data, setData] = useState<MeetupQuestData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [friendWay, setFriendWay] = useState<{
    isUnlocked: boolean;
    progressObj?: { label: string; currentValue: number; targetValue: number };
  } | null>(null);
  const [createShown, setCreateShown] = useState(false);
  const [joinTarget, setJoinTarget] = useState<JoinTarget | null>(null);
  const [inviteError, setInviteError] = useState('');
  const directoryRef = useRef<HTMLDivElement>(null);
  const myCrewRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!userId) return;
    reload();
    loadFriendWay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, requestedCrewId]);

  // from the achievement's data (users_achievements.title), never hard-coded
  const achievementTitle: string =
    achievementsObj?.meetup?.title || data?.achievementTitle || '';
  const achievementName = achievementTitle || 'this achievement';
  const myBranch = data?.directory?.myBranch || '';

  if (!userId) {
    return (
      <div className={css`padding: 2rem 1rem;`}>
        <HomeLoginPrompt />
      </div>
    );
  }

  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest">
      <div
        className={css`
          width: 100%;
          display: flex;
          justify-content: center;
          padding-bottom: 20rem;
        `}
      >
        <main className={pageWidthClass}>
          <Link to="/achievements" className={backLinkClass}>
            <Icon icon="arrow-left" /> Achievements
          </Link>

          <section className={sectionClass} style={{ padding: 0, overflow: 'hidden' }}>
            <CrewCover cover="galaxy" height="7rem" rounded="0" />
            <div
              className={css`
                padding: 1.8rem 2rem 2rem;
                @media (max-width: ${mobileMaxWidth}) {
                  padding: 1.4rem 1rem;
                }
              `}
            >
              <h1
                className={css`
                  font-size: 2.6rem;
                  font-weight: bold;
                  color: ${Color.black()};
                  margin: 0 0 0.8rem;
                `}
              >
                {achievementTitle
                  ? `${achievementTitle}: the meetup quest`
                  : 'The meetup quest'}
              </h1>
              <p className={bodyTextClass}>
                Meet up in real life with at least 3 students, each from a
                different Twinkle branch (for example one from Daechi, one from
                Busan, one from Mokdong), with a parent or a Twinkle teacher
                there. Do something together that is really educational and
                film it. Everyone who showed up unlocks <b>{achievementName}</b>.
              </p>
              <p className={bodyTextClass} style={{ marginTop: '0.6rem' }}>
                Find or start a crew, get your parents on board, send your
                plan, meet and film, then an admin reviews it. Nothing after
                the plan unlocks until an admin approves it.
              </p>
              <div
                className={css`
                  display: flex;
                  gap: 0.8rem;
                  flex-wrap: wrap;
                  margin-top: 1.4rem;
                `}
              >
                {data && !data.hasActiveCrew && (
                  <Button color="green" onClick={() => setCreateShown(true)}>
                    <Icon icon="plus" style={{ marginRight: '0.6rem' }} />
                    Start a crew
                  </Button>
                )}
                {data?.hasActiveCrew && (
                  <Button
                    color="logoBlue"
                    onClick={() => myCrewRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Icon icon="users" style={{ marginRight: '0.6rem' }} />
                    Go to your crew
                  </Button>
                )}
                <Button
                  variant="soft"
                  color="logoBlue"
                  onClick={() => directoryRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Icon icon="search" style={{ marginRight: '0.6rem' }} />
                  Browse crews
                </Button>
              </div>
              <div style={{ marginTop: '1.4rem' }}>
                <QuestNote tone="info">
                  <b>Stay safe:</b> never post an address, a phone number or
                  an exact meeting spot here. Use Twinkle chat to talk with
                  your crew, and let the adult who is coming handle the exact
                  place.
                </QuestNote>
              </div>
              {friendWay?.isUnlocked && (
                <div style={{ marginTop: '1rem' }}>
                  <QuestNote tone="success">
                    You already unlocked {achievementName}. You can still join a
                    crew and help your friends get it too.
                  </QuestNote>
                </div>
              )}
            </div>
          </section>

          {loadError && (
            <div style={{ marginTop: '2rem' }}>
              <QuestNote tone="warning">{loadError}</QuestNote>
            </div>
          )}
          {!data && !loadError && <Loading />}

          {data?.notices?.map((notice) => (
            <div key={`notice-${notice.crewId}`} style={{ marginTop: '1.6rem' }}>
              <QuestNote tone="info">
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                  `}
                >
                  <span>
                    {notice.kind === 'removed'
                      ? `You were removed from crew "${notice.crewName}". You can join or start another crew any time.`
                      : `Your crew "${notice.crewName}" was disbanded by its founder. You can join or start another crew any time.`}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="darkGray"
                    onClick={() => handleDismissNotice(notice.crewId)}
                  >
                    OK
                  </Button>
                </div>
              </QuestNote>
            </div>
          ))}

          {!!data?.invites?.length && (
            <section className={sectionClass}>
              <h2 className={headingClass}>
                <Icon icon="user-plus" style={{ color: Color.purple() }} /> You&apos;re
                invited
              </h2>
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  gap: 1rem;
                `}
              >
                {data.invites.map((invite) => (
                  <InvitationCard
                    key={invite.inviteId}
                    invite={invite}
                    hasActiveCrew={data.hasActiveCrew}
                    onJoin={() =>
                      setJoinTarget({
                        crewId: invite.crewId,
                        crewName: invite.displayName,
                        inviteId: invite.inviteId
                      })
                    }
                    onDecline={() => handleDecline(invite.inviteId)}
                  />
                ))}
              </div>
              {inviteError && (
                <div style={{ marginTop: '1rem' }}>
                  <QuestNote tone="warning">{inviteError}</QuestNote>
                </div>
              )}
            </section>
          )}

          {data?.reviewQueue && (
            <section className={sectionClass}>
              <h2 className={headingClass}>
                <Icon icon="clipboard-check" style={{ color: Color.purple() }} />{' '}
                Admin: waiting for review
              </h2>
              {data.reviewQueue.length === 0 ? (
                <p className={bodyTextClass}>Nothing is waiting right now.</p>
              ) : (
                <ul
                  className={css`
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.6rem;
                  `}
                >
                  {data.reviewQueue.map((item) => (
                    <li
                      key={item.crewId}
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        flex-wrap: wrap;
                        font-size: 1.4rem;
                      `}
                    >
                      <b>Crew #{item.crewId}</b>
                      <span>
                        {item.waitingFor === 'video' ? 'Video' : 'Plan'} ·{' '}
                        {item.members
                          .map((member) => `${member.username} (${member.branch})`)
                          .join(', ')}
                      </span>
                      <Button
                        size="sm"
                        variant="soft"
                        color="purple"
                        onClick={() => setSearchParams({ crew: String(item.crewId) })}
                      >
                        Review
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {data?.requestedCrew && (
            <div style={{ marginTop: '2rem' }}>
              <div
                className={css`
                  display: flex;
                  justify-content: flex-end;
                  margin-bottom: 0.6rem;
                `}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  color="darkGray"
                  onClick={() => setSearchParams({})}
                >
                  <Icon icon="times" style={{ marginRight: '0.4rem' }} />
                  Close crew #{data.requestedCrew.crewId}
                </Button>
              </div>
              <CrewPanel
                crew={data.requestedCrew}
                achievementTitle={achievementName}
                myId={userId}
                onChanged={reload}
              />
            </div>
          )}

          {data && (
            <>
              <h2 className={wayHeadingClass}>Way 1: the meetup quest</h2>
              {data.myCrew && (
                <div ref={myCrewRef} style={{ marginTop: '1rem' }}>
                  <CrewPanel
                    crew={data.myCrew}
                    achievementTitle={achievementName}
                    myId={userId}
                    onChanged={reload}
                  />
                </div>
              )}
              <section ref={directoryRef} className={sectionClass}>
                <div
                  className={css`
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                    margin-bottom: 1.4rem;
                  `}
                >
                  <div>
                    <h2 className={headingClass} style={{ margin: 0 }}>
                      Find a crew
                    </h2>
                    <p className={bodyTextClass} style={{ fontSize: '1.3rem' }}>
                      Crews show usernames, profile pictures and branches.
                      Plans and videos stay private to each crew.
                    </p>
                  </div>
                  {!data.hasActiveCrew && (
                    <Button color="green" onClick={() => setCreateShown(true)}>
                      <Icon icon="plus" style={{ marginRight: '0.6rem' }} />
                      Start a crew
                    </Button>
                  )}
                </div>
                <CrewDirectory
                  directory={data.directory}
                  achievementTitle={achievementTitle}
                  onJoin={handleDirectoryJoin}
                />
              </section>
            </>
          )}

          <h2 className={wayHeadingClass}>Way 2: bring a friend</h2>
          <section className={sectionClass} style={{ marginTop: '1rem' }}>
            <p className={bodyTextClass}>
              Bring a friend who isn&apos;t on Twinkle yet: play{' '}
              <Link to={DARK_CITADEL_PRIVATE_ROOM_PATH} style={{ fontWeight: 'bold' }}>
                The Dark Citadel
              </Link>{' '}
              together for 10 minutes in a private room while they&apos;re a
              guest, and they sign up (or, if you moderate our Minecraft server,
              vouch for a new player who joins Twinkle).
            </p>
            {friendWay?.progressObj && !friendWay.isUnlocked && (
              <div style={{ marginTop: '1.2rem' }}>
                <div
                  className={css`
                    font-size: 1.4rem;
                    font-weight: bold;
                    color: ${Color.black()};
                  `}
                >
                  {friendWay.progressObj.label}: {friendWay.progressObj.currentValue}/
                  {friendWay.progressObj.targetValue}
                </div>
                <ProgressBar
                  progress={Math.min(
                    100,
                    Math.ceil(
                      (100 * friendWay.progressObj.currentValue) /
                        (friendWay.progressObj.targetValue || 1)
                    )
                  )}
                />
              </div>
            )}
          </section>
        </main>
      </div>
      {createShown && (
        <CreateCrewModal
          defaultBranch={myBranch}
          onHide={() => setCreateShown(false)}
          onCreated={reload}
        />
      )}
      {joinTarget && (
        <JoinCrewModal
          crewId={joinTarget.crewId}
          crewName={joinTarget.crewName}
          inviteId={joinTarget.inviteId}
          defaultBranch={myBranch}
          onHide={() => setJoinTarget(null)}
          onJoined={reload}
        />
      )}
    </ErrorBoundary>
  );

  async function reload() {
    const requestId = ++requestIdRef.current;
    try {
      const next = await loadMeetupQuest(requestedCrewId || undefined);
      if (requestId !== requestIdRef.current) return;
      setData(next);
      setLoadError('');
    } catch (error: any) {
      if (requestId !== requestIdRef.current) return;
      setLoadError(error?.message || 'Could not load the quest. Please refresh.');
    }
  }

  async function loadFriendWay() {
    try {
      const achievements = await loadMyAchievements();
      const meetup = achievements?.meetup;
      if (meetup) {
        setFriendWay({
          isUnlocked: !!meetup.isUnlocked,
          progressObj: meetup.progressObj
        });
      }
    } catch {
      setFriendWay(null);
    }
  }

  function handleDirectoryJoin(crew: DirectoryCrew) {
    setJoinTarget({
      crewId: crew.crewId,
      crewName: crew.displayName,
      inviteId: crew.inviteId
    });
  }

  async function handleDecline(inviteId: number) {
    setInviteError('');
    try {
      await declineMeetupInvite(inviteId);
      await reload();
    } catch (error: any) {
      setInviteError(error?.message || 'Could not decline the invitation.');
    }
  }

  async function handleDismissNotice(crewId: number) {
    try {
      await dismissMeetupNotice(crewId);
    } finally {
      await reload();
    }
  }
}

function InvitationCard({
  invite,
  hasActiveCrew,
  onJoin,
  onDecline
}: {
  invite: CrewInvitation;
  hasActiveCrew: boolean;
  onJoin: () => void;
  onDecline: () => void;
}) {
  const blocked = hasActiveCrew
    ? 'Leave your current crew first to join this one.'
    : invite.canJoin
    ? ''
    : invite.closedReason;
  return (
    <div
      className={css`
        display: flex;
        gap: 1.2rem;
        align-items: center;
        border: 1px solid ${Color.purple(0.35)};
        background: ${Color.purple(0.04)};
        border-radius: 1.2rem;
        padding: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          flex-direction: column;
          align-items: stretch;
        }
      `}
    >
      <div
        className={css`
          width: 9rem;
          flex-shrink: 0;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
          }
        `}
      >
        <CrewCover cover={invite.cover} height="6rem" rounded="0.9rem" />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem', color: Color.black() }}>
          <b>{invite.inviterUsername}</b> invited you to crew{' '}
          <b>&quot;{invite.displayName}&quot;</b>
        </span>
        <BranchChips names={invite.branchNames} />
        {blocked && (
          <span style={{ fontSize: '1.2rem', color: Color.darkGray() }}>{blocked}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
        <Button color="logoBlue" disabled={!!blocked} onClick={onJoin}>
          Join
        </Button>
        <Button variant="ghost" color="darkGray" onClick={onDecline}>
          Decline
        </Button>
      </div>
    </div>
  );
}
