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
import CrewBoard from './CrewBoard';
import CrewPanel from './CrewPanel';
import { QuestNote, questHelpClass, questInputClass, questLabelClass } from './StepCard';
import type { MeetupQuestData } from './types';

const DARK_CITADEL_PRIVATE_ROOM_PATH = '/app/2610/vigil/megacitadel/private';

const sectionClass = css`
  border-radius: 1.4rem;
  border: 1px solid var(--ui-border);
  background: #fff;
  padding: 2rem;
  margin-top: 2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.4rem 1rem;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;

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

// Bridge Builder's step-by-step meetup quest (achievement type 'meetup').
// The achievement's name comes from its data, so a rename is one DB change.
export default function BridgeBuilderQuest() {
  const userId = useKeyContext((v) => v.myState.userId);
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const loadMeetupQuest = useAppContext((v) => v.requestHelpers.loadMeetupQuest);
  const loadMyAchievements = useAppContext(
    (v) => v.requestHelpers.loadMyAchievements
  );
  const startMeetupCrew = useAppContext((v) => v.requestHelpers.startMeetupCrew);
  const joinMeetupCrew = useAppContext((v) => v.requestHelpers.joinMeetupCrew);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCrewId = Number(searchParams.get('crew')) || 0;
  const [data, setData] = useState<MeetupQuestData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [friendWay, setFriendWay] = useState<{
    isUnlocked: boolean;
    progressObj?: { label: string; currentValue: number; targetValue: number };
  } | null>(null);
  const [branch, setBranch] = useState('');
  const [startBusy, setStartBusy] = useState(false);
  const [joiningCrewId, setJoiningCrewId] = useState(0);
  const [entryError, setEntryError] = useState('');
  const branchInputRef = useRef<HTMLInputElement>(null);
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
        <main
          className={css`
            width: 65%;
            margin-top: 1rem;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
              margin-top: 0;
            }
          `}
        >
          <Link
            to="/achievements"
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 1.4rem;
              font-weight: bold;
              color: ${Color.logoBlue()};
              @media (max-width: ${mobileMaxWidth}) {
                margin: 1rem 1rem 0;
              }
            `}
          >
            <Icon icon="arrow-left" /> Achievements
          </Link>

          <section className={sectionClass}>
            <h1
              className={css`
                font-size: 2.4rem;
                font-weight: bold;
                color: ${Color.black()};
                margin: 0 0 1rem;
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
            <p className={bodyTextClass} style={{ marginTop: '0.8rem' }}>
              The quest goes one step at a time: build your crew, get your
              parents on board, send your plan, meet and film, then an admin
              reviews it. Nothing after the plan unlocks until an admin
              approves it.
            </p>
            <div style={{ marginTop: '1.2rem' }}>
              <QuestNote tone="info">
                <b>Stay safe:</b> never post an address, a phone number or an
                exact meeting spot here. Use Twinkle chat to talk with your
                crew, and let the adult who is coming handle the exact place.
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
          </section>

          {loadError && (
            <div style={{ marginTop: '2rem' }}>
              <QuestNote tone="warning">{loadError}</QuestNote>
            </div>
          )}
          {!data && !loadError && <Loading />}

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
              <h2
                className={css`
                  font-size: 1.6rem;
                  font-weight: bold;
                  color: ${Color.darkGray()};
                  margin: 3rem 0 0;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  @media (max-width: ${mobileMaxWidth}) {
                    margin: 2.4rem 1rem 0;
                  }
                `}
              >
                Way 1: the meetup quest
              </h2>
              {data.myCrew && (
                <div style={{ marginTop: '1rem' }}>
                  <CrewPanel
                    crew={data.myCrew}
                    achievementTitle={achievementName}
                    myId={userId}
                    onChanged={reload}
                  />
                </div>
              )}
              {!data.hasActiveCrew && (
                <section className={sectionClass}>
                  <h2 className={headingClass}>
                    {data.myCrew ? 'Start or join another crew' : 'Start your crew'}
                  </h2>
                  <p className={bodyTextClass}>
                    Start a crew and invite friends from other branches, or join
                    one below. You can be in one crew at a time.
                  </p>
                  <div style={{ marginTop: '1.2rem' }}>
                    <label className={questLabelClass} htmlFor="meetup-entry-branch">
                      Your Twinkle branch
                    </label>
                    <div
                      className={css`
                        display: flex;
                        gap: 0.6rem;
                        flex-wrap: wrap;
                      `}
                    >
                      <input
                        id="meetup-entry-branch"
                        ref={branchInputRef}
                        className={questInputClass}
                        style={{ flex: '1 1 18rem', width: 'auto' }}
                        value={branch}
                        maxLength={40}
                        placeholder="For example: Daechi"
                        onChange={(event) => setBranch(event.target.value)}
                      />
                      <Button
                        color="green"
                        loading={startBusy}
                        disabled={startBusy || !!joiningCrewId}
                        onClick={handleStart}
                      >
                        <Icon icon="users" style={{ marginRight: '0.5rem' }} />
                        Start a crew
                      </Button>
                    </div>
                    <div className={questHelpClass}>
                      Just the branch name. Other members see your username and
                      branch, nothing else.
                    </div>
                  </div>
                  {entryError && (
                    <div style={{ marginTop: '1rem' }}>
                      <QuestNote tone="warning">{entryError}</QuestNote>
                    </div>
                  )}
                </section>
              )}
              <section className={sectionClass}>
                <h2 className={headingClass}>Looking for a crew</h2>
                <CrewBoard
                  crews={data.board}
                  canJoin={!data.hasActiveCrew}
                  joiningCrewId={joiningCrewId}
                  onJoin={handleJoin}
                />
                {!data.hasActiveCrew && data.board.length > 0 && (
                  <div className={questHelpClass} style={{ marginTop: '1rem' }}>
                    Type your branch above before joining.
                  </div>
                )}
              </section>
            </>
          )}

          <h2
            className={css`
              font-size: 1.6rem;
              font-weight: bold;
              color: ${Color.darkGray()};
              margin: 3rem 0 0;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              @media (max-width: ${mobileMaxWidth}) {
                margin: 2.4rem 1rem 0;
              }
            `}
          >
            Way 2: bring a friend
          </h2>
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

  function requireBranch() {
    if (branch.trim()) return true;
    setEntryError('Type your Twinkle branch first.');
    branchInputRef.current?.focus();
    return false;
  }

  async function handleStart() {
    if (startBusy || !requireBranch()) return;
    setStartBusy(true);
    setEntryError('');
    try {
      await startMeetupCrew(branch);
      setBranch('');
      await reload();
    } catch (error: any) {
      setEntryError(error?.message || 'Could not start the crew.');
    } finally {
      setStartBusy(false);
    }
  }

  async function handleJoin(crewId: number) {
    if (joiningCrewId || !requireBranch()) {
      branchInputRef.current?.scrollIntoView({ block: 'center' });
      return;
    }
    setJoiningCrewId(crewId);
    setEntryError('');
    try {
      await joinMeetupCrew({ crewId, branch });
      setBranch('');
      await reload();
    } catch (error: any) {
      setEntryError(error?.message || 'Could not join the crew.');
      branchInputRef.current?.scrollIntoView({ block: 'center' });
    } finally {
      setJoiningCrewId(0);
    }
  }
}
