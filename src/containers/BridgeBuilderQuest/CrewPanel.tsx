import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import UsernameText from '~/components/Texts/UsernameText';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import AdminReview from './AdminReview';
import CrewReviewFeedback from './CrewReviewFeedback';
import BranchField from './BranchField';
import DateCalendar from '~/components/DateCalendar';
import AskParentPanel from './Parent/AskParentPanel';
import ParentContactsAdmin from './Parent/ParentContactsAdmin';
import PlanVenue, { areaForVenue, venueFromArea, type VenueMode } from './Parent/PlanVenue';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import { BranchStatusBadge } from './BranchStatus';
import { AdminInfoChecks, InfoCheckBadge, MyInfoCheckCard } from './MemberInfoCheck';
import CrewCover from './CrewCover';
import { MemberAvatars } from './DirectoryCard';
import ManageCrewPanel from './ManageCrewPanel';
import ReplaceMemberModal from './ReplaceMemberModal';
import StepCard, {
  QuestNote,
  questHelpClass,
  questInputClass,
  questLabelClass
} from './StepCard';
import StepTracker from './StepTracker';
import TeacherPicker, { type MeetupTeacher } from './TeacherPicker';
import VideoUploader from './VideoUploader';
import StoryEntryCard from './Story/StoryEntryCard';
import { ExamplesHint } from './Story/QuestStories';
import useQuestAction from './useQuestAction';
import type { CrewView, QuestStepKey } from './types';
import { formatSlot } from './staff/shared';

function localToday() {
  return localDateInDays(0);
}

function localDateInDays(days: number) {
  const now = new Date(Date.now() + days * 86_400_000);
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

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
  // alert links end in #grown-up (a parent's question) or #review (a plan or
  // video waiting for staff): land on that part of the page
  useEffect(() => {
    if (hash !== '#grown-up' && hash !== '#review') return;
    const timer = setTimeout(
      () =>
        (hash === '#grown-up'
          ? document.getElementById('grown-up-step')
          : document.querySelector('[data-admin-review]')
        )?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
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
  const setMeetupCrewAdult = useAppContext(
    (v) => v.requestHelpers.setMeetupCrewAdult
  );
  const submitMeetupPlan = useAppContext(
    (v) => v.requestHelpers.submitMeetupPlan
  );
  const me = crew.members.find((member) => member.userId === myId);
  const { viewer, progress } = crew;
  const completed = crew.status === 'completed';
  const stepOf = (key: QuestStepKey) => {
    const step = progress.steps.find((s) => s.key === key)!;
    return step.state === 'current' && /^Waiting/.test(progress.blocking)
      ? { ...step, waiting: true }
      : step;
  };

  const nudgeMeetupBranch = useAppContext((v) => v.requestHelpers.nudgeMeetupBranch);
  const reviseMeetupPlan = useAppContext((v) => v.requestHelpers.reviseMeetupPlan);
  const crewAction = useQuestAction(onChanged);
  const reviewAction = useQuestAction(onChanged);
  const requestMeetupReview = useAppContext((v) => v.requestHelpers.requestMeetupReview);
  const feedbackStep = progress.currentStep === 'crew' || progress.currentStep === 'grownUp'
    ? progress.currentStep : null;
  const feedback = feedbackStep ? crew.reviews?.[feedbackStep] : null;
  const grownUpAction = useQuestAction(onChanged);
  const planAction = useQuestAction(onChanged);

  const [branch, setBranch] = useState(me?.branch || '');
  const [adultKind, setAdultKind] = useState(crew.adult.kind || 'parent');
  // a parent's name is typed; a Twinkle teacher is picked from the list
  const [adultName, setAdultName] = useState(
    crew.adult.kind === 'teacher' ? '' : crew.adult.name || ''
  );
  const [pickedTeacher, setPickedTeacher] = useState<MeetupTeacher | null>(
    crew.adult.teacher || null
  );
  // the approved plan decides which grown-ups fit (a home: a parent only)
  const approvedPlanIsHome = venueFromArea(crew.plan.area || '').mode === 'home';
  const [planDate, setPlanDate] = useState(crew.plan.date || '');
  const [planTime, setPlanTime] = useState(crew.plan.time || '');
  const initialVenue = venueFromArea(crew.plan.area || '');
  const [planArea, setPlanArea] = useState(initialVenue.rest);
  const [venueMode, setVenueMode] = useState<VenueMode>(initialVenue.mode);
  // default to the member's own branch when it is a real one
  const [venueBranch, setVenueBranch] = useState(
    initialVenue.branch || (me?.branchVerified ? me.branch : '')
  );
  const [planActivity, setPlanActivity] = useState(crew.plan.activity || '');
  const [manageShown, setManageShown] = useState(false);
  const [confirmExit, setConfirmExit] = useState<'leave' | 'disband' | null>(null);
  const [confirmRevise, setConfirmRevise] = useState(false);
  const [replacing, setReplacing] = useState<CrewView['members'][number] | null>(null);
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
    viewer.isMember && !viewer.detailsLocked ? (
      <div>
        <BranchField
          id="meetup-my-branch"
          value={branch}
          onChange={setBranch}
          placeholder="Your branch's name"
        />
        <Button
          variant="soft"
          color="logoBlue"
          style={{ marginTop: '0.8rem' }}
          disabled={crewAction.busy || !branch.trim() || branch.trim() === me?.branch}
          onClick={() => {
            if (mustVerifyBranch) trackMeetupQuestView('branch_verify_pick');
            crewAction.run(() =>
              updateMyMeetupMembership({ crewId: crew.crewId, branch })
            );
          }}
        >
          Save branch
        </Button>
      </div>
    ) : null;
  useEffect(() => {
    setAdultKind(crew.adult.kind || 'parent');
    setAdultName(crew.adult.kind === 'teacher' ? '' : crew.adult.name || '');
    setPickedTeacher(crew.adult.teacher || null);
    // the saved teacher is a new object on every reload: follow its id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crew.adult.kind, crew.adult.name, crew.adult.teacher?.userId]);
  // the saved teacher whose request went out (saving them again would change
  // nothing); a teacher saved without a request (a failed send) can be saved
  // again to send it
  const savedTeacherId =
    crew.adult.kind === 'teacher' &&
    crew.adult.request &&
    crew.adult.request.teacherUserId === crew.adult.teacher?.userId &&
    (crew.adult.request.status === 'open' || crew.adult.request.status === 'accepted')
      ? crew.adult.teacher?.userId || 0
      : 0;
  // a Twinkle classroom meetup: the crew names no grown-up (Twinkle arranges it)
  const classroomGrownUp = crew.adult.display?.kind === 'classroom';

  const planEditable =
    viewer.isMember &&
    !viewer.frozen &&
    (crew.plan.status === 'none' || crew.plan.status === 'sent_back');

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
              label="Help me with this step"
              context={{
                kind: 'page',
                label: `my Bridge Builder crew "${crew.displayName}"`,
                path: `/achievements/bridge-builder/crew/${crew.crewId}`,
                excerpt: progress.blocking || 'Every step is done.'
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
      {replacing && (
        <ReplaceMemberModal
          crewId={crew.crewId}
          member={replacing}
          onHide={() => setReplacing(null)}
          onReplaced={onChanged}
        />
      )}
      {confirmRevise && (
        <ConfirmModal
          title="Revise the plan?"
          descriptionFontSize="1.5rem"
          description="The plan goes back for a new check, and any classroom time is paused. Parents who already said yes will see the new version."
          confirmButtonLabel="Revise the plan"
          onHide={() => setConfirmRevise(false)}
          onConfirm={async () => {
            setConfirmRevise(false);
            await planAction.run(() => reviseMeetupPlan(crew.crewId));
          }}
        />
      )}
      <div style={{ height: '1.6rem' }} />

      <StepTracker progress={progress} completed={completed} />
      {crew.status === 'active' && feedbackStep && feedback && (
        <CrewReviewFeedback
          step={feedbackStep}
          review={feedback}
          busy={reviewAction.busy}
          error={reviewAction.error}
          onRequestReview={viewer.isMember
            ? () => reviewAction.run(() => requestMeetupReview({ crewId: crew.crewId, step: feedbackStep }))
            : undefined}
          onManageCrew={feedbackStep === 'crew' && viewer.isFounder ? () => setManageShown(true) : undefined}
        />
      )}

      {completed && (
        <div style={{ marginTop: '1.6rem' }}>
          <QuestNote tone="success">
            Your crew finished the quest
            {crew.tier ? (
              <>
                {' '}
                at <b>{crew.tier.charAt(0).toUpperCase() + crew.tier.slice(1)}</b> tier
              </>
            ) : null}
            ! Everyone who showed up unlocked <b>{achievementTitle}</b>:{' '}
            {crew.members
              .filter((member) => member.attended)
              .map((member) => member.username)
              .join(', ')}
            .
          </QuestNote>
        </div>
      )}
      {(viewer.isMember || viewer.isAdmin) &&
        (completed || (crew.status === 'active' && crew.video.status === 'pending')) && (
          <StoryEntryCard crewId={crew.crewId} completed={completed} />
        )}
      {crew.status === 'disbanded' && (
        <div style={{ marginTop: '1.6rem' }}>
          <QuestNote tone="info">This crew was closed.</QuestNote>
        </div>
      )}

      <StepCard step={stepOf('crew')}>
        {!completed && crew.progress.tierHint && (
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
                : 'Choose your Twinkle branch or "Not a Twinkle student". Your crew needs at least two Twinkle students; other members are welcome too.'}
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
                    size="sm"
                    color="orange"
                    disabled={crewAction.busy}
                    style={{ marginLeft: 'auto' }}
                    onClick={() =>
                      crewAction.run(() =>
                        nudgeMeetupBranch({ crewId: crew.crewId, userId: member.userId })
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
        {viewer.isAdmin && crew.status === 'active' && (
          <div data-admin-review>
            <AdminReview crew={crew} stage="crew" onChanged={onChanged} />
          </div>
        )}
        <AdminInfoChecks crew={crew} onChanged={onChanged} />
        {crewAction.error && (
          <QuestNote tone="warning">{crewAction.error}</QuestNote>
        )}
      </StepCard>

      <StepCard step={stepOf('plan')}>
        {stepOf('plan').state !== 'locked' && (
          <>
            {crew.plan.note &&
              (crew.plan.status === 'sent_back' || crew.plan.status === 'none') && (
                <QuestNote tone="warning">
                  <b>Note: </b>
                  {crew.plan.note}
                </QuestNote>
              )}
            {crew.plan.status === 'approved' && crew.planApprovedBy && (
              <QuestNote tone="success">
                Plan approved by <b>{crew.planApprovedBy.username}</b>
                {crew.plan.note ? (
                  <>
                    {' '}
                    · <b>Note: </b>
                    {crew.plan.note}
                  </>
                ) : null}
              </QuestNote>
            )}
            {crew.plan.note && crew.plan.status === 'approved' && !crew.planApprovedBy && (
              <QuestNote tone="success">
                <b>Admin note: </b>
                {crew.plan.note}
              </QuestNote>
            )}
            {planEditable ? (
              <>
                <ParentSuggestions crew={crew} canRevise={false} onRevise={() => undefined} />
                <ExamplesHint />
                <div>
                  <label className={questLabelClass} htmlFor="meetup-plan-date">
                    Date
                  </label>
                  <DateCalendar
                    id="meetup-plan-date"
                    value={planDate}
                    min={localToday()}
                    max={localDateInDays(365)}
                    placeholder="Pick the meetup date"
                    onChange={setPlanDate}
                  />
                </div>
                <PlanVenue
                  mode={venueMode}
                  branch={venueBranch}
                  other={planArea}
                  onMode={setVenueMode}
                  onBranch={setVenueBranch}
                  onOther={setPlanArea}
                />
                {venueMode === 'home' && (
                  // a classroom's time comes from the slot staff confirm
                  <div>
                    <label className={questLabelClass} htmlFor="meetup-plan-time">
                      Start time
                    </label>
                    <input
                      id="meetup-plan-time"
                      type="time"
                      className={questInputClass}
                      style={{ maxWidth: '16rem' }}
                      min="08:00"
                      max="20:00"
                      step={900}
                      value={planTime}
                      onChange={(event) => setPlanTime(event.target.value)}
                    />
                    <div className={questHelpClass}>Daytime, between 8:00 and 20:00.</div>
                  </div>
                )}
                <div>
                  <label
                    className={questLabelClass}
                    htmlFor="meetup-plan-activity"
                  >
                    What will you do together, and what will you learn?
                  </label>
                  <textarea
                    id="meetup-plan-activity"
                    className={questInputClass}
                    rows={4}
                    maxLength={1000}
                    value={planActivity}
                    placeholder="For example: we each explain one math puzzle in English and build a paper bridge together"
                    onChange={(event) => setPlanActivity(event.target.value)}
                  />
                  {planActivity.trim().length < 20 && (
                    <div className={questHelpClass}>
                      At least 20 letters ({planActivity.trim().length}/20)
                    </div>
                  )}
                </div>
                <div>
                  <Button
                    color="green"
                    loading={planAction.busy}
                    disabled={
                      planAction.busy ||
                      !viewer.canSubmitPlan ||
                      !planDate ||
                      (venueMode === 'home' && !planTime) ||
                      planActivity.trim().length < 20 ||
                      !areaForVenue(venueMode, venueBranch, planArea).trim()
                    }
                    onClick={() =>
                      planAction.run(() =>
                        submitMeetupPlan({
                          crewId: crew.crewId,
                          date: planDate,
                          time: venueMode === 'home' ? planTime : '',
                          area: areaForVenue(venueMode, venueBranch, planArea),
                          activity: planActivity
                        })
                      )
                    }
                  >
                    Send plan for approval
                  </Button>
                  {!viewer.canSubmitPlan && (
                    <div className={questHelpClass}>
                      Staff need to approve your crew first.
                    </div>
                  )}
                </div>
              </>
            ) : crew.plan.status !== 'none' ? (
              <div
                className={css`
                  font-size: 1.4rem;
                  color: ${Color.darkerGray()};
                  display: flex;
                  flex-direction: column;
                  gap: 0.3rem;
                  overflow-wrap: anywhere;
                `}
              >
                <span>
                  <b>Date:</b> {crew.plan.date}
                  {crew.plan.time ? ` at ${crew.plan.time}` : ''}
                </span>
                <span>
                  <b>Area:</b> {crew.plan.area}
                </span>
                <span style={{ whiteSpace: 'pre-wrap' }}>
                  <b>Activity:</b> {crew.plan.activity}
                </span>
              </div>
            ) : null}
            {planAction.error && (
              <QuestNote tone="warning">{planAction.error}</QuestNote>
            )}
            {viewer.isAdmin &&
              crew.status === 'active' &&
              crew.plan.status === 'pending' && (
                <div data-admin-review>
                  <AdminReview crew={crew} stage="plan" onChanged={onChanged} />
                </div>
              )}
          </>
        )}
      </StepCard>

      <div id="grown-up-step">
      <StepCard step={stepOf('grownUp')}>
        {stepOf('grownUp').state !== 'locked' && (
          <>
            {viewer.isAdmin && crew.status === 'active' && (
              <div data-admin-review>
                <AdminReview crew={crew} stage="grownUp" onChanged={onChanged} />
              </div>
            )}
            <ParentSuggestions crew={crew} canRevise={viewer.isMember && (crew.plan.status === 'approved' || crew.plan.status === 'pending') && crew.video.status !== 'pending' && crew.video.status !== 'approved'} onRevise={() => setConfirmRevise(true)} />
            {crew.plan.status === 'approved' && (viewer.isMember || viewer.isAdmin) && (
              <ParentAnswers
                crew={crew}
                myId={myId}
                canReplace={viewer.isFounder && !viewer.frozen}
                onReplace={setReplacing}
              />
            )}
            {crew.parentContacts ? (
              <ParentContactsAdmin
                crewId={crew.crewId}
                contacts={crew.parentContacts}
                onChanged={onChanged}
              />
            ) : null}
            {me && !viewer.frozen && viewer.parentConsent && (
              <AskParentPanel
                crewId={crew.crewId}
                state={viewer.parentConsent}
                onChanged={onChanged}
              />
            )}
            {viewer.isMember && !viewer.detailsLocked && !classroomGrownUp ? (
              <div>
                <span className={questLabelClass}>Which adult is coming?</span>
                <div
                  className={css`
                    display: flex;
                    gap: 0.6rem;
                    flex-wrap: wrap;
                    margin-bottom: 0.6rem;
                  `}
                >
                  {[
                    ['parent', 'A parent'],
                    ['teacher', 'A Twinkle teacher']
                  ]
                    .filter(([value]) => value === 'parent' || !approvedPlanIsHome)
                    .map(([value, label]) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={adultKind === value ? 'solid' : 'outline'}
                      color="logoBlue"
                      aria-pressed={adultKind === value}
                      onClick={() => setAdultKind(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.6rem',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start'
                  }}
                >
                  {adultKind === 'teacher' ? (
                    <TeacherPicker
                      picked={pickedTeacher}
                      disabled={grownUpAction.busy}
                      onPick={setPickedTeacher}
                    />
                  ) : (
                    <input
                      className={questInputClass}
                      style={{ flex: '1 1 20rem' }}
                      value={adultName}
                      maxLength={80}
                      placeholder="For example: Minjun's mom"
                      onChange={(event) => setAdultName(event.target.value)}
                    />
                  )}
                  <Button
                    variant="soft"
                    color="logoBlue"
                    disabled={
                      grownUpAction.busy ||
                      (adultKind === 'teacher'
                        ? !pickedTeacher ||
                          pickedTeacher.userId === savedTeacherId
                        : !adultName.trim())
                    }
                    onClick={() =>
                      grownUpAction.run(() =>
                        adultKind === 'teacher'
                          ? setMeetupCrewAdult({
                              crewId: crew.crewId,
                              kind: 'teacher',
                              teacherUserId: pickedTeacher?.userId
                            })
                          : setMeetupCrewAdult({
                              crewId: crew.crewId,
                              kind: adultKind,
                              name: adultName
                            })
                      )
                    }
                  >
                    Save
                  </Button>
                </div>
                <div className={questHelpClass}>
                  {adultKind === 'teacher'
                    ? 'Only approved Twinkle teachers are listed. When you save, they get a request in their chat, and they count once they say yes.'
                    : 'A name and role only.'}
                </div>
              </div>
            ) : null}
            <AdultComing adult={crew.adult} />
            {grownUpAction.error && (
              <QuestNote tone="warning">{grownUpAction.error}</QuestNote>
            )}
          </>
        )}
      </StepCard>
      </div>

      <StepCard step={stepOf('film')}>
        {stepOf('film').state !== 'locked' && (
          <>
            {crew.plan.status === 'approved' && <VenueNote venue={crew.venue} isHome={venueFromArea(crew.plan.area || '').mode === 'home'} />}
            {crew.video.note && crew.video.status === 'sent_back' && (
              <QuestNote tone="warning">
                <b>Note: </b>
                {crew.video.note}
              </QuestNote>
            )}
            {crew.video.url && (
              <video
                src={crew.video.url}
                controls
                preload="metadata"
                className={css`
                  width: 100%;
                  max-height: 50vh;
                  border-radius: 1rem;
                  background: #000;
                `}
              />
            )}
            {viewer.canSubmitVideo && (
              <>
                <VideoUploader crewId={crew.crewId} onChanged={onChanged} />
              </>
            )}
          </>
        )}
      </StepCard>

      <StepCard step={stepOf('review')}>
        {crew.video.note && crew.video.status === 'approved' && (
          <QuestNote tone="success">
            <b>Admin note: </b>
            {crew.video.note}
          </QuestNote>
        )}
        {viewer.isAdmin &&
          crew.status === 'active' &&
          crew.video.status === 'pending' && (
            <div data-admin-review>
              <AdminReview crew={crew} stage="video" onChanged={onChanged} />
            </div>
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

// Whose parent said yes, so the crew can see who is coming. The founder can
// replace a member whose parent hasn't said yes (no answer, or a no).
function ParentAnswers({
  crew,
  myId,
  canReplace,
  onReplace
}: {
  crew: CrewView;
  myId: number;
  canReplace: boolean;
  onReplace: (member: CrewView['members'][number]) => void;
}) {
  const waiting = crew.members.filter((member) => !member.parentOk);
  return (
    <div>
      <span className={questLabelClass}>Parents&apos; answers</span>
      <ul
        className={css`
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        `}
      >
        {crew.members.map((member) => {
          const answer = member.parentOk ? 'yes' : member.parentSaidNo ? 'no' : 'waiting';
          return (
            <li
              key={member.userId}
              className={css`
                display: flex;
                align-items: center;
                gap: 0.8rem;
                flex-wrap: wrap;
                font-size: 1.4rem;
                padding: 0.5rem 0.8rem;
                border-radius: 0.8rem;
                background: ${Color.extraLightGray(0.5)};
              `}
            >
              <MemberAvatars members={[member]} size="2.4rem" />
              <UsernameText user={{ id: member.userId, username: member.username }} />
              {member.userId === myId && (
                <span style={{ fontSize: '1.2rem', color: Color.darkGray() }}>(you)</span>
              )}
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color:
                    answer === 'yes'
                      ? Color.green()
                      : answer === 'no'
                      ? Color.darkGray()
                      : Color.orange()
                }}
              >
                {answer === 'yes'
                  ? 'Parent said yes'
                  : answer === 'no'
                  ? "Can't come this time"
                  : 'No answer yet'}
              </span>
              {canReplace && answer !== 'yes' && member.userId !== myId && (
                <Button
                  size="sm"
                  variant="soft"
                  color="logoBlue"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => onReplace(member)}
                >
                  Replace
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {canReplace && waiting.some((member) => member.userId !== myId) && (
        <div className={questHelpClass}>
          If a parent can&apos;t answer, you can invite someone else in their
          place. Your plan stays the same.
        </div>
      )}
    </div>
  );
}

// The meetup place/time from the staff: members and staff only.
// Who is coming as the grown-up: a picked Twinkle teacher is shown by their
// username (a link to their profile); a teacher that does not count says why.
function AdultComing({ adult }: { adult: CrewView['adult'] }) {
  const shown = adult.display;
  const rowClass = css`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 1.35rem;
    color: ${Color.darkerGray()};
  `;
  // a classroom names no person: Twinkle arranges the grown-up, and only the
  // confirmed classroom is named
  if (shown?.kind === 'classroom') {
    return (
      <QuestNote tone={shown.status === 'confirmed' ? 'success' : 'info'}>
        <span data-adult-classroom={shown.status}>
          {shown.status === 'confirmed' && shown.name
            ? `Supervised at ${shown.name}. Twinkle arranges the grown-up for classroom meetups.`
            : 'Twinkle arranges the grown-up for classroom meetups. Staff confirm your time slot first.'}
        </span>
      </QuestNote>
    );
  }
  // only a teacher who said yes is "coming"
  if (adult.kind === 'teacher' && adult.teacher && shown?.status === 'confirmed') {
    return (
      <div data-adult-coming className={rowClass}>
        <Icon icon="chalkboard-teacher" style={{ color: Color.logoBlue() }} />
        <span>Coming:</span>
        <b>Twinkle teacher</b>
        <UsernameText
          user={{ id: adult.teacher.userId, username: adult.teacher.username }}
        />
      </div>
    );
  }
  if (
    adult.kind === 'teacher' &&
    adult.teacher &&
    shown?.status === 'waiting' &&
    !(adult.request && adult.request.teacherUserId === adult.teacher.userId)
  ) {
    // saved, but the request never went out (a failed send): say so
    return (
      <QuestNote tone="warning">
        <span data-adult-request-failed>
          The request to {adult.teacher.username} didn't go out. Press Save to
          send it again.
        </span>
      </QuestNote>
    );
  }
  if (adult.kind === 'teacher' && adult.teacher && shown?.status === 'waiting') {
    return (
      <div data-adult-waiting className={rowClass}>
        <Icon icon="hourglass-half" style={{ color: Color.orange() }} />
        <span>Waiting for Twinkle teacher</span>
        <UsernameText
          user={{ id: adult.teacher.userId, username: adult.teacher.username }}
        />
        <span>to confirm. A request is in their chat.</span>
      </div>
    );
  }
  if (adult.kind === 'teacher' && adult.teacherProblem) {
    return (
      <QuestNote tone="warning">
        {adult.teacherProblem.charAt(0).toUpperCase() +
          adult.teacherProblem.slice(1)}
        .
      </QuestNote>
    );
  }
  // the teacher answered "Not me": the crew picks again
  if (!adult.kind && adult.request?.status === 'declined') {
    return (
      <QuestNote tone="warning">
        <span data-adult-declined>
          {adult.request.teacherUsername} can&apos;t come
          {adult.request.afterYes ? ' after all' : ''}. Pick another grown-up.
        </span>
      </QuestNote>
    );
  }
  return null;
}

function VenueNote({ venue, isHome }: { venue: CrewView['venue']; isHome: boolean }) {
  if (!venue || venue.status === 'none' || venue.status === 'cancelled') return null;
  const slot = venue.confirmedSlot;
  if (slot) {
    return (
      <QuestNote tone="success">
        <b>Your meetup:</b>{' '}
        {venue.room ? `${venue.branch} classroom ${venue.room}, ` : ''}
        {formatSlot(slot)}
      </QuestNote>
    );
  }
  if (venue.status === 'offered') {
    return (
      <QuestNote tone="info">
        Classroom offered at <b>{venue.branch}</b> ({venue.room}): waiting for
        the slot to be set up. Offered times: {venue.slots.map(formatSlot).join(' / ')}
      </QuestNote>
    );
  }
  return (
    <QuestNote tone="info">
      {isHome
        ? "Meeting at the member's home, with the parent who hosts."
        : 'Staff are arranging a classroom time. It will show here, and in your crew chat.'}
    </QuestNote>
  );
}

// Parents' suggested changes to the plan: shown in the Grown-up step (with the
// Revise button) and above the plan form while the kids revise.
function ParentSuggestions({
  crew,
  canRevise,
  onRevise
}: {
  crew: CrewView;
  canRevise: boolean;
  onRevise: () => void;
}) {
  if (!crew.parentSuggestions?.length) {
    return canRevise ? (
      <div>
        <Button size="sm" color="logoBlue" variant="soft" onClick={onRevise}>
          Change the plan
        </Button>
      </div>
    ) : null;
  }
  return (
    <QuestNote tone="info">
      <b>Parents suggested:</b>
      <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.8rem' }}>
        {crew.parentSuggestions.map((item) => (
          <li key={`${item.createdAt}-${item.childUsername}`}>
            &ldquo;{item.body}&rdquo; ({item.childUsername}&apos;s parent)
          </li>
        ))}
      </ul>
      {canRevise && (
        <div style={{ marginTop: '0.8rem' }}>
          <Button size="sm" color="logoBlue" variant="soft" onClick={onRevise}>
            Revise the plan
          </Button>
        </div>
      )}
    </QuestNote>
  );
}
