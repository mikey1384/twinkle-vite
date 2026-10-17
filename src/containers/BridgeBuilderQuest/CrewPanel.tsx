import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import UsernameText from '~/components/Texts/UsernameText';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import BranchField from './BranchField';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import { BranchStatusBadge } from './BranchStatus';
import { AdminInfoChecks, InfoCheckBadge, MyInfoCheckCard } from './MemberInfoCheck';
import CrewCover from './CrewCover';
import { MemberAvatars } from './DirectoryCard';
import ManageCrewPanel from './ManageCrewPanel';
import StepCard, { QuestNote } from './StepCard';
import StepTracker from './StepTracker';
import StoryEntryCard from './Story/StoryEntryCard';
import CheckinButton from './Checkin/CheckinButton';
import useQuestAction from './useQuestAction';
import type { CrewView, QuestStepKey } from './types';

// A crew's page (members, admins): the crew stage (members, branches, the
// tier) and the meet-up stage (check in together). The crew stays active
// after it meets: it can meet again.
export default function CrewPanel({
  crew,
  achievementTitle,
  myId,
  onChanged
}: {
  crew: CrewView;
  achievementTitle: string;
  myId: number;
  onChanged: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const { hash } = useLocation();
  // an owner alert link ends in #review (a member's answer to read): land on
  // the member list
  useEffect(() => {
    if (hash !== '#review') return;
    const timer = setTimeout(
      () => document.querySelector('[data-admin-review]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      300
    );
    return () => clearTimeout(timer);
  }, [hash, crew.crewId]);
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const leaveMeetupCrew = useAppContext((v) => v.requestHelpers.leaveMeetupCrew);
  const disbandMeetupCrew = useAppContext(
    (v) => v.requestHelpers.disbandMeetupCrew
  );
  const updateMyMeetupMembership = useAppContext(
    (v) => v.requestHelpers.updateMyMeetupMembership
  );
  const me = crew.members.find((member) => member.userId === myId);
  const { viewer, progress } = crew;
  const met = !!crew.completedAt;
  const stepOf = (key: QuestStepKey) => {
    const step = progress.steps.find((s) => s.key === key)!;
    return step.state === 'current' && /^Waiting/.test(progress.blocking)
      ? { ...step, waiting: true }
      : step;
  };

  const nudgeMeetupBranch = useAppContext((v) => v.requestHelpers.nudgeMeetupBranch);
  const crewAction = useQuestAction(onChanged);

  const [branch, setBranch] = useState(me?.branch || '');
  const [manageShown, setManageShown] = useState(false);
  const [confirmExit, setConfirmExit] = useState<'leave' | 'disband' | null>(null);
  const [exitError, setExitError] = useState('');
  const founder = crew.members.find((member) => member.isFounder);
  // the server hands leadership to the longest-standing other member
  const nextFounder = crew.members.find((member) => member.userId !== myId);

  useEffect(() => {
    setBranch(me?.branch || '');
  }, [me?.branch]);

  // the member's own branch editor; it moves to the top of step 1 as a prompt
  // until they have a verified branch or explicitly choose non-student
  const mustVerifyBranch = !!me && !me.branchVerified && me.branchStatus !== 'not_student';
  const branchEditor =
    viewer.isMember && !viewer.frozen ? (
      <div>
        <BranchField
          id="meetup-my-branch"
          value={branch}
          onChange={setBranch}
          placeholder="Your branch's name"
        />
        <Button
          loading={crewAction.pendingAction === 'branch'}
          variant="soft"
          color="logoBlue"
          style={{ marginTop: '0.8rem' }}
          disabled={crewAction.busy || !branch.trim() || branch.trim() === me?.branch}
          onClick={() => {
            if (mustVerifyBranch) trackMeetupQuestView('branch_verify_pick');
            crewAction.run(() =>
              updateMyMeetupMembership({ crewId: crew.crewId, branch }), 'branch'
            );
          }}
        >
          Save branch
        </Button>
      </div>
    ) : null;
  return (
    <div
      className={css`
        border-radius: 1.4rem;
        border: 1px solid var(--ui-border);
        background: #fff;
        padding: 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1.4rem 1rem;
          border-radius: 0;
          border-left: 0;
          border-right: 0;
        }
      `}
    >
      <CrewCover
        cover={crew.cover}
        height="8rem"
        stage={crew.stage}
        achievementTitle={achievementTitle}
        rounded="1rem"
      />
      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
          margin: 1.2rem 0 0.4rem;
        `}
      >
        <div style={{ minWidth: 0 }}>
          <h2
            className={css`
              font-size: 2.1rem;
              font-weight: bold;
              color: ${Color.black()};
              margin: 0;
              overflow-wrap: anywhere;
            `}
          >
            {crew.displayName}
            {viewer.isMember && (
              <span
                className={css`
                  font-size: 1.3rem;
                  font-weight: normal;
                  color: ${Color.darkGray()};
                  margin-left: 0.8rem;
                `}
              >
                your crew
              </span>
            )}
          </h2>
          <div
            className={css`
              font-size: 1.3rem;
              color: ${Color.darkerGray()};
              margin-top: 0.3rem;
            `}
          >
            <Icon icon="crown" style={{ color: Color.gold() }} /> Founder:{' '}
            <b>{founder?.username || '?'}</b>
            {viewer.isFounder ? ' (you)' : ''}
            {!crew.isOpen && crew.status === 'active' && (
              <span style={{ marginLeft: '0.8rem' }}>
                <Icon icon="lock" /> invite only
              </span>
            )}
          </div>
        </div>
        {viewer.isMember && crew.status === 'active' && (
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* help with whatever step the crew is on; the server-owned "next
                up" line tells the agent where they are */}
            <AskAgentButton
              label="Ask about our crew"
              context={{
                kind: 'page',
                label: `my Bridge Builder crew "${crew.displayName}"`,
                path: `/achievements/bridge-builder/crew/${crew.crewId}`,
                excerpt: progress.blocking || 'The crew has met up.'
              }}
            />
            {crew.chat && (
              <Button
                size="sm"
                color="logoBlue"
                onClick={() => {
                  trackMeetupQuestView('crew_chat_open');
                  navigate(`/chat/${crew.chat?.pathId}`);
                }}
              >
                <Icon icon="comments" style={{ marginRight: '0.5rem' }} />
                Open crew chat
              </Button>
            )}
            {viewer.isFounder && (
              <Button
                size="sm"
                variant={manageShown ? 'solid' : 'soft'}
                color="logoBlue"
                aria-expanded={manageShown}
                onClick={() => setManageShown((shown) => !shown)}
              >
                <Icon icon="gear" style={{ marginRight: '0.5rem' }} />
                Manage crew
              </Button>
            )}
            {!viewer.frozen &&
              (viewer.isFounder && crew.members.length === 1 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  color="red"
                  onClick={() => setConfirmExit('disband')}
                >
                  <Icon icon="trash-alt" style={{ marginRight: '0.5rem' }} />
                  Disband crew
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  color="darkGray"
                  onClick={() => setConfirmExit('leave')}
                >
                  <Icon icon="sign-out-alt" style={{ marginRight: '0.5rem' }} />
                  Leave crew
                </Button>
              ))}
          </div>
        )}
      </div>
      {crew.about && (
        <p
          className={css`
            margin: 0.6rem 0 0;
            font-size: 1.4rem;
            color: ${Color.darkerGray()};
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          `}
        >
          {crew.about}
        </p>
      )}
      {manageShown && viewer.isFounder && crew.status === 'active' && (
        <ManageCrewPanel
          crew={crew}
          myId={myId}
          onChanged={onChanged}
          onDisbanded={onChanged}
        />
      )}
      {exitError && (
        <div style={{ marginTop: '1rem' }}>
          <QuestNote tone="warning">{exitError}</QuestNote>
        </div>
      )}
      {confirmExit && (
        <ConfirmModal
          title={
            confirmExit === 'disband'
              ? `Disband ${crew.displayName}?`
              : `Leave ${crew.displayName}?`
          }
          descriptionFontSize="1.5rem"
          description={
            confirmExit === 'disband'
              ? "You're the only member, so this closes the crew. You can start or join another one afterwards."
              : viewer.isFounder && nextFounder
              ? `${nextFounder.username} becomes the founder when you leave. You can join another crew afterwards.`
              : 'You can join another crew afterwards. The founder can invite you back.'
          }
          confirmButtonColor="red"
          confirmButtonLabel={confirmExit === 'disband' ? 'Disband' : 'Leave'}
          onHide={() => setConfirmExit(null)}
          onConfirm={handleExit}
        />
      )}
      <div style={{ height: '1.6rem' }} />

      <StepTracker progress={progress} completed={met} />

      {met && (
        <div style={{ marginTop: '1.6rem' }}>
          <QuestNote tone="success">
            Your crew met up
            {crew.tier ? (
              <>
                {' '}
                at <b>{crew.tier.charAt(0).toUpperCase() + crew.tier.slice(1)}</b> tier
              </>
            ) : null}
            ! Checked in:{' '}
            {crew.members
              .filter((member) => member.attended)
              .map((member) => member.username)
              .join(', ')}
            . You can meet again any time.
          </QuestNote>
        </div>
      )}
      {(viewer.isMember || viewer.isAdmin) && met && crew.status === 'active' && (
        <StoryEntryCard crewId={crew.crewId} />
      )}
      {crew.status === 'disbanded' && (
        <div style={{ marginTop: '1.6rem' }}>
          <QuestNote tone="info">This crew was closed.</QuestNote>
        </div>
      )}

      <StepCard step={stepOf('crew')}>
        {!met && crew.progress.tierHint && (
          <QuestNote tone="info">{crew.progress.tierHint}</QuestNote>
        )}
        {mustVerifyBranch && branchEditor && (
          <div
            className={css`
              padding: 1.2rem 1.4rem;
              border-radius: 1rem;
              border: 2px solid ${Color.orange()};
              background: #fff;
            `}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
              Which Twinkle branch do you go to?
            </div>
            <p style={{ fontSize: '1.3rem', color: Color.darkerGray(), margin: '0 0 1rem' }}>
              {me?.branchStatus === 'pending'
                ? `The administrator is checking "${me.branch}". You can choose your Twinkle branch or "Not a Twinkle student" below.`
                : me?.branchStatus === 'rejected'
                ? `"${me.branch}" is not a Twinkle branch. Choose your branch or "Not a Twinkle student" below.`
                : 'Choose your Twinkle branch or "Not a Twinkle student". Your crew needs at least two Twinkle students, and branches decide its tier.'}
            </p>
            {branchEditor}
          </div>
        )}
        {me && viewer.infoCheck && <MyInfoCheckCard crew={crew} onChanged={onChanged} />}
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
          {crew.members.map((member) => (
            <li
              key={member.userId}
              className={css`
                display: flex;
                align-items: center;
                gap: 0.8rem;
                flex-wrap: wrap;
                font-size: 1.4rem;
                padding: 0.6rem 0.8rem;
                border-radius: 0.8rem;
                background: ${member.userId === myId
                  ? Color.logoBlue(0.06)
                  : Color.extraLightGray(0.5)};
              `}
            >
              <MemberAvatars members={[member]} size="2.6rem" />
              <UsernameText
                user={{ id: member.userId, username: member.username }}
              />
              <span
                className={css`
                  padding: 0.1rem 0.8rem;
                  border-radius: 1rem;
                  background: ${Color.logoBlue(0.12)};
                  color: ${Color.darkBlue()};
                  font-weight: bold;
                  font-size: 1.2rem;
                `}
              >
                {member.branch || 'no branch yet'}
              </span>
              <BranchStatusBadge member={member} />
              <InfoCheckBadge member={member} />
              {member.isFounder && (
                <span style={{ fontSize: '1.2rem', color: Color.darkGray() }}>
                  <Icon icon="crown" style={{ color: Color.gold() }} /> founder
                </span>
              )}
              {member.userId === myId && (
                <span style={{ fontSize: '1.2rem', color: Color.darkGray() }}>(you)</span>
              )}
              {(viewer.isFounder || viewer.isAdmin) &&
                member.userId !== myId &&
                !member.branchVerified && member.branchStatus !== 'not_student' && (
                  <Button
                    loading={crewAction.pendingAction === 'nudge:' + member.userId}
                    size="sm"
                    color="orange"
                    disabled={crewAction.busy}
                    style={{ marginLeft: 'auto' }}
                    onClick={() =>
                      crewAction.run(() =>
                        nudgeMeetupBranch({ crewId: crew.crewId, userId: member.userId }), 'nudge:' + member.userId
                      )
                    }
                  >
                    Nudge to fix branch
                  </Button>
                )}
            </li>
          ))}
        </ul>
        {!mustVerifyBranch && branchEditor}
        <div data-admin-review>
          <AdminInfoChecks crew={crew} onChanged={onChanged} />
        </div>
        {crewAction.error && (
          <QuestNote tone="warning">{crewAction.error}</QuestNote>
        )}
      </StepCard>

      <StepCard step={stepOf('meet')}>
        {stepOf('meet').state !== 'locked' && (
          <>
            <p
              className={css`
                margin: 0;
                font-size: 1.4rem;
                line-height: 1.5;
                color: ${Color.darkerGray()};
              `}
            >
              With a Twinkle teacher or a parent there, everyone who scans their
              code unlocks {achievementTitle} in one go.
            </p>
            {viewer.isMember && crew.status === 'active' && (
              <div>
                <CheckinButton label="Check in with my crew" onChanged={onChanged} />
              </div>
            )}
            {crew.members.some((member) => member.attended) && (
              <div className={css`font-size: 1.3rem; color: ${Color.darkGray()};`}>
                <Icon icon="check" style={{ color: Color.green() }} /> Checked in with the crew:{' '}
                {crew.members
                  .filter((member) => member.attended)
                  .map((member) => member.username)
                  .join(', ')}
              </div>
            )}
          </>
        )}
      </StepCard>
    </div>
  );

  async function handleExit() {
    const action = confirmExit;
    setConfirmExit(null);
    setExitError('');
    try {
      if (action === 'disband') {
        await disbandMeetupCrew(crew.crewId);
      } else {
        await leaveMeetupCrew(crew.crewId);
      }
      await onChanged();
    } catch (error: any) {
      setExitError(error?.message || 'Something went wrong. Please try again.');
    }
  }
}
