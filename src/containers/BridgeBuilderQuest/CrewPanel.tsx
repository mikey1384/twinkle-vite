import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import UsernameText from '~/components/Texts/UsernameText';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import AdminReview from './AdminReview';
import StepCard, {
  QuestNote,
  questHelpClass,
  questInputClass,
  questLabelClass
} from './StepCard';
import StepTracker from './StepTracker';
import VideoUploader from './VideoUploader';
import useQuestAction from './useQuestAction';
import type { CrewView, QuestStepKey } from './types';

function localToday() {
  const now = new Date();
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
  const leaveMeetupCrew = useAppContext((v) => v.requestHelpers.leaveMeetupCrew);
  const removeMeetupCrewMember = useAppContext(
    (v) => v.requestHelpers.removeMeetupCrewMember
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
  const stepOf = (key: QuestStepKey) =>
    progress.steps.find((step) => step.key === key)!;

  const crewAction = useQuestAction(onChanged);
  const grownUpAction = useQuestAction(onChanged);
  const planAction = useQuestAction(onChanged);

  const [branch, setBranch] = useState(me?.branch || '');
  const [adultKind, setAdultKind] = useState(crew.adult.kind || 'parent');
  const [adultName, setAdultName] = useState(crew.adult.name || '');
  const [planDate, setPlanDate] = useState(crew.plan.date || '');
  const [planArea, setPlanArea] = useState(crew.plan.area || '');
  const [planActivity, setPlanActivity] = useState(crew.plan.activity || '');
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    setBranch(me?.branch || '');
  }, [me?.branch]);
  useEffect(() => {
    setAdultKind(crew.adult.kind || 'parent');
    setAdultName(crew.adult.name || '');
  }, [crew.adult.kind, crew.adult.name]);

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
      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        `}
      >
        <h2
          className={css`
            font-size: 2rem;
            font-weight: bold;
            color: ${Color.black()};
            margin: 0;
          `}
        >
          {viewer.isMember ? 'Your crew' : `Crew #${crew.crewId}`}
          <span
            className={css`
              font-size: 1.3rem;
              font-weight: normal;
              color: ${Color.darkGray()};
              margin-left: 0.8rem;
            `}
          >
            #{crew.crewId}
          </span>
        </h2>
        {viewer.isMember && !viewer.frozen && (
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {confirmLeave ? (
              <>
                <span style={{ fontSize: '1.3rem' }}>Leave this crew?</span>
                <Button
                  size="sm"
                  color="red"
                  loading={crewAction.busy}
                  onClick={() => crewAction.run(() => leaveMeetupCrew(crew.crewId))}
                >
                  Leave
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  color="darkGray"
                  onClick={() => setConfirmLeave(false)}
                >
                  Stay
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                color="darkGray"
                onClick={() => setConfirmLeave(true)}
              >
                <Icon icon="sign-out-alt" style={{ marginRight: '0.5rem' }} />
                Leave crew
              </Button>
            )}
          </div>
        )}
      </div>

      <StepTracker progress={progress} completed={completed} />

      {completed && (
        <div style={{ marginTop: '1.6rem' }}>
          <QuestNote tone="success">
            Your crew finished the quest! Everyone who showed up unlocked{' '}
            <b>{achievementTitle}</b>:{' '}
            {crew.members
              .filter((member) => member.attended)
              .map((member) => member.username)
              .join(', ')}
            .
          </QuestNote>
        </div>
      )}
      {crew.status === 'disbanded' && (
        <div style={{ marginTop: '1.6rem' }}>
          <QuestNote tone="info">This crew was closed.</QuestNote>
        </div>
      )}

      <StepCard step={stepOf('crew')}>
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
                {member.branch}
              </span>
              {member.isFounder && (
                <span style={{ fontSize: '1.2rem', color: Color.darkGray() }}>
                  <Icon icon="crown" style={{ color: Color.gold() }} /> founder
                </span>
              )}
              {viewer.isFounder &&
                !viewer.frozen &&
                member.userId !== myId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    color="red"
                    style={{ marginLeft: 'auto' }}
                    disabled={crewAction.busy}
                    onClick={() =>
                      crewAction.run(() =>
                        removeMeetupCrewMember({
                          crewId: crew.crewId,
                          memberId: member.userId
                        })
                      )
                    }
                  >
                    Remove
                  </Button>
                )}
            </li>
          ))}
        </ul>
        {viewer.isMember && !viewer.detailsLocked && (
          <div>
            <label className={questLabelClass} htmlFor="meetup-my-branch">
              Your Twinkle branch
            </label>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <input
                id="meetup-my-branch"
                className={questInputClass}
                value={branch}
                maxLength={40}
                placeholder="For example: Daechi"
                onChange={(event) => setBranch(event.target.value)}
              />
              <Button
                variant="soft"
                color="logoBlue"
                disabled={crewAction.busy || !branch.trim() || branch.trim() === me?.branch}
                onClick={() =>
                  crewAction.run(() =>
                    updateMyMeetupMembership({ crewId: crew.crewId, branch })
                  )
                }
              >
                Save
              </Button>
            </div>
          </div>
        )}
        {crewAction.error && (
          <QuestNote tone="warning">{crewAction.error}</QuestNote>
        )}
      </StepCard>

      <StepCard step={stepOf('grownUp')}>
        {stepOf('grownUp').state !== 'locked' && (
          <>
            {me && !viewer.frozen && (
              <label
                className={css`
                  display: flex;
                  align-items: flex-start;
                  gap: 0.8rem;
                  font-size: 1.4rem;
                  cursor: pointer;
                `}
              >
                <input
                  type="checkbox"
                  style={{ marginTop: '0.35rem' }}
                  checked={me.parentOk}
                  disabled={grownUpAction.busy}
                  onChange={() =>
                    grownUpAction.run(() =>
                      updateMyMeetupMembership({
                        crewId: crew.crewId,
                        parentOk: !me.parentOk
                      })
                    )
                  }
                />
                <span>
                  <b>My parent knows about this and said yes</b>
                  <span className={questHelpClass} style={{ display: 'block' }}>
                    Only tick this after you really asked. Admins check with
                    teachers before approving anything.
                  </span>
                </span>
              </label>
            )}
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                gap: 0.6rem;
                font-size: 1.3rem;
              `}
            >
              {crew.members.map((member) => (
                <span
                  key={member.userId}
                  style={{
                    color: member.parentOk ? Color.green() : Color.darkGray()
                  }}
                >
                  <Icon icon={member.parentOk ? 'check-circle' : ['far', 'circle']} />{' '}
                  {member.username}
                </span>
              ))}
            </div>
            {viewer.isMember && !viewer.detailsLocked ? (
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
                  ].map(([value, label]) => (
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
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <input
                    className={questInputClass}
                    value={adultName}
                    maxLength={80}
                    placeholder={
                      adultKind === 'teacher'
                        ? 'Name and role, for example: Teacher Kim (Daechi)'
                        : "For example: Minjun's mom"
                    }
                    onChange={(event) => setAdultName(event.target.value)}
                  />
                  <Button
                    variant="soft"
                    color="logoBlue"
                    disabled={grownUpAction.busy || !adultName.trim()}
                    onClick={() =>
                      grownUpAction.run(() =>
                        setMeetupCrewAdult({
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
                  A name and role only. No phone numbers.
                </div>
              </div>
            ) : crew.adult.kind ? (
              <div style={{ fontSize: '1.4rem' }}>
                Adult coming:{' '}
                <b>
                  {crew.adult.kind === 'teacher' ? 'Twinkle teacher' : 'Parent'}:{' '}
                  {crew.adult.name}
                </b>
              </div>
            ) : null}
            {grownUpAction.error && (
              <QuestNote tone="warning">{grownUpAction.error}</QuestNote>
            )}
          </>
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
            {crew.plan.note && crew.plan.status === 'approved' && (
              <QuestNote tone="success">
                <b>Admin note: </b>
                {crew.plan.note}
              </QuestNote>
            )}
            {planEditable ? (
              <>
                <div>
                  <label className={questLabelClass} htmlFor="meetup-plan-date">
                    Date
                  </label>
                  <input
                    id="meetup-plan-date"
                    type="date"
                    className={questInputClass}
                    style={{ maxWidth: '22rem' }}
                    min={localToday()}
                    value={planDate}
                    onChange={(event) => setPlanDate(event.target.value)}
                  />
                </div>
                <div>
                  <label className={questLabelClass} htmlFor="meetup-plan-area">
                    General area
                  </label>
                  <input
                    id="meetup-plan-area"
                    className={questInputClass}
                    maxLength={60}
                    value={planArea}
                    placeholder="A neighbourhood, for example: Mokdong"
                    onChange={(event) => setPlanArea(event.target.value)}
                  />
                  <div className={questHelpClass}>
                    Neighbourhood only. Never an address, a building or a phone
                    number: your crew can share the exact spot with the adult
                    who is coming.
                  </div>
                </div>
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
                    placeholder="For example: visit the science museum and each of us explains one exhibit in English"
                    onChange={(event) => setPlanActivity(event.target.value)}
                  />
                </div>
                <div>
                  <Button
                    color="green"
                    loading={planAction.busy}
                    disabled={planAction.busy || !viewer.canSubmitPlan}
                    onClick={() =>
                      planAction.run(() =>
                        submitMeetupPlan({
                          crewId: crew.crewId,
                          date: planDate,
                          area: planArea,
                          activity: planActivity
                        })
                      )
                    }
                  >
                    Send plan for approval
                  </Button>
                  {!viewer.canSubmitPlan && (
                    <div className={questHelpClass}>
                      Finish steps 1 and 2 first.
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
                <AdminReview crew={crew} stage="plan" onChanged={onChanged} />
              )}
          </>
        )}
      </StepCard>

      <StepCard step={stepOf('film')}>
        {stepOf('film').state !== 'locked' && (
          <>
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
              <VideoUploader crewId={crew.crewId} onChanged={onChanged} />
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
            <AdminReview crew={crew} stage="video" onChanged={onChanged} />
          )}
      </StepCard>
    </div>
  );
}
