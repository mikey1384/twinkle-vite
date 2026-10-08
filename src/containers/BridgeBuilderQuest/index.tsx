import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
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
import useMeetupRefresh from './useMeetupRefresh';
import { BranchChips, crewPath } from './DirectoryCard';
import AdminCrewBoard from './AdminCrewBoard';
import JoinCrewModal from './JoinCrewModal';
import { QuestNote } from './StepCard';
import { backLinkClass, pageWidthClass, sectionClass } from './pageStyles';
import { StaffNav } from './staff/shared';
import type {
  CrewInvitation,
  DirectoryCrew,
  MeetupQuestData,
  StaffSummary
} from './types';
import {
  AdminStoryQueue,
  ExampleStoriesRow,
  StoryHallRow
} from './Story/QuestStories';
import { storyPath } from './Story/storyHelpers';
import type { StoriesOverview } from './Story/types';

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

interface JoinTarget {
  crewId: number;
  crewName: string;
  inviteId: number;
}

// Bridge Builder's step-by-step meetup quest (achievement type 'meetup'):
// your crew, invitations, and the crew directory. The achievement's name
// comes from its data, so a rename is one DB change.
export default function BridgeBuilderQuest({
  view = 'member'
}: {
  // 'staff' is the staff desk (/achievements/bridge-builder/staff): the crew
  // board and the review queues, kept off the members' page
  view?: 'member' | 'staff';
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const loadMeetupQuest = useAppContext(
    (v) => v.requestHelpers.loadMeetupQuest
  );
  const loadMyAchievements = useAppContext(
    (v) => v.requestHelpers.loadMyAchievements
  );
  const declineMeetupInvite = useAppContext(
    (v) => v.requestHelpers.declineMeetupInvite
  );
  const dismissMeetupNotice = useAppContext(
    (v) => v.requestHelpers.dismissMeetupNotice
  );
  const loadMeetupStaffSummary = useAppContext(
    (v) => v.requestHelpers.loadMeetupStaffSummary
  );
  const loadMeetupStoriesOverview = useAppContext(
    (v) => v.requestHelpers.loadMeetupStoriesOverview
  );
  const [staff, setStaff] = useState<StaffSummary | null>(null);
  const [staffChecked, setStaffChecked] = useState(false);
  const [stories, setStories] = useState<StoriesOverview | null>(null);
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
  useMeetupRefresh({
    enabled: !!userId,
    channelId: (data?.requestedCrew || data?.myCrew)?.chat?.channelId,
    refresh: reload
  });
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );

  useEffect(() => {
    if (userId) trackMeetupQuestView('quest_page');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    reload();
    loadFriendWay();
    loadMeetupStaffSummary()
      .then((summary: StaffSummary) => setStaff(summary))
      .catch(() => setStaff(null))
      .finally(() => setStaffChecked(true));
    loadMeetupStoriesOverview()
      .then((overview: StoriesOverview) => setStories(overview))
      .catch(() => setStories(null));
    return () => { requestIdRef.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, requestedCrewId]);

  // from the achievement's data (users_achievements.title), never hard-coded
  const achievementTitle: string =
    achievementsObj?.meetup?.title || data?.achievementTitle || '';
  const achievementName = achievementTitle || 'this achievement';
  const myBranch = data?.directory?.myBranch || '';
  // the browsing parts (examples, directory, story hall, how it works) are for
  // members without an active crew (a finished crew counts as none); a member
  // of an active crew sees just their crew
  const memberBrowse = view === 'member' && !data?.hasActiveCrew;
  const staffDeskShown = !!(
    (staff && (staff.canReviewPlans || staff.canCoordinate)) ||
    data?.reviewQueue ||
    stories?.reviewQueue
  );
  const staffWaiting =
    (data?.reviewQueue?.length || 0) + (stories?.reviewQueue?.length || 0);

  if (!userId) {
    return (
      <div
        className={css`
          padding: 2rem 1rem;
        `}
      >
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
          {view === 'staff' ? (
            <Link to="/achievements/bridge-builder" className={backLinkClass}>
              <Icon icon="arrow-left" /> Bridge Builder
            </Link>
          ) : (
            <Link to="/achievements" className={backLinkClass}>
              <Icon icon="arrow-left" /> Achievements
            </Link>
          )}

          {view === 'staff' ? (
            <h1 className={compactTitleClass}>Bridge Builder staff desk</h1>
          ) : data?.myCrew ? (
            <>
              <h1 className={compactTitleClass}>
                {achievementTitle
                  ? `${achievementTitle}: your crew`
                  : 'Your crew'}
              </h1>
              <div ref={myCrewRef} style={{ marginTop: '1rem' }}>
                <CrewPanel
                  crew={data.myCrew}
                  achievementTitle={achievementName}
                  myId={userId}
                  onChanged={reload}
                />
              </div>
            </>
          ) : (
            <>
              <section
                className={sectionClass}
                style={{ padding: 0, overflow: 'hidden' }}
              >
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
                    Meet your Twinkle friends in real life
                  </h1>
                  <p className={bodyTextClass}>
                    Hung out here online? Plan a real meetup together, with a
                    parent or a Twinkle teacher there. It takes a few simple
                    steps, and our staff check every plan first.
                  </p>
                  <div
                    className={css`
                      display: flex;
                      gap: 0.8rem;
                      flex-wrap: wrap;
                      margin-top: 1.4rem;
                    `}
                  >
                    <Button color="green" onClick={openCreateCrew}>
                      <Icon icon="plus" style={{ marginRight: '0.6rem' }} />
                      Start a crew with friends
                    </Button>
                    <Button
                      variant="soft"
                      color="logoBlue"
                      onClick={() => {
                        trackMeetupQuestView('directory_view');
                        directoryRef.current?.scrollIntoView({
                          behavior: 'smooth'
                        });
                      }}
                    >
                      <Icon icon="search" style={{ marginRight: '0.6rem' }} />
                      Find a crew to join
                    </Button>
                    <AskAgentButton
                      label="Not sure? Ask"
                      context={{
                        kind: 'page',
                        label: 'the Bridge Builder meetup quest',
                        path: '/achievements/bridge-builder',
                        excerpt:
                          'Twinkle friends plan a real-life meetup with a parent or teacher there: start or join a crew, send a plan, parents say yes and a grown-up is named, then meet, film it and finish.'
                      }}
                    />
                  </div>
                  <SafetyChips />
                </div>
              </section>
            </>
          )}

          {view === 'member' && staffDeskShown && (
            <Link
              to="/achievements/bridge-builder/staff"
              className={css`
                display: flex;
                align-items: center;
                gap: 0.8rem;
                margin-top: 1.2rem;
                padding: 1rem 1.4rem;
                border-radius: 1rem;
                border: 1px solid var(--ui-border);
                background: #fff;
                font-size: 1.4rem;
                font-weight: 700;
                color: ${Color.darkerGray()};
                text-decoration: none;
                @media (max-width: ${mobileMaxWidth}) {
                  margin: 1.2rem 1rem 0;
                }
              `}
            >
              <Icon icon="clipboard-check" style={{ color: Color.logoBlue() }} />
              Staff desk
              {staffWaiting > 0 && (
                <span style={{ color: Color.orange() }}>· {staffWaiting} waiting</span>
              )}
              <Icon icon="arrow-right" style={{ marginLeft: 'auto' }} />
            </Link>
          )}

          {view === 'member' && !!data?.myMeetups?.length && (
            <div
              className={css`
                margin: 1.2rem 0 0;
                font-size: 1.4rem;
                color: ${Color.darkerGray()};
                @media (max-width: ${mobileMaxWidth}) {
                  margin: 1.2rem 1rem 0;
                }
              `}
            >
              <b>
                <Icon icon="trophy" style={{ color: Color.gold() }} /> Your
                meetups: {data.myMeetups.length}
              </b>{' '}
              ·{' '}
              {data.myMeetups.map((meetup, index) => {
                const story = stories?.mine.find(
                  (item) => item.crewId === meetup.crewId
                );
                return (
                  <span key={meetup.crewId}>
                    {index > 0 ? ', ' : ''}
                    <Link to={crewPath(meetup.crewId)}>
                      {meetup.displayName}
                    </Link>
                    {story?.status === 'published' && (
                      <>
                        {' '}
                        (<Link to={storyPath(story.storyId)}>our story</Link>)
                      </>
                    )}
                  </span>
                );
              })}
            </div>
          )}

          {view === 'member' && data?.notices?.map((notice) => (
            <div
              key={`notice-${notice.crewId}`}
              style={{ marginTop: '1.6rem' }}
            >
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
                    {notice.kind === 'replaced'
                      ? `Your parent hadn't said yes to crew "${notice.crewName}" yet, so its founder invited someone else this time. You can join or start another crew any time.`
                      : notice.kind === 'removed'
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

          {view === 'member' && !!data?.invites?.length && (
            <section className={sectionClass}>
              <h2 className={headingClass}>
                <Icon icon="user-plus" style={{ color: Color.logoBlue() }} />{' '}
                You&apos;re invited
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


          {memberBrowse && !!stories?.samples?.length && (
            <ExampleStoriesRow samples={stories.samples} />
          )}

          {loadError && (
            <div style={{ marginTop: '2rem' }}>
              <QuestNote tone="warning">{loadError}</QuestNote>
            </div>
          )}
          {!data && !loadError && <Loading />}

          {memberBrowse && data && (
            <>
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
                      Crews show usernames, profile pictures and branches. Plans
                      and videos stay private to each crew.
                    </p>
                  </div>
                  {!data.hasActiveCrew && (
                    <Button color="green" onClick={openCreateCrew}>
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
              {stories && <StoryHallRow hall={stories.hall} />}
            </>
          )}

          {view === 'member' && data?.hasActiveCrew && (
            <div
              className={css`
                margin-top: 1.6rem;
                font-size: 1.35rem;
                @media (max-width: ${mobileMaxWidth}) {
                  margin: 1.6rem 1rem 0;
                }
              `}
            >
              <Link to="/bridge-builder/stories" style={{ fontWeight: 700 }}>
                See what other crews did →
              </Link>
            </div>
          )}

          {memberBrowse && (
          <>
          <details
            className={detailsClass}
            onToggle={(event) => {
              if ((event.currentTarget as HTMLDetailsElement).open) {
                trackMeetupQuestView('rules_open');
              }
            }}
          >
            <summary className={summaryClass}>What counts as a meetup?</summary>
            <p className={bodyTextClass} style={{ marginTop: '1rem' }}>
              Two or more Twinkle friends meet in real life, at a Twinkle
              classroom or a member&apos;s home, with a grown-up there. Do
              something really educational together and film it. Everyone who
              showed up unlocks <b>{achievementName}</b>. Every step waits for
              staff to approve it.
            </p>
          </details>

          <details
            className={detailsClass}
            onToggle={(event) => {
              if ((event.currentTarget as HTMLDetailsElement).open) {
                trackMeetupQuestView('way2_open');
              }
            }}
          >
            <summary className={summaryClass}>
              Another way to unlock {achievementName}: bring friends to Twinkle
            </summary>
            <div style={{ marginTop: '1rem' }}>
              <p className={bodyTextClass}>
                Bring friends who aren&apos;t on Twinkle yet: for each one, play{' '}
                <Link
                  to={DARK_CITADEL_PRIVATE_ROOM_PATH}
                  style={{ fontWeight: 'bold' }}
                >
                  The Dark Citadel
                </Link>{' '}
                together for 10 minutes in a private room while they&apos;re a
                guest, and they sign up (or, if you moderate our Minecraft
                server, vouch for new players who join Twinkle).
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
                    {friendWay.progressObj.label}:{' '}
                    {friendWay.progressObj.currentValue}/
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
            </div>
          </details>
          </>
          )}

          {view === 'staff' && data && staffChecked && !staffDeskShown && (
            <div style={{ marginTop: '1.6rem' }}>
              <QuestNote tone="info">
                This page is for Bridge Builder staff.{' '}
                <Link to="/achievements/bridge-builder">Back to Bridge Builder</Link>
              </QuestNote>
            </div>
          )}
          {view === 'staff' && staffDeskShown ? (
            <>
              {data?.allCrews && <AdminCrewBoard crews={data.allCrews} />}
              {data?.allCrews && (
                <div style={{ display: 'flex', gap: '1.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <Link to="/achievements/bridge-builder/org-asks" style={{ fontWeight: 700 }}>
                    Org asks: decisions only Twinkle can make →
                  </Link>
                  <Link to="/achievements/bridge-builder/emails" style={{ fontWeight: 700 }}>
                    Parent emails to review →
                  </Link>
                </div>
              )}
              {staff && (staff.canReviewPlans || staff.canCoordinate) && (
                <div style={{ marginTop: '1rem' }}>
                  <StaffNav summary={staff} />
                </div>
              )}
              {data?.reviewQueue && (
                <section className={sectionClass}>
                  <h2 className={headingClass}>
                    <Icon
                      icon="clipboard-check"
                      style={{ color: Color.logoBlue() }}
                    />{' '}
                    Admin: waiting for review
                  </h2>
                  {data.reviewQueue.length === 0 ? (
                    <p className={bodyTextClass}>
                      Nothing is waiting right now.
                    </p>
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
                            {
                              {
                                crew: 'Crew',
                                plan: 'Plan',
                                grownUp: 'Parents & adult',
                                video: 'Video',
                                memberInfo: "A member's answer"
                              }[
                                item.waitingFor as
                                  | 'crew'
                                  | 'plan'
                                  | 'grownUp'
                                  | 'video'
                                  | 'memberInfo'
                              ] || 'Plan'
                            }{' '}
                            ·{' '}
                            {item.members
                              .map(
                                (member) =>
                                  `${member.username} (${member.branch})`
                              )
                              .join(', ')}
                          </span>
                          <Button
                            size="sm"
                            variant="soft"
                            color="logoBlue"
                            onClick={() =>
                              setSearchParams({ crew: String(item.crewId) })
                            }
                          >
                            Review
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {stories?.reviewQueue && (
                <AdminStoryQueue queue={stories.reviewQueue} />
              )}
            </>
          ) : null}
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
      setLoadError(
        error?.message || 'Could not load the quest. Please refresh.'
      );
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

  function openCreateCrew() {
    trackMeetupQuestView('create_open');
    setCreateShown(true);
  }

  function handleDirectoryJoin(crew: DirectoryCrew) {
    trackMeetupQuestView('join_open');
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

const compactTitleClass = css`
  font-size: 2.2rem;
  font-weight: bold;
  color: ${Color.black()};
  margin: 1.4rem 0 0;
`;

const detailsClass = css`
  margin-top: 1.6rem;
  padding: 1.2rem 1.6rem;
  border: 1px solid var(--ui-border);
  border-radius: 1.2rem;
  background: #fff;
  @media (max-width: ${mobileMaxWidth}) {
    margin-left: 1rem;
    margin-right: 1rem;
  }
`;

const summaryClass = css`
  cursor: pointer;
  font-size: 1.5rem;
  font-weight: bold;
  color: ${Color.darkerGray()};
`;

// Only claims the product really enforces: a named grown-up is required
// (step 3), contact details are rejected by the API, the plan is admin-gated,
// and the video is private (signed, short-lived links).
const SAFETY_POINTS = [
  { icon: 'user-shield', text: 'A grown-up always comes' },
  { icon: 'map-marker-alt', text: 'No home addresses online' },
  { icon: 'clipboard-check', text: 'Staff check every plan' },
  { icon: 'lock', text: 'Videos stay private to your crew' }
];

function SafetyChips() {
  return (
    <ul
      className={css`
        list-style: none;
        margin: 1.4rem 0 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      `}
    >
      {SAFETY_POINTS.map((point) => (
        <li
          key={point.text}
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.5rem 1.1rem;
            border-radius: 2rem;
            font-size: 1.25rem;
            font-weight: bold;
            color: ${Color.darkerGray()};
            background: ${Color.green(0.1)};
            border: 1px solid ${Color.green(0.35)};
          `}
        >
          <Icon icon={point.icon as any} style={{ color: Color.green() }} />
          {point.text}
        </li>
      ))}
    </ul>
  );
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
        border: 1px solid ${Color.logoBlue(0.35)};
        background: ${Color.logoBlue(0.04)};
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
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        <span style={{ fontSize: '1.5rem', color: Color.black() }}>
          <b>{invite.inviterUsername}</b> invited you to crew{' '}
          <b>&quot;{invite.displayName}&quot;</b>
        </span>
        <BranchChips names={invite.branchNames} />
        {blocked && (
          <span style={{ fontSize: '1.2rem', color: Color.darkGray() }}>
            {blocked}
          </span>
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
