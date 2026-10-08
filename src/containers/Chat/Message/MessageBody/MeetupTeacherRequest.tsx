import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import BuildMessageCard, { BuildMessageCardChip } from './BuildMessageCard';
import { Color } from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';
import {
  teacherRequestStatusLine,
  type MeetupTeacherRequestPayload,
  type MeetupTeacherRequestStatus
} from './meetupTeacherRequestState';

// A crew member's request to a Twinkle teacher to be the crew's grown-up at
// its Bridge Builder meetup. The teacher answers "Yes, I'm coming" or "Not
// me"; the student who sent it sees the state. The request is frozen in the
// message; the answer is the server's (stored on the card when given).
export default function MeetupTeacherRequest({
  channelId,
  messageId,
  request,
  myId,
  sender
}: {
  channelId?: number;
  messageId: number;
  request?: MeetupTeacherRequestPayload | null;
  myId: number;
  sender: {
    id: number;
    username: string;
    profileTheme?: string | null;
  };
}) {
  const navigate = useNavigate();
  const answerMeetupTeacherRequest = useAppContext(
    (v) => v.requestHelpers.answerMeetupTeacherRequest
  );
  const onUpdateMessageSettings = useChatContext(
    (v) => v.actions.onUpdateMessageSettings
  );
  const [answered, setAnswered] = useState<MeetupTeacherRequestStatus | null>(
    null
  );
  const [busy, setBusy] = useState<'yes' | 'no' | null>(null);
  const [answeredAfterYes, setAnsweredAfterYes] = useState(false);
  // the server's newer state (a socket update, a reload) wins over our own
  // last answer
  useEffect(() => {
    setAnswered(null);
    setAnsweredAfterYes(false);
  }, [request?.status, request?.answeredAt]);
  const [error, setError] = useState('');

  const crewId = Number(request?.crewId || 0);
  if (!crewId || !request) return null;
  const status: MeetupTeacherRequestStatus =
    answered || request.status || 'open';
  const isTeacher = Number(request.teacherUserId || 0) === Number(myId);
  const isRequester = Number(request.requesterUserId || 0) === Number(myId);
  const teacherUsername = String(request.teacherUsername || 'the teacher');
  const requesterUsername = String(
    request.requesterUsername || sender.username || 'A student'
  );
  const crewName = String(request.crewName || `Crew #${crewId}`);
  const plan = request.plan || null;
  const statusLine = teacherRequestStatusLine({
    status,
    isTeacher,
    teacherUsername,
    afterYes: answeredAfterYes || !!request.afterYes,
    releasedFor: request.releasedFor,
    noReask: !!request.noReask
  });

  return (
    <BuildMessageCard
      bannerIcon="user-shield"
      themeName={sender.profileTheme}
      bannerText={
        isTeacher ? (
          <>Asks you to be a meetup grown-up</>
        ) : (
          <>Grown-up request to {teacherUsername}</>
        )
      }
      title={crewName}
      chips={
        <BuildMessageCardChip icon="users" themeName={sender.profileTheme}>
          Bridge Builder meetup
        </BuildMessageCardChip>
      }
      actions={
        <>
          {isTeacher && status === 'open' ? (
            <>
              <GameCTAButton
                variant="success"
                size="md"
                icon="check"
                shiny
                loading={busy === 'yes'}
                disabled={!!busy}
                onClick={() => handleAnswer('yes')}
              >
                {"Yes, I'm coming"}
              </GameCTAButton>
              <GameCTAButton
                variant="neutral"
                size="md"
                loading={busy === 'no'}
                disabled={!!busy}
                onClick={() => handleAnswer('no')}
              >
                Not me
              </GameCTAButton>
            </>
          ) : null}
          {isTeacher && status === 'accepted' ? (
            <GameCTAButton
              variant="neutral"
              size="md"
              loading={busy === 'no'}
              disabled={!!busy}
              onClick={() => handleAnswer('no')}
            >
              {"I can't make it after all"}
            </GameCTAButton>
          ) : null}
          <GameCTAButton
            variant="neutral"
            size="md"
            icon="external-link-alt"
            onClick={() =>
              navigate(
                String(
                  request.crewPath || `/achievements/bridge-builder/crew/${crewId}`
                )
              )
            }
          >
            Open crew page
          </GameCTAButton>
        </>
      }
    >
      {request.reask ? (
        <div className={reaskClass} data-teacher-request-reask>
          <Icon icon="calendar-day" />
          <span>
            {isTeacher
              ? 'Update: the crew changed its plan (new date and place below). Please confirm again.'
              : `Update: the plan changed, so ${teacherUsername} is asked to confirm the new date and place.`}
          </span>
        </div>
      ) : null}
      <div className={askClass}>
        {isRequester && !isTeacher
          ? `You asked ${teacherUsername} to be the grown-up for crew ${crewName}'s Bridge Builder meetup`
          : isTeacher
            ? `${requesterUsername} asks you to be the grown-up for crew ${crewName}'s Bridge Builder meetup`
            : `${requesterUsername} asked ${teacherUsername} to be the grown-up for crew ${crewName}'s Bridge Builder meetup`}
      </div>

      {plan ? (
        <div className={planClass} data-teacher-request-plan>
          <div className={planRowClass}>
            <span className={labelClass}>When</span>
            <span>
              {plan.date}
              {plan.time ? ` at ${plan.time}` : ''}
            </span>
          </div>
          <div className={planRowClass}>
            <span className={labelClass}>Where</span>
            <span>{plan.area}</span>
          </div>
          <div className={planRowClass}>
            <span className={labelClass}>Activity</span>
            <span>{plan.activity}</span>
          </div>
        </div>
      ) : (
        <div className={mutedClass}>
          The crew is still planning. The crew page shows the plan once staff
          approve it.
        </div>
      )}

      {statusLine ? (
        <div
          data-teacher-request-status={status}
          className={status === 'accepted' ? settledClass : mutedClass}
        >
          <Icon
            icon={
              status === 'accepted'
                ? 'check'
                : status === 'open'
                  ? 'hourglass-half'
                  : 'times'
            }
          />
          <span>{statusLine}</span>
        </div>
      ) : null}

      {error ? <div className={errorClass}>{error}</div> : null}
    </BuildMessageCard>
  );

  async function handleAnswer(answer: 'yes' | 'no') {
    if (busy) return;
    setBusy(answer);
    setError('');
    try {
      const result = await answerMeetupTeacherRequest({ messageId, answer });
      const next = (result?.status || null) as MeetupTeacherRequestStatus | null;
      if (!next) {
        setError('Something went wrong. Please try again.');
        return;
      }
      setAnswered(next);
      setAnsweredAfterYes(!!result?.afterYes);
      // keep the answer in the chat store, so a remount before a reload
      // doesn't bring the buttons back
      if (channelId && request) {
        onUpdateMessageSettings({
          channelId,
          messageId,
          settings: {
            meetupTeacherRequest: {
              ...request,
              status: next,
              afterYes: !!result?.afterYes,
              answeredAt: result?.answeredAt || Math.floor(Date.now() / 1000)
            }
          }
        });
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setBusy(null);
    }
  }
}

const reaskClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  background: ${Color.logoBlue(0.08)};
  color: ${Color.darkerGray()};
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.4;
`;

const askClass = css`
  color: ${Color.black()};
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.45;
`;

const planClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  border: 1px solid ${Color.borderGray()};
  background: ${Color.wellGray()};
  font-size: 1.2rem;
`;

const planRowClass = css`
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const labelClass = css`
  flex: 0 0 6.5rem;
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  font-weight: 800;
`;

const settledClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: ${Color.green()};
  font-size: 1.2rem;
  font-weight: 800;
`;

const mutedClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.4;
`;

const errorClass = css`
  color: ${Color.rose()};
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.4;
`;
