import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import UsernameText from '~/components/Texts/UsernameText';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import CrewCover from './CrewCover';
import CrewPanel from './CrewPanel';
import { BranchChips, MemberAvatars } from './DirectoryCard';
import JoinCrewModal from './JoinCrewModal';
import StepTracker from './StepTracker';
import { QuestNote } from './StepCard';
import { backLinkClass, pageWidthClass, sectionClass } from './pageStyles';
import type { CrewView, PublicCrewPage } from './types';

// /achievements/bridge-builder/crew/:crewId — any signed-in member sees the
// crew's public profile. Members and admins also get the full crew card
// (grown-up, plan, video) below it.
export default function CrewDetailPage() {
  const { crewId: crewIdParam } = useParams();
  const crewId = Number(crewIdParam) || 0;
  const userId = useKeyContext((v) => v.myState.userId);
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const loadMeetupPublicCrew = useAppContext((v) => v.requestHelpers.loadMeetupPublicCrew);
  const loadMeetupCrew = useAppContext((v) => v.requestHelpers.loadMeetupCrew);
  const [page, setPage] = useState<PublicCrewPage | null>(null);
  const [privateCrew, setPrivateCrew] = useState<CrewView | null>(null);
  const [error, setError] = useState('');
  const [joinShown, setJoinShown] = useState(false);
  const requestIdRef = useRef(0);
  const achievementTitle: string = achievementsObj?.meetup?.title || '';

  useEffect(() => {
    if (!userId || !crewId) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, crewId]);

  if (!userId) {
    return (
      <div className={css`padding: 2rem 1rem;`}>
        <HomeLoginPrompt />
      </div>
    );
  }

  const crew = page?.crew;
  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest/CrewDetailPage">
      <div
        className={css`
          width: 100%;
          display: flex;
          justify-content: center;
          padding-bottom: 20rem;
        `}
      >
        <main className={pageWidthClass} style={{ maxWidth: '900px' }}>
          <Link to="/achievements/bridge-builder" className={backLinkClass}>
            <Icon icon="arrow-left" /> All crews
          </Link>
          {error && (
            <div style={{ marginTop: '2rem' }}>
              <QuestNote tone="warning">{error}</QuestNote>
            </div>
          )}
          {!page && !error && <Loading />}
          {crew && (
            <section className={sectionClass} style={{ padding: 0, overflow: 'hidden' }}>
              <CrewCover
                cover={crew.cover}
                height="12rem"
                stage={crew.stage}
                achievementTitle={achievementTitle}
                rounded="0"
              />
              <div
                className={css`
                  padding: 1.8rem 2rem 2rem;
                  display: flex;
                  flex-direction: column;
                  gap: 1.4rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    padding: 1.4rem 1rem;
                  }
                `}
              >
                <div
                  className={css`
                    display: flex;
                    justify-content: space-between;
                    gap: 1rem;
                    flex-wrap: wrap;
                    align-items: flex-start;
                  `}
                >
                  <div style={{ minWidth: 0 }}>
                    <h1
                      className={css`
                        margin: 0;
                        font-size: 2.6rem;
                        font-weight: bold;
                        color: ${Color.black()};
                        overflow-wrap: anywhere;
                      `}
                    >
                      {crew.displayName}
                    </h1>
                    <div style={{ fontSize: '1.3rem', color: Color.darkerGray(), marginTop: '0.3rem' }}>
                      <Icon icon="crown" style={{ color: Color.gold() }} /> Founded by{' '}
                      <b>{crew.founderUsername}</b> · {crew.students} student
                      {crew.students === 1 ? '' : 's'} · {crew.branches} branch
                      {crew.branches === 1 ? '' : 'es'}
                      {!crew.isOpen && crew.status === 'active' && (
                        <span style={{ marginLeft: '0.6rem' }}>
                          · <Icon icon="lock" /> invite only
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {crew.isMine ? (
                      <QuestNote tone="success">You&apos;re in this crew.</QuestNote>
                    ) : crew.inviteId || crew.joinable ? (
                      <Button color="logoBlue" onClick={() => setJoinShown(true)}>
                        <Icon icon="user-plus" style={{ marginRight: '0.5rem' }} />
                        {crew.inviteId ? 'Accept invite and join' : 'Join this crew'}
                      </Button>
                    ) : crew.joinClosedReason ? (
                      <span style={{ fontSize: '1.3rem', color: Color.darkGray() }}>
                        {crew.joinClosedReason}
                      </span>
                    ) : null}
                  </div>
                </div>
                {crew.about && (
                  <p
                    className={css`
                      margin: 0;
                      font-size: 1.5rem;
                      line-height: 1.6;
                      color: ${Color.darkerGray()};
                      white-space: pre-wrap;
                      overflow-wrap: anywhere;
                    `}
                  >
                    {crew.about}
                  </p>
                )}
                <BranchChips names={crew.branchNames} />
                <StepTracker progress={{ steps: crew.steps, blocking: '' }} completed />
                <div>
                  <h2
                    className={css`
                      margin: 0 0 0.8rem;
                      font-size: 1.7rem;
                      font-weight: bold;
                      color: ${Color.black()};
                    `}
                  >
                    Members
                  </h2>
                  <ul
                    className={css`
                      list-style: none;
                      margin: 0;
                      padding: 0;
                      display: grid;
                      grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
                      gap: 0.6rem;
                    `}
                  >
                    {crew.members.map((member) => (
                      <li
                        key={member.userId}
                        className={css`
                          display: flex;
                          align-items: center;
                          gap: 0.8rem;
                          padding: 0.6rem 0.8rem;
                          border-radius: 0.8rem;
                          border: 1px solid var(--ui-border);
                          font-size: 1.4rem;
                        `}
                      >
                        <MemberAvatars members={[member]} size="3.2rem" />
                        <span style={{ minWidth: 0 }}>
                          <UsernameText user={{ id: member.userId, username: member.username }} />
                          <span style={{ display: 'block', fontSize: '1.2rem', color: Color.darkGray() }}>
                            {member.branch}
                            {member.isFounder ? ' · founder' : ''}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {!page.canSeePrivate && (
                  <p style={{ margin: 0, fontSize: '1.2rem', color: Color.darkGray() }}>
                    <Icon icon="lock" /> The grown-up, the plan and the video are
                    private to the crew and Twinkle staff.
                  </p>
                )}
              </div>
            </section>
          )}
          {privateCrew && (
            <div style={{ marginTop: '2rem' }}>
              <CrewPanel
                crew={privateCrew}
                achievementTitle={achievementTitle || 'this achievement'}
                myId={userId}
                onChanged={reload}
              />
            </div>
          )}
        </main>
      </div>
      {joinShown && crew && (
        <JoinCrewModal
          crewId={crew.crewId}
          crewName={crew.displayName}
          inviteId={crew.inviteId}
          defaultBranch={page?.myBranch || ''}
          onHide={() => setJoinShown(false)}
          onJoined={reload}
        />
      )}
    </ErrorBoundary>
  );

  async function reload() {
    const requestId = ++requestIdRef.current;
    try {
      const next: PublicCrewPage = await loadMeetupPublicCrew(crewId);
      if (requestId !== requestIdRef.current) return;
      setPage(next);
      setError('');
      if (next.canSeePrivate) {
        const { crew: full } = await loadMeetupCrew(crewId);
        if (requestId === requestIdRef.current) setPrivateCrew(full);
      } else {
        setPrivateCrew(null);
      }
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setError(err?.message || 'Could not load this crew.');
    }
  }
}
